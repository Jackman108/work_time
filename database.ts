/**
 * Модуль для работы с базой данных SQLite через Drizzle ORM
 * Реализует инициализацию БД и миграции с использованием Drizzle
 * 
 * @module database
 */

import * as path from 'path';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import type { ExtendedDatabase } from './services/base/BaseService';

// Конфигурация базы данных
let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
if (!isPortable && process.execPath) {
    const execName = path.basename(process.execPath, '.exe');
    isPortable = execName.includes('portable') || execName.includes('Portable');
}

const projectRoot = __dirname.endsWith('dist-main')
    ? path.dirname(__dirname)
    : __dirname;

const DB_DIR = isPortable
    ? path.join(process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath), 'db')
    : path.join(projectRoot, 'db');
const DB_PATH = path.join(DB_DIR, 'app.db');

// Логирование для диагностики
if (process.env.APP_IS_PACKAGED === 'true') {
    console.log('[DB] Portable mode:', !!isPortable);
    console.log('[DB] DB_DIR:', DB_DIR);
    console.log('[DB] DB_PATH:', DB_PATH);
}

/**
 * Создать директорию для БД, если она не существует
 */
function ensureDbDirectory(): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

ensureDbDirectory();

/**
 * Очистить временные и устаревшие файлы БД
 * Удаляет app_temp_*, app_corrupted_*, *.backup.* файлы старше 24 часов
 */
function cleanupOldDatabaseFiles(): void {
    try {
        if (!fs.existsSync(DB_DIR)) {
            return;
        }

        const files = fs.readdirSync(DB_DIR);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 часа
        let deletedCount = 0;

        files.forEach(file => {
            // Пропускаем основной файл БД, директории и метаданные
            if (file === 'app.db' || file === 'backups' || file === 'backups_metadata.json' ||
                file === 'index.ts' || file === 'schema.ts') {
                return;
            }

            const filePath = path.join(DB_DIR, file);

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
                            console.log(`[DB] Deleted old temporary file: ${file}`);
                        } catch (e) {
                            console.warn(`[DB] Could not delete file ${file}:`, (e as Error).message);
                        }
                    }
                }
            } catch (e) {
                // Игнорируем ошибки чтения файла
            }
        });

        if (deletedCount > 0) {
            console.log(`[DB] Cleanup completed: ${deletedCount} old file(s) deleted`);
        }
    } catch (error) {
        console.error('[DB] Error during cleanup:', (error as Error).message);
    }
}

// Запускаем очистку при старте приложения
cleanupOldDatabaseFiles();

/**
 * Проверить, является ли файл валидной базой данных SQLite
 */
function isValidDatabase(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    try {
        const testDb = new Database(filePath, { readonly: true });
        const result = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
        testDb.close();
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Создать резервную копию поврежденного файла БД
 */
function backupCorruptedDatabase(filePath: string): void {
    try {
        const corruptedBackupPath = path.join(DB_DIR, `app_corrupted_${Date.now()}.db`);
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, corruptedBackupPath);
            console.warn(`[DB] Corrupted database file saved as: ${corruptedBackupPath}`);
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[DB] Error creating backup of corrupted file:', err.message);
    }
}

// Проверяем валидность существующего файла БД
let db: ExtendedDatabase | null = null;
let dbPathToUse = DB_PATH;

if (fs.existsSync(DB_PATH)) {
    if (!isValidDatabase(DB_PATH)) {
        console.error('[DB] Database file is corrupted or not a valid SQLite database');
        backupCorruptedDatabase(DB_PATH);
        try {
            fs.unlinkSync(DB_PATH);
            console.log('[DB] Corrupted database file deleted, new database will be created');
        } catch (error) {
            const err = error as Error & { code?: string };
            if (err.code === 'EBUSY') {
                const corruptedPath = path.join(DB_DIR, `app_corrupted_${Date.now()}.db`);
                try {
                    fs.renameSync(DB_PATH, corruptedPath);
                    console.log(`[DB] Corrupted database file renamed to: ${corruptedPath}`);
                } catch (renameError) {
                    const renameErr = renameError instanceof Error ? renameError : new Error(String(renameError));
                    console.error('[DB] Failed to rename corrupted database file:', renameErr.message);
                    dbPathToUse = path.join(DB_DIR, `app_temp_${Date.now()}.db`);
                    console.warn(`[DB] Using temporary database path: ${dbPathToUse}`);
                }
            } else {
                console.error('[DB] Error deleting corrupted database file:', err.message);
                throw err;
            }
        }
    }
}

// Создаём/открываем базу данных
try {
    db = new Database(dbPathToUse) as ExtendedDatabase;
    if (db) {
        db.pragma('foreign_keys = ON');
        console.log(`[DB] Database successfully opened: ${dbPathToUse}`);
    }
} catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message && err.message.includes('not a database')) {
        console.error('[DB] Database file is corrupted:', err.message);
        if (fs.existsSync(dbPathToUse)) {
            backupCorruptedDatabase(dbPathToUse);
            try {
                fs.unlinkSync(dbPathToUse);
                console.log('[DB] Corrupted database file deleted');
                dbPathToUse = DB_PATH;
            } catch (unlinkError) {
                const unlinkErr = unlinkError as Error & { code?: string };
                if (unlinkErr.code === 'EBUSY') {
                    const corruptedPath = path.join(DB_DIR, `app_corrupted_${Date.now()}.db`);
                    try {
                        fs.renameSync(dbPathToUse, corruptedPath);
                        console.log(`[DB] Corrupted database file renamed to: ${corruptedPath}`);
                        dbPathToUse = DB_PATH;
                    } catch (renameError) {
                        const renameErr = renameError instanceof Error ? renameError : new Error(String(renameError));
                        console.error('[DB] Failed to rename corrupted database file:', renameErr.message);
                        dbPathToUse = path.join(DB_DIR, `app_temp_${Date.now()}.db`);
                        console.warn(`[DB] Using temporary database path: ${dbPathToUse}`);
                    }
                } else {
                    throw unlinkErr;
                }
            }
        }
        try {
            db = new Database(dbPathToUse) as ExtendedDatabase;
            if (db) {
                db.pragma('foreign_keys = ON');
                console.log(`[DB] New database created after corruption detected: ${dbPathToUse}`);
            }
        } catch (createError) {
            const createErr = createError instanceof Error ? createError : new Error(String(createError));
            console.error('[DB] Critical error creating new database:', createErr.message);
            throw new Error('Failed to create database. Check permissions for db/ folder');
        }
    } else {
        console.error('[DB] Critical error opening database:', err.message);
        throw err;
    }
}

