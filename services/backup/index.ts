/**
 * Сервис для резервного копирования и восстановления базы данных
 * Использует BackupManager для управления файлами бэкапов
 * 
 * @module services/backup
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
// Импорты через require для избежания циклических зависимостей
const databaseModule = require('../database');
const dbModule = require('../db');
import { backupManager } from './BackupManager';
import type { ExtendedDatabase } from '../base/BaseService';
import type { Types } from 'types';

/**
 * Получить актуальную ссылку на базу данных
 */
function getDb(): ExtendedDatabase {
    delete require.cache[require.resolve('../database')];
    const dbModule = require('../database');
    return dbModule.default as ExtendedDatabase;
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

    return path.join(__dirname, '..', '..');
}

/**
 * Получить путь к текущей базе данных
 */
function getCurrentDatabasePath(): string {
    try {
        const db = getDb();
        if (db && db.dbPath) {
            return db.dbPath;
        }
    } catch (e) {
        // Игнорируем ошибки
    }

    // Пробуем получить из модуля database
    try {
        delete require.cache[require.resolve('../database')];
        const dbModule = require('../database');
        return dbModule.dbPath;
    } catch (e) {
        throw new Error('Не удалось определить путь к базе данных');
    }
}

/**
 * Экспортировать базу данных в директорию exe (одна уникальная копия)
 */
