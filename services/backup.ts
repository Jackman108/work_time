/**
 * Сервис для резервного копирования и восстановления базы данных
 * @module services/backup
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';
import { reopenDatabase, closeDatabase } from '../database';
import type { ExtendedDatabase } from './base/BaseService';
import type { Types } from 'types';

/**
 * Получить актуальную ссылку на базу данных
 * Использует database.ts модуль с очисткой кеша
 */
function getDb(): ExtendedDatabase {
    // Очищаем кеш модуля для получения актуальной ссылки
    delete require.cache[require.resolve('../database')];
    const dbModule = require('../database');
    return dbModule.default as ExtendedDatabase;
}

/**
 * Получить директорию для резервных копий
 */
function getDefaultBackupDirectory(): string {
    let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
    if (!isPortable && process.execPath) {
        const execName = path.basename(process.execPath, '.exe');
        isPortable = execName.includes('portable') || execName.includes('Portable');
    }

    if (isPortable) {
        const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
        return path.join(exeDir, 'backups');
    }

    if (app && app.isPackaged) {
        return path.join(path.dirname(process.execPath), 'backups');
    }

    // В режиме разработки используем db/backups
    const dbDir = path.join(__dirname, '..', 'db');
    return path.join(dbDir, 'backups');
}

/**
 * Очистить старые временные файлы из папки db
 * Удаляет app_temp_*, app_corrupted_*, *.backup.* файлы старше 24 часов
 */
export function cleanupOldBackupFiles(): { deletedCount: number; message: string } {
    try {
        const dbDir = path.join(__dirname, '..', 'db');
        if (!fs.existsSync(dbDir)) {
            return { deletedCount: 0, message: 'Database directory not found' };
        }

        const files = fs.readdirSync(dbDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 часа
        let deletedCount = 0;

        files.forEach(file => {
            // Пропускаем основной файл БД, директории и метаданные
            if (file === 'app.db' || file === 'backups' || file === 'backups_metadata.json' ||
                file === 'index.ts' || file === 'schema.ts') {
                return;
            }

            const filePath = path.join(dbDir, file);

            // Проверяем, что это файл (не директория)
            try {
                const stats = fs.statSync(filePath);
                if (!stats.isFile()) {
                    return;
                }

                // Проверяем возраст файла
                const fileAge = now - stats.mtimeMs;

                // Удаляем временные и устаревшие файлы
                if (file.startsWith('app_temp_') ||
                    file.startsWith('app_corrupted_') ||
                    file.includes('.backup.') ||
                    file.endsWith('.db-shm') ||
                    file.endsWith('.db-wal')) {

                    // Удаляем файлы старше 24 часов
                    if (fileAge > maxAge) {
                        try {
                            fs.unlinkSync(filePath);
                            deletedCount++;
                            console.log(`[Backup] Deleted old temporary file: ${file}`);
                        } catch (e) {
                            console.warn(`[Backup] Could not delete file ${file}:`, (e as Error).message);
                        }
                    }
                }
            } catch (e) {
                // Игнорируем ошибки чтения файла
            }
        });

        const message = deletedCount > 0
            ? `Удалено ${deletedCount} старых временных файлов`
            : 'Нет старых файлов для удаления';

        console.log(`[Backup] Cleanup completed: ${message}`);
        return { deletedCount, message };
    } catch (error) {
        const errorMessage = 'Ошибка при очистке файлов: ' + (error as Error).message;
        console.error('[Backup]', errorMessage);
        return { deletedCount: 0, message: errorMessage };
    }
}

/**
 * Вычислить MD5 хеш файла
 */
function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Найти дубликат резервной копии по хешу
 */
async function findDuplicateBackup(fileHash: string): Promise<string | null> {
    const backupDir = getDefaultBackupDirectory();
    if (!fs.existsSync(backupDir)) {
        return null;
    }

    const metadataPath = path.join(backupDir, 'backups_metadata.json');
    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
            backups?: Array<{ hash: string; path: string }>;
        };
        const existing = metadata.backups?.find(b => b.hash === fileHash);
        return existing ? existing.path : null;
    } catch (error) {
        console.error('[Backup] Error reading metadata:', (error as Error).message);
        return null;
    }
}

/**
 * Сгенерировать уникальный путь для резервной копии
 */