/**
 * Инициализация структуры базы данных с использованием Drizzle
 */
function initDB(): void {
    if (!db) {
        throw new Error('База данных не инициализирована');
    }

    try {
        // Проверяем соединение
        if (db && db.prepare) {
            db.prepare('SELECT 1').get();
        } else {
            throw new Error('Database connection is invalid');
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (err.message && err.message.includes('not a database')) {
            throw new Error('Файл базы данных поврежден. Перезапустите приложение для автоматического восстановления.');
        }
        throw err;
    }

    // Инициализация таблиц происходит автоматически через db/index.ts
    // Импортируем его, чтобы триггернуть инициализацию
    try {
        require('./db');
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn('[DB] Error initializing database schema:', err.message);
        // Продолжаем работу, таблицы могут уже существовать
    }
}

/**
 * Выполнить функцию в транзакции
 */
function transaction<T>(fn: () => T): T {
    if (!db || !db.transaction) {
        throw new Error('Database connection is not available');
    }
    const txn = db.transaction(fn as any);
    return txn();
}

// Инициализация БД
initDB();

/**
 * Закрыть соединение с базой данных
 */
export function closeDatabase(): void {
    if (db) {
        try {
            db.close();
            console.log('[DB] Database connection closed');
            db = null;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[DB] Error closing database:', err.message);
            throw err;
        }
    }
}

/**
 * Переоткрыть базу данных
 */
export function reopenDatabase(): ExtendedDatabase {
    // Всегда закрываем старое соединение перед переоткрытием
    if (db) {
        try {
            db.close();
            console.log('[DB] Old database connection closed');
        } catch (e) {
            // Игнорируем ошибки закрытия
        }
        db = null;
    }

    try {
        // Проверяем, что файл БД существует
        if (!fs.existsSync(dbPathToUse)) {
            throw new Error(`Database file not found: ${dbPathToUse}`);
        }

        console.log(`[DB] Opening database: ${dbPathToUse}`);
        db = new Database(dbPathToUse) as ExtendedDatabase;
        db.pragma('foreign_keys = ON');

        (db as any).transaction = transaction;
        db.dbPath = dbPathToUse;
        db.closeDatabase = closeDatabase;
        db.reopenDatabase = reopenDatabase;

        // Проверяем соединение сразу после открытия
        try {
            db.prepare('SELECT 1').get();
            console.log('[DB] Database connection verified');
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            console.error('[DB] Error verifying connection:', err.message);
            throw new Error('Database connection verification failed: ' + err.message);
        }

        // Повторная инициализация
        try {
            initDB();
        } catch (migrationError) {
            const migrationErr = migrationError instanceof Error ? migrationError : new Error(String(migrationError));
            console.warn('[DB] Migration warning during reopen:', migrationErr.message);
        }

        const moduleId = require.resolve('./database');
        delete require.cache[moduleId];

        console.log(`[DB] Database reopened successfully: ${dbPathToUse}`);
        return db;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[DB] Error reopening database:', err.message);
        db = null;
        throw err;
    }
}

// Добавляем методы к объекту БД
if (db) {
    (db as any).transaction = transaction;
    (db as ExtendedDatabase).dbPath = dbPathToUse;
    (db as ExtendedDatabase).closeDatabase = closeDatabase;
    (db as ExtendedDatabase).reopenDatabase = reopenDatabase;
}

// Экспортируем БД
export default db as ExtendedDatabase;
export { dbPathToUse as dbPath };