export async function exportDatabaseToExeDir(): Promise<Types.BackupExportResult> {
    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Соединение с базой данных недоступно');
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
 * Экспортировать базу данных в папку backups
 */
export async function exportDatabase(): Promise<Types.BackupExportResult> {
    const db = getDb();
    if (!db || !db.dbPath) {
        throw new Error('Соединение с базой данных недоступно');
    }

    if (!fs.existsSync(db.dbPath)) {
        throw new Error('Файл базы данных не найден');
    }

    try {
        const metadata = await backupManager.createBackupFromFile(db.dbPath);

        return {
            success: true,
            message: 'База данных успешно экспортирована',
            path: metadata.path
        };
    } catch (error) {
        throw new Error(`Ошибка экспорта базы данных: ${(error as Error).message}`);
    }
}

/**
 * Импортировать базу данных из файла
 */
export async function importDatabaseFromFile(filePath: string): Promise<Types.BackupImportResult> {
    if (!filePath) {
        throw new Error('Путь к файлу не указан');
    }

    const normalizedPath = path.resolve(filePath);

    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Файл не найден: ${normalizedPath}`);
    }

    // Валидация файла через BackupManager
    try {
        // Валидируем файл (BackupManager делает это внутри)
        const testDb = require('better-sqlite3').default || require('better-sqlite3');
        const db = new testDb(normalizedPath, { readonly: true });
        db.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
        db.close();
    } catch (error) {
        throw new Error(`Файл не является валидной базой данных SQLite: ${(error as Error).message}`);
    }

    // Получаем путь к текущей БД
    const currentDbPath = getCurrentDatabasePath();
    if (!currentDbPath) {
        throw new Error('Не удалось определить путь к текущей базе данных');
    }

    // Создаем резервную копию текущей БД перед импортом
    const rollbackPath = currentDbPath + '.rollback.' + Date.now();
    let rollbackCreated = false;

    try {
        // Закрываем соединения
        const db = getDb();
        if (db && databaseModule.closeDatabase) {
            databaseModule.closeDatabase();
        }

        // Закрываем Drizzle соединение
        try {
            if (dbModule.sqliteDb && typeof dbModule.sqliteDb.close === 'function') {
                dbModule.sqliteDb.close();
            }
        } catch (e) {
            // Игнорируем ошибки
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Создаем резервную копию текущей БД
        if (fs.existsSync(currentDbPath)) {
            fs.copyFileSync(currentDbPath, rollbackPath);
            rollbackCreated = true;
        }

        // Копируем импортируемый файл
        fs.copyFileSync(normalizedPath, currentDbPath);

        // Проверяем, что файл скопирован
        if (!fs.existsSync(currentDbPath)) {
            throw new Error('Не удалось скопировать файл базы данных');
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Переоткрываем соединение через database.ts
        if (databaseModule.reopenDatabase) {
            databaseModule.reopenDatabase();
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Переинициализируем Drizzle соединение
        try {
            delete require.cache[require.resolve('../db')];
            if (dbModule.reconnectDatabase) {
                dbModule.reconnectDatabase();
            }
        } catch (e) {
            console.warn('[Backup] Failed to reconnect Drizzle:', (e as Error).message);
        }

        // Очищаем кеш модулей
        delete require.cache[require.resolve('../database')];
        delete require.cache[require.resolve('../db')];
        delete require.cache[require.resolve('./base/BaseService')];

        // Проверяем соединение
        await new Promise(resolve => setTimeout(resolve, 300));

        const newDb = getDb();
        if (!newDb || !newDb.prepare) {
            throw new Error('Соединение с базой данных недействительно');
        }

        newDb.prepare('SELECT 1').get();

        // Проверяем Drizzle соединение
        try {
            delete require.cache[require.resolve('../db')];
            const dbModule = require('../db');
            const db = dbModule.db;
            if (db && dbModule.projects) {
                db.select().from(dbModule.projects).limit(1).all();
            }
        } catch (e) {
            throw new Error(`Ошибка проверки Drizzle соединения: ${(e as Error).message}`);
        }

        // Перезагружаем сервисы
        if ((global as any).reloadServices && typeof (global as any).reloadServices === 'function') {
            try {
                (global as any).reloadServices();
            } catch (e) {
                console.error('[Backup] Error reloading services:', (e as Error).message);
            }
        }

        // Сохраняем импортированный файл в папку backups через BackupManager
        try {
            await backupManager.createBackupFromFile(normalizedPath);
        } catch (e) {
            console.warn('[Backup] Could not save imported file to backups:', (e as Error).message);
        }

        // Удаляем резервную копию, так как импорт успешен
        if (rollbackCreated && fs.existsSync(rollbackPath)) {
            try {
                fs.unlinkSync(rollbackPath);
            } catch (e) {
                // Игнорируем ошибки удаления
            }
        }

        return {
            success: true,
            message: 'База данных успешно импортирована'
        };

    } catch (error) {
        // Восстанавливаем из резервной копии при ошибке
        if (rollbackCreated && fs.existsSync(rollbackPath)) {
            try {
                console.log('[Backup] Restoring from rollback...');
                fs.copyFileSync(rollbackPath, currentDbPath);
                await new Promise(resolve => setTimeout(resolve, 200));
                if (databaseModule.reopenDatabase) {
                    databaseModule.reopenDatabase();
                }
                delete require.cache[require.resolve('../db')];
                if (dbModule.reconnectDatabase) {
                    dbModule.reconnectDatabase();
                }
                await new Promise(resolve => setTimeout(resolve, 200));
                delete require.cache[require.resolve('../database')];
                getDb();
            } catch (restoreError) {
                console.error('[Backup] Failed to restore from rollback:', (restoreError as Error).message);
            }
        }

        throw new Error(`Ошибка импорта базы данных: ${(error as Error).message}`);
    }
}

/**
 * Импортировать базу данных (альтернативная функция)
 */
export async function importDatabase(filePath: string | null = null): Promise<Types.BackupImportResult> {
    if (!filePath) {
        throw new Error('Путь к файлу не указан');
    }

    // Используем основную функцию импорта
    return importDatabaseFromFile(filePath);
}

/**
 * Создать автоматическую резервную копию
 */
export async function createAutoBackup(): Promise<Types.BackupExportResult> {
    return exportDatabase();
}

/**
 * Получить список бэкапов
 */
export async function getBackupList(): Promise<Types.BackupListResult> {
    try {
        // Синхронизируем метаданные с файлами
        backupManager.syncMetadataWithFiles();

        const backups = backupManager.getBackupList();

        const result = backups.map(backup => {
            const stats = fs.existsSync(backup.path) ? fs.statSync(backup.path) : null;
            return {
                path: backup.path,
                createdAt: backup.createdAt,
                hash: backup.hash
            };
        });

        return {
            success: true,
            backups: result,
            message: `Найдено ${result.length} резервных копий`
        };
    } catch (error) {
        throw new Error(`Ошибка получения списка бэкапов: ${(error as Error).message}`);
    }
}

/**
 * Удалить бэкап
 */
export async function deleteBackup(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
        const deleted = backupManager.deleteBackup(filePath);
        if (deleted) {
            return {
                success: true,
                message: 'Резервная копия успешно удалена'
            };
        } else {
            return {
                success: false,
                message: 'Резервная копия не найдена'
            };
        }
    } catch (error) {
        throw new Error(`Ошибка удаления бэкапа: ${(error as Error).message}`);
    }
}

/**
 * Очистить старые временные файлы
 */
export function cleanupOldBackupFiles(): { deletedCount: number; message: string } {
    try {
        const dbDir = path.join(__dirname, '..', '..', 'db');
        if (!fs.existsSync(dbDir)) {
            return { deletedCount: 0, message: 'Директория базы данных не найдена' };
        }

        const files = fs.readdirSync(dbDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 часа
        let deletedCount = 0;

        files.forEach(file => {
            if (file === 'app.db' || file === 'backups' || file === 'backups_metadata.json' ||
                file === 'index.ts' || file === 'schema.ts') {
                return;
            }

            const filePath = path.join(dbDir, file);

            try {
                const stats = fs.statSync(filePath);
                if (!stats.isFile()) {
                    return;
                }

                const fileAge = now - stats.mtimeMs;

                if (file.startsWith('app_temp_') ||
                    file.startsWith('app_corrupted_') ||
                    file.includes('.backup.') ||
                    file.includes('.rollback.') ||
                    file.endsWith('.db-shm') ||
                    file.endsWith('.db-wal')) {

                    if (fileAge > maxAge) {
                        try {
                            fs.unlinkSync(filePath);
                            deletedCount++;
                        } catch (e) {
                            // Игнорируем ошибки
                        }
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        });

        const message = deletedCount > 0
            ? `Удалено ${deletedCount} старых временных файлов`
            : 'Нет старых файлов для удаления';

        return { deletedCount, message };
    } catch (error) {
        return {
            deletedCount: 0,
            message: 'Ошибка при очистке файлов: ' + (error as Error).message
        };
    }
}