function generateUniqueBackupPath(backupDir: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filePath = path.join(backupDir, `backup_${timestamp}.db`);
    let counter = 1;

    while (fs.existsSync(filePath)) {
        filePath = path.join(backupDir, `backup_${timestamp}_${counter}.db`);
        counter++;
    }

    return filePath;
}

/**
 * Обновить метаданные резервных копий
 * Удаляет дубликаты (бэкапы с таким же хешем)
 */
async function updateBackupMetadata(backupPath: string, fileHash: string): Promise<void> {
    const backupDir = getDefaultBackupDirectory();
    const metadataPath = path.join(backupDir, 'backups_metadata.json');

    let metadata: { backups: Array<{ path: string; hash: string; createdAt: string }> } = { backups: [] };
    if (fs.existsSync(metadataPath)) {
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as typeof metadata;
        } catch (error) {
            console.error('[Backup] Error reading metadata:', (error as Error).message);
        }
    }

    metadata.backups = metadata.backups || [];

    // Удаляем дубликаты (бэкапы с таким же хешем, но другим путём)
    const beforeCount = metadata.backups.length;
    metadata.backups = metadata.backups.filter(b => {
        if (b.hash === fileHash && b.path !== backupPath) {
            // Удаляем старый дубликат
            console.log('[Backup] Removing duplicate backup from metadata:', b.path);
            // Удаляем файл, если он существует
            if (fs.existsSync(b.path)) {
                try {
                    fs.unlinkSync(b.path);
                    console.log('[Backup] Duplicate file deleted:', b.path);
                } catch (e) {
                    console.warn('[Backup] Could not delete duplicate file:', b.path, (e as Error).message);
                }
            }
            return false; // Удаляем из метаданных
        }
        return true; // Оставляем в метаданных
    });

    const removedCount = beforeCount - metadata.backups.length;
    if (removedCount > 0) {
        console.log(`[Backup] Removed ${removedCount} duplicate backup(s) from metadata`);
    }

    // Проверяем, нет ли уже записи с таким же путём
    const existingIndex = metadata.backups.findIndex(b => b.path === backupPath);
    if (existingIndex >= 0) {
        // Обновляем существующую запись
        metadata.backups[existingIndex] = {
            path: backupPath,
            hash: fileHash,
            createdAt: metadata.backups[existingIndex].createdAt || new Date().toISOString()
        };
    } else {
        // Добавляем новую запись
        metadata.backups.push({
            path: backupPath,
            hash: fileHash,
            createdAt: new Date().toISOString()
        });
    }

    // Сортируем по дате создания (новые сначала)
    metadata.backups.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
}

/**
 * Получить путь к директории exe файла
 */
export function getExeDirectory(): string {
    let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
    if (!isPortable && process.execPath) {
        const execName = path.basename(process.execPath, '.exe');
        isPortable = execName.includes('portable') || execName.includes('Portable');
    }

    if (isPortable) {
        return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    }

    if (app && app.isPackaged) {
        return path.dirname(process.execPath);
    }

    // В режиме разработки используем корень проекта
    return path.join(__dirname, '..');
}

/**
 * Экспортировать базу данных в директорию exe (одна уникальная копия)
 */
export async function exportDatabaseToExeDir(): Promise<Types.BackupExportResult> {
    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Database connection is not available');
    }

    const exeDir = getExeDirectory();
    if (!fs.existsSync(exeDir)) {
        fs.mkdirSync(exeDir, { recursive: true });
    }

    const backupPath = path.join(exeDir, 'app_backup.db');

    // Удаляем старую копию, если существует
    if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
    }

    // Копируем текущую БД
    fs.copyFileSync(db.dbPath, backupPath);

    return {
        success: true,
        message: 'База данных успешно экспортирована в директорию программы',
        path: backupPath
    };
}

/**
 * Экспортировать базу данных
 */
export async function exportDatabase(): Promise<Types.BackupExportResult> {
    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Database connection is not available');
    }

    const backupDir = getDefaultBackupDirectory();
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = generateUniqueBackupPath(backupDir);
    fs.copyFileSync(db.dbPath, backupPath);

    const fileHash = await calculateFileHash(backupPath);
    await updateBackupMetadata(backupPath, fileHash);

    return {
        success: true,
        message: 'База данных успешно экспортирована',
        path: backupPath
    };
}

/**
 * Импортировать базу данных из файла
 */
export async function importDatabaseFromFile(filePath: string): Promise<Types.BackupImportResult> {
    console.log('[Backup] importDatabaseFromFile called with filePath:', filePath);
    console.log('[Backup] filePath type:', typeof filePath);

    if (!filePath) {
        throw new Error('File path is required');
    }

    const normalizedPath = typeof filePath === 'string' ? filePath : String(filePath);
    console.log('[Backup] normalizedPath:', normalizedPath);
    console.log('[Backup] fs.existsSync(normalizedPath):', fs.existsSync(normalizedPath));

    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Backup file not found: ${normalizedPath}`);
    }

    // Проверяем, что файл является валидной базой данных SQLite
    try {
        const testDb = new Database(normalizedPath, { readonly: true });
        testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
        testDb.close();
    } catch (error) {
        console.error('[Backup] Error validating database file:', (error as Error).message);
        throw new Error('Выбранный файл не является валидной базой данных SQLite: ' + (error as Error).message);
    }

    // Проверяем на дубликаты по хешу (уникальность бэкапов)
    console.log('[Backup] Checking for duplicate backup...');
    const fileHash = await calculateFileHash(normalizedPath);
    const duplicate = await findDuplicateBackup(fileHash);

    if (duplicate && fs.existsSync(duplicate)) {
        console.log('[Backup] Duplicate backup found:', duplicate);
        // Если это дубликат, всё равно импортируем, но сообщаем об этом
        // Пользователь может захотеть импортировать тот же файл снова
        // Можно также вернуть ошибку, если нужно запретить импорт дубликатов
    }

    // Получаем путь к текущей БД
    let currentDbPath: string;
    try {
        const db = getDb();
        if (db && db.dbPath) {
            currentDbPath = db.dbPath;
        } else {
            // Если соединение недоступно, получаем путь из модуля database
            delete require.cache[require.resolve('../database')];
            const dbModule = require('../database');
            currentDbPath = dbModule.dbPath || dbModule.default?.dbPath;
        }
    } catch (e) {
        // Если не удалось получить через getDb, пробуем напрямую из модуля
        delete require.cache[require.resolve('../database')];
        const dbModule = require('../database');
        currentDbPath = dbModule.dbPath;
    }

    if (!currentDbPath) {
        throw new Error('Database connection is not available - cannot determine database path');
    }

    try {
        // Получаем текущее соединение и закрываем его
        const db = getDb();
        if (db) {
            closeDatabase();
        }

        // Закрываем Drizzle соединение тоже
        try {
            const dbModule = require('../db');
            if (dbModule.sqliteDb && typeof dbModule.sqliteDb.close === 'function') {
                dbModule.sqliteDb.close();
            }
        } catch (e) {
            // Игнорируем ошибки закрытия Drizzle
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const backupPath = currentDbPath + '.backup.' + Date.now();
        if (fs.existsSync(currentDbPath)) {
            fs.copyFileSync(currentDbPath, backupPath);
        }

        console.log('[Backup] Copying from', normalizedPath, 'to', currentDbPath);
        fs.copyFileSync(normalizedPath, currentDbPath);

        // Проверяем, что файл действительно скопирован
        if (!fs.existsSync(currentDbPath)) {
            throw new Error('Failed to copy database file');
        }
        console.log('[Backup] Database file copied successfully');

        await new Promise(resolve => setTimeout(resolve, 300));

        // Очищаем кеш модулей перед переоткрытием
        delete require.cache[require.resolve('../database')];
        delete require.cache[require.resolve('../db')];
        delete require.cache[require.resolve('./base/BaseService')];

        // Переоткрываем соединение через database.ts ПЕРВЫМ
        console.log('[Backup] Reopening database connection...');
        const reopenedDb = reopenDatabase();
        console.log('[Backup] Database reopened, checking connection...');

        // Проверяем, что соединение действительно открыто
        try {
            if (reopenedDb && reopenedDb.prepare) {
                reopenedDb.prepare('SELECT 1').get();
                console.log('[Backup] Database connection verified');
            } else {
                throw new Error('Reopened database connection is invalid');
            }
        } catch (e) {
            console.error('[Backup] Error verifying reopened connection:', (e as Error).message);
            throw new Error('Failed to verify reopened database connection: ' + (e as Error).message);
        }

        // Ждём немного для завершения переоткрытия
        await new Promise(resolve => setTimeout(resolve, 200));

        // Теперь переинициализируем Drizzle соединение из db/index.ts
        // КРИТИЧНО: это должно быть после переоткрытия database.ts
        try {
            // Закрываем старое Drizzle соединение, если оно есть
            try {
                delete require.cache[require.resolve('../db')];
                const oldDbModule = require('../db');
                if (oldDbModule.sqliteDb && typeof oldDbModule.sqliteDb.close === 'function') {
                    oldDbModule.sqliteDb.close();
                    console.log('[Backup] Old Drizzle connection closed');
                }
            } catch (e) {
                // Игнорируем ошибки закрытия
            }

            // Ждём немного
            await new Promise(resolve => setTimeout(resolve, 100));

            // Переинициализируем Drizzle соединение
            delete require.cache[require.resolve('../db')];
            const dbModule = require('../db');
            if (dbModule.reconnectDatabase && typeof dbModule.reconnectDatabase === 'function') {
                dbModule.reconnectDatabase();
                console.log('[Backup] Drizzle connection reinitialized');
            } else {
                console.warn('[Backup] reconnectDatabase function not found in db module');
            }
        } catch (e) {
            console.error('[Backup] Failed to reconnect Drizzle:', (e as Error).message);
            throw new Error('Failed to reconnect Drizzle: ' + (e as Error).message);
        }

        // Очищаем кеш модуля database еще раз после переоткрытия
        delete require.cache[require.resolve('../database')];
        delete require.cache[require.resolve('../db')];
        delete require.cache[require.resolve('./base/BaseService')];
        delete require.cache[require.resolve('../services/projects')];
        delete require.cache[require.resolve('../services/employees')];
        delete require.cache[require.resolve('../services/materials')];

        // Очищаем кеш всех сервисов
        const servicesToRefresh = [
            '../services/projects',
            '../services/employees',
            '../services/materials',
            '../services/workLog',
            '../services/materialLog',
            '../services/projectPayments',
            '../services/reports'
        ];

        servicesToRefresh.forEach(servicePath => {
            try {
                const resolvedPath = require.resolve(servicePath);
                delete require.cache[resolvedPath];
            } catch (e) {
                // Игнорируем ошибки, если модуль не найден
            }
        });

        // Ждём больше времени для завершения инициализации
        await new Promise(resolve => setTimeout(resolve, 500));

        // Получаем новое соединение, очищая кеш перед этим
        delete require.cache[require.resolve('../database')];
        delete require.cache[require.resolve('../db')];
        delete require.cache[require.resolve('./base/BaseService')];

        // Проверяем database.ts соединение
        let newDb: ExtendedDatabase | null = null;
        try {
            newDb = getDb();
            if (!newDb || !newDb.prepare) {
                throw new Error('Database connection is null or invalid');
            }
            newDb.prepare('SELECT 1').get();
            console.log('[Backup] database.ts connection verified');
        } catch (error) {
            console.error('[Backup] Error verifying database.ts connection:', (error as Error).message);
            throw new Error('Не удалось переоткрыть соединение с базой данных после импорта: ' + (error as Error).message);
        }

        // КРИТИЧНО: Проверяем Drizzle соединение и что данные действительно обновились
        try {
            // Ждём еще немного для завершения переинициализации Drizzle
            await new Promise(resolve => setTimeout(resolve, 300));

            delete require.cache[require.resolve('../db')];
            const dbModule = require('../db');
            const db = dbModule.db;

            if (!db) {
                throw new Error('Drizzle db is null');
            }

            // Пытаемся выполнить запрос через Drizzle для проверки
            if (dbModule.projects) {
                const testQuery = db.select().from(dbModule.projects).limit(1).all();
                console.log('[Backup] Drizzle connection verified, test query returned', testQuery.length, 'rows');

                // Проверяем, что данные действительно изменились - читаем количество проектов
                const projectsCount = db.select().from(dbModule.projects).all().length;
                console.log('[Backup] Current projects count after import:', projectsCount);
            } else {
                console.warn('[Backup] Could not verify Drizzle connection - projects not available');
            }
        } catch (drizzleError) {
            console.error('[Backup] Error verifying Drizzle connection:', (drizzleError as Error).message);
            // Это критическая ошибка - бросаем исключение
            throw new Error('Failed to verify Drizzle connection after import: ' + (drizzleError as Error).message);
        }

        // Ждём еще немного перед перезагрузкой сервисов
        await new Promise(resolve => setTimeout(resolve, 300));

        // Перезагружаем сервисы через global.reloadServices
        // КРИТИЧНО: это должно быть последним шагом, чтобы все модули получили новые соединения
        if ((global as any).reloadServices && typeof (global as any).reloadServices === 'function') {
            try {
                console.log('[Backup] Reloading services...');
                (global as any).reloadServices();
                console.log('[Backup] Services reloaded via global.reloadServices');

                // Ждём завершения перезагрузки
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.error('[Backup] Error calling global.reloadServices:', (e as Error).message);
            }
        } else {
            console.warn('[Backup] global.reloadServices is not available. Application restart might be required.');
        }

        // Финальная проверка - пытаемся прочитать данные из новой БД через обновленные сервисы
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            // Очищаем кеш всех модулей еще раз
            delete require.cache[require.resolve('../db')];
            delete require.cache[require.resolve('../services/projects')];

            const dbModule = require('../db');
            const testQuery = dbModule.db.select().from(dbModule.projects).limit(1).all();
            console.log('[Backup] Final test query successful, database imported correctly');
            console.log('[Backup] Import verification: can read', testQuery.length, 'project(s) from imported database');
        } catch (e) {
            console.error('[Backup] Error: Could not verify data after import:', (e as Error).message);
            // Не бросаем ошибку, но логируем - это может быть проблемой
        }

        // Сохраняем импортированный файл в папку backups с проверкой дубликатов
        try {
            const backupDir = getDefaultBackupDirectory();
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Проверяем, есть ли уже файл с таким же хешем
            const existingDuplicate = await findDuplicateBackup(fileHash);
            if (existingDuplicate && fs.existsSync(existingDuplicate)) {
                console.log('[Backup] Duplicate backup found with same hash, removing old file:', existingDuplicate);
                try {
                    // Удаляем старый файл-дубликат
                    fs.unlinkSync(existingDuplicate);
                    console.log('[Backup] Old duplicate file deleted');
                } catch (e) {
                    console.warn('[Backup] Could not delete old duplicate file:', (e as Error).message);
                }
            }

            // Генерируем уникальное имя для сохранения
            const backupFileName = path.basename(normalizedPath);
            let savedBackupPath = path.join(backupDir, backupFileName);

            // Если файл с таким именем уже существует, генерируем новое имя
            let counter = 1;
            while (fs.existsSync(savedBackupPath)) {
                const nameWithoutExt = path.parse(backupFileName).name;
                const ext = path.parse(backupFileName).ext;
                savedBackupPath = path.join(backupDir, `${nameWithoutExt}_${counter}${ext}`);
                counter++;
            }

            // Копируем файл только если его еще нет
            if (!fs.existsSync(savedBackupPath)) {
                fs.copyFileSync(normalizedPath, savedBackupPath);
                console.log('[Backup] Imported file saved to backups directory:', savedBackupPath);
            }

            // Обновляем метаданные (удаляет все дубликаты с таким же хешем)
            await updateBackupMetadata(savedBackupPath, fileHash);
            console.log('[Backup] Backup metadata updated, duplicates removed');
        } catch (e) {
            console.warn('[Backup] Warning: Could not save to backups directory:', (e as Error).message);
        }

        return {
            success: true,
            message: 'База данных успешно импортирована',
            backupPath: duplicate || undefined,
            isDuplicate: !!duplicate
        };
    } catch (error) {
        console.error('[Backup] Error during importDatabaseFromFile:', (error as Error).message);
        throw error;
    }
}

/**
 * Импортировать базу данных
 */
export async function importDatabase(filePath: string | null = null): Promise<Types.BackupImportResult> {
    if (!filePath) {
        throw new Error('File path is required');
    }

    if (!fs.existsSync(filePath)) {
        throw new Error('Backup file not found');
    }

    // Проверяем, не является ли это дубликатом
    const fileHash = await calculateFileHash(filePath);
    const duplicate = await findDuplicateBackup(fileHash);
    if (duplicate && fs.existsSync(duplicate)) {
        return {
            success: true,
            message: 'Эта резервная копия уже существует',
            backupPath: duplicate,
            isDuplicate: true
        };
    }

    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Database connection is not available');
    }

    // Закрываем текущее соединение
    closeDatabase();

    // Копируем файл резервной копии
    fs.copyFileSync(filePath, db.dbPath);

    // Ждём немного, чтобы файл был освобождён
    await new Promise(resolve => setTimeout(resolve, 200));

    // Переоткрываем базу данных
    reopenDatabase();

    // Получаем новое соединение через getDb()
    const newDb = getDb();

    // Проверяем соединение
    try {
        if (!newDb || !newDb.prepare) {
            throw new Error('Database connection is null or invalid');
        }
        newDb.prepare('SELECT 1').get();
    } catch (error) {
        throw new Error('Не удалось переоткрыть соединение с базой данных');
    }

    // Сохраняем резервную копию в папку backups с проверкой дубликатов
    const backupDir = getDefaultBackupDirectory();
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Проверяем, есть ли уже файл с таким же хешем
    const existingDuplicate = await findDuplicateBackup(fileHash);
    if (existingDuplicate && fs.existsSync(existingDuplicate)) {
        console.log('[Backup] Duplicate backup found with same hash, removing old file:', existingDuplicate);
        try {
            // Удаляем старый файл-дубликат
            fs.unlinkSync(existingDuplicate);
            console.log('[Backup] Old duplicate file deleted');
        } catch (e) {
            console.warn('[Backup] Could not delete old duplicate file:', (e as Error).message);
        }
    }

    const backupFileName = path.basename(filePath);
    if (!backupFileName) {
        throw new Error('Invalid file path');
    }

    // Генерируем уникальное имя для сохранения
    let backupPath = path.join(backupDir, backupFileName);
    let counter = 1;
    while (fs.existsSync(backupPath)) {
        const nameWithoutExt = path.parse(backupFileName).name;
        const ext = path.parse(backupFileName).ext;
        backupPath = path.join(backupDir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
    }

    // Копируем файл только если его еще нет
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log('[Backup] Imported file saved to backups directory:', backupPath);
    }

    // Обновляем метаданные (удаляет все дубликаты с таким же хешем)
    await updateBackupMetadata(backupPath, fileHash);
    console.log('[Backup] Backup metadata updated, duplicates removed');

    return {
        success: true,
        message: 'База данных успешно импортирована',
        backupPath: backupPath
    };
}

/**
 * Создать автоматическую резервную копию
 */
export async function createAutoBackup(): Promise<Types.BackupExportResult> {
    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Database connection is not available');
    }

    const backupDir = getDefaultBackupDirectory();
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = generateUniqueBackupPath(backupDir);
    fs.copyFileSync(db.dbPath, backupPath);

    const fileHash = await calculateFileHash(backupPath);

    // Проверяем на дубликаты
    const duplicate = await findDuplicateBackup(fileHash);
    if (duplicate && fs.existsSync(duplicate)) {
        // Удаляем только что созданный файл, так как дубликат уже существует
        fs.unlinkSync(backupPath);
        return {
            success: true,
            message: 'Автоматическая резервная копия не создана (дубликат уже существует)',
            path: duplicate
        };
    }

    await updateBackupMetadata(backupPath, fileHash);

    return {
        success: true,
        message: 'Автоматическая резервная копия создана',
        path: backupPath
    };
}

/**
 * Получить список всех резервных копий
 */
export async function getBackupList(): Promise<Types.BackupListResult> {
    const backupDir = getDefaultBackupDirectory();
    const metadataPath = path.join(backupDir, 'backups_metadata.json');

    if (!fs.existsSync(metadataPath)) {
        return {
            success: true,
            backups: []
        };
    }

    try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
            backups?: Array<{ path: string; createdAt: string; hash?: string }>;
        };
        const backups = (metadata.backups || []).filter(b => fs.existsSync(b.path));
        return {
            success: true,
            backups: backups.map(b => ({
                path: b.path,
                createdAt: b.createdAt,
                hash: b.hash
            }))
        };
    } catch (error) {
        console.error('[Backup] Error reading backup list:', (error as Error).message);
        return {
            success: true,
            backups: []
        };
    }
}

/**
 * Удалить резервную копию
 */
export async function deleteBackup(filePath: string): Promise<{ success: boolean; message: string }> {
    if (!filePath) {
        throw new Error('File path is required');
    }

    if (!fs.existsSync(filePath)) {
        throw new Error('Backup file not found');
    }

    fs.unlinkSync(filePath);

    // Обновляем метаданные
    const backupDir = getDefaultBackupDirectory();
    const metadataPath = path.join(backupDir, 'backups_metadata.json');

    if (fs.existsSync(metadataPath)) {
        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
                backups?: Array<{ path: string }>;
            };
            metadata.backups = (metadata.backups || []).filter(b => b.path !== filePath);
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        } catch (error) {
            console.error('[Backup] Error updating metadata:', (error as Error).message);
        }
    }

    return {
        success: true,
        message: 'Резервная копия успешно удалена'
    };
}

