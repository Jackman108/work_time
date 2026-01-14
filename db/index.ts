/**
 * Drizzle ORM клиент для работы с базой данных
 * Использует better-sqlite3 напрямую
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as path from 'path';
import * as fs from 'fs';
import * as schema from './schema';

// Определяем путь к БД используя общие утилиты
import { getDatabaseDirectory, getProjectRoot } from '@services/utils/pathUtils';
const DB_DIR = getDatabaseDirectory();
const projectRoot = getProjectRoot(__dirname);
const DB_PATH = path.join(DB_DIR, 'app.db');

// Создаём директорию для БД, если она не существует
function ensureDbDirectory(): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

ensureDbDirectory();

// Переменные для хранения соединений (могут быть переинициализированы)
let sqliteDbInstance: Database.Database | null = null;
let drizzleDbInstance: ReturnType<typeof drizzle> | null = null;

// Переменная для отслеживания времени последнего изменения файла БД
let lastDbFileModTime: number = 0;

// Флаг для принудительного пересоздания соединения
// Используется после восстановления бэкапа
let forceReconnect: boolean = false;

// Кеш для проверки инициализации таблиц
// КРИТИЧНО: Должен быть объявлен ДО createConnection(), так как initTables() использует его
let tablesInitialized = false;

/**
 * Создать новое соединение с базой данных
 */
function createConnection(): void {
    // Закрываем старое соединение, если оно существует
    if (sqliteDbInstance) {
        try {
            sqliteDbInstance.close();
        } catch (e) {
            // Игнорируем ошибки закрытия
        }
        sqliteDbInstance = null;
    }

    // Сбрасываем Drizzle экземпляр
    drizzleDbInstance = null;

    // Создаём новое better-sqlite3 соединение с оптимизациями
    const actualDbPath = path.resolve(DB_PATH);
    sqliteDbInstance = new Database(actualDbPath);

    // Проверяем целостность БД после открытия (если файл существовал)
    if (fs.existsSync(actualDbPath) && sqliteDbInstance) {
        try {
            const integrityCheck = sqliteDbInstance.prepare("PRAGMA integrity_check").get() as { 'integrity_check': string };
            if (integrityCheck['integrity_check'] !== 'ok') {
                console.error(`[DB] Database corrupted: ${integrityCheck['integrity_check']}`);
                // Закрываем поврежденное соединение
                try {
                    sqliteDbInstance.close();
                } catch (e) {
                    // Игнорируем
                }
                sqliteDbInstance = null;

                // Сохраняем поврежденный файл и создаем новый
                const backupPath = actualDbPath + '.corrupted.' + Date.now();
                try {
                    fs.renameSync(actualDbPath, backupPath);
                    console.log(`[DB] Поврежденная БД сохранена как: ${backupPath}`);
                } catch (e) {
                    // Если переименование не удалось, удаляем поврежденный файл
                    try {
                        fs.unlinkSync(actualDbPath);
                    } catch (e2) {
                        // Игнорируем
                    }
                }

                // Создаем новую БД
                sqliteDbInstance = new Database(actualDbPath);
                console.log('[DB] New database created');
            }
        } catch (e) {
            // Если проверка не удалась, возможно БД новая - проверяем, что соединение работает
            if (sqliteDbInstance) {
                try {
                    sqliteDbInstance.prepare('SELECT 1').get();
                } catch (e2) {
                    // БД действительно повреждена
                    console.error('[DB] БД повреждена и не может быть использована');
                    try {
                        sqliteDbInstance.close();
                    } catch (e3) {
                        // Игнорируем
                    }
                    sqliteDbInstance = null;

                    // Сохраняем поврежденный файл и создаем новый
                    const backupPath = actualDbPath + '.corrupted.' + Date.now();
                    try {
                        if (fs.existsSync(actualDbPath)) {
                            fs.renameSync(actualDbPath, backupPath);
                        }
                    } catch (e4) {
                        // Игнорируем
                    }

                    // Создаем новую БД
                    sqliteDbInstance = new Database(actualDbPath);
                }
            }
        }
    }

    // Проверяем, что соединение создано
    if (!sqliteDbInstance) {
        throw new Error('Failed to create database connection');
    }

    // Обновляем время модификации файла
    try {
        if (fs.existsSync(actualDbPath)) {
            lastDbFileModTime = fs.statSync(actualDbPath).mtimeMs;
        }
    } catch (e) {
        // Игнорируем
    }

    // Критически важные настройки
    if (!sqliteDbInstance) {
        throw new Error('Database connection is not available');
    }

    sqliteDbInstance.pragma('foreign_keys = ON');

    // Оптимизация: включаем WAL режим для лучшей производительности и конкурентного доступа
    try {
        sqliteDbInstance.pragma('journal_mode = WAL');
        // WAL checkpoint для оптимизации размера файла
        sqliteDbInstance.pragma('wal_autocheckpoint = 1000');
    } catch (error) {
        // Игнорируем ошибку, если режим не поддерживается
    }

    // Оптимизации для производительности
    try {
        // Увеличиваем кеш страниц для лучшей производительности
        sqliteDbInstance.pragma('cache_size = -64000'); // 64MB кеша
        // Оптимизация для INSERT/UPDATE операций
        sqliteDbInstance.pragma('synchronous = NORMAL');
        // Включаем оптимизацию запросов
        sqliteDbInstance.pragma('optimize');
    } catch (error) {
        // Игнорируем ошибки, если настройки не поддерживаются
    }

    // Создаём Drizzle клиент
    drizzleDbInstance = drizzle(sqliteDbInstance, { schema });

    // КРИТИЧНО: После создания соединения инициализируем таблицы
    // Это гарантирует, что при первом запуске (когда БД не существует) создастся базовая структура
    initTables();
}

// Инициализируем соединение при первой загрузке
createConnection();

/**
 * Проверить, существуют ли все необходимые таблицы
 * Использует оптимизированный запрос
 */
function checkTablesExist(): boolean {
    if (!sqliteDbInstance) {
        return false;
    }
    const requiredCount = 6; // projects, employees, materials, work_log, material_log, project_payments
    const result = sqliteDbInstance.prepare(`
        SELECT COUNT(*) as count 
        FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('projects', 'employees', 'materials', 'work_log', 'material_log', 'project_payments')
    `).get() as { count: number };

    return result.count === requiredCount;
}

/**
 * Проверить и добавить недостающие колонки в таблицы
 */
function migrateTableColumns(): void {
    if (!sqliteDbInstance) {
        return;
    }

    try {
        // Проверяем и добавляем недостающие колонки в таблицу projects
        const projectsColumns = sqliteDbInstance.prepare("PRAGMA table_info(projects)").all() as Array<{ name: string; type: string }>;
        const existingColumns = new Set(projectsColumns.map(col => col.name.toLowerCase()));

        // Список обязательных колонок для таблицы projects
        const requiredColumns = [
            { name: 'description', type: 'TEXT' },
            { name: 'address', type: 'TEXT' },
            { name: 'date_start', type: 'TEXT' },
            { name: 'date_end', type: 'TEXT' },
        ];

        for (const col of requiredColumns) {
            if (!existingColumns.has(col.name.toLowerCase())) {
                console.log(`[DB] Adding missing column '${col.name}' to table 'projects'...`);
                sqliteDbInstance.prepare(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`).run();
            }
        }

        // Проверяем и добавляем недостающие колонки в таблицу employees
        const employeesColumns = sqliteDbInstance.prepare("PRAGMA table_info(employees)").all() as Array<{ name: string; type: string }>;
        const existingEmployeesColumns = new Set(employeesColumns.map(col => col.name.toLowerCase()));

        const requiredEmployeesColumns = [
            { name: 'hire_date', type: 'TEXT' },
        ];

        for (const col of requiredEmployeesColumns) {
            if (!existingEmployeesColumns.has(col.name.toLowerCase())) {
                console.log(`[DB] Adding missing column '${col.name}' to table 'employees'...`);
                sqliteDbInstance.prepare(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`).run();
            }
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn('[DB] Error migrating table columns:', err.message);
    }
}

/**
 * Инициализировать таблицы из схемы
 * Вызывается автоматически при первом запуске (один раз)
 */
function initTables(): void {
    if (tablesInitialized) {
        // Всегда проверяем и добавляем недостающие колонки, даже если таблицы уже инициализированы
        migrateTableColumns();
        return;
    }

    try {
        // КРИТИЧНО: Если БД не существует, создаем базовую БД с полной структурой
        const dbExists = fs.existsSync(DB_PATH);
        if (!dbExists) {
            console.log('[DB] Database not found, will create new database with base structure...');
            // Создаем директорию для БД, если её нет
            ensureDbDirectory();
        }

        // Оптимизированная проверка наличия всех таблиц одним запросом
        // Если БД только что создана, таблиц еще нет, поэтому пропускаем проверку
        if (dbExists && checkTablesExist()) {
            // Таблицы существуют, но нужно проверить колонки
            migrateTableColumns();
            tablesInitialized = true;
            return;
        }

        console.log('[DB] Initializing database schema...');

        // Пытаемся использовать миграции, если они есть
        try {
            const migrationsDir = path.join(projectRoot, 'drizzle');
            if (fs.existsSync(migrationsDir) && drizzleDbInstance) {
                migrate(drizzleDbInstance, { migrationsFolder: migrationsDir });
                console.log('[DB] Database schema initialized from migrations');
                migrateTableColumns(); // Проверяем колонки после миграций
                tablesInitialized = true;
                return;
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.warn('[DB] Migration failed, using direct table creation:', err.message);
        }

        // Если миграций нет, создаём таблицы напрямую через SQL
        if (!sqliteDbInstance || !drizzleDbInstance) {
            throw new Error('Database connection is not initialized');
        }
        console.log('[DB] Creating tables directly...');
        createTablesDirectly();
        migrateTableColumns(); // Проверяем колонки после создания таблиц
        tablesInitialized = true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[DB] Error initializing schema:', err.message);
        // Продолжаем работу, таблицы могут уже существовать
        // Но все равно пытаемся мигрировать колонки
        migrateTableColumns();
    }
}

/**
 * Создать таблицы напрямую через SQL
 * Используется только если нет миграций
 */
function createTablesDirectly(): void {
    if (!sqliteDbInstance) {
        throw new Error('Database connection is not initialized');
    }
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            date_start TEXT,
            date_end TEXT,
            budget REAL DEFAULT 0,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            wage_per_hour REAL DEFAULT 0,
            phone TEXT,
            hire_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            unit TEXT DEFAULT 'шт',
            price_per_unit REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS work_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            salary_per_day REAL DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            UNIQUE(employee_id, project_id, date)
        );
        
        CREATE TABLE IF NOT EXISTS material_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS project_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_work_log_employee ON work_log(employee_id);
        CREATE INDEX IF NOT EXISTS idx_work_log_project ON work_log(project_id);
        CREATE INDEX IF NOT EXISTS idx_work_log_date ON work_log(date);
        CREATE INDEX IF NOT EXISTS idx_work_log_project_date ON work_log(project_id, date);
        CREATE INDEX IF NOT EXISTS idx_work_log_employee_date ON work_log(employee_id, date);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_work_log_unique ON work_log(employee_id, project_id, date);
        CREATE INDEX IF NOT EXISTS idx_material_log_material ON material_log(material_id);
        CREATE INDEX IF NOT EXISTS idx_material_log_project ON material_log(project_id);
        CREATE INDEX IF NOT EXISTS idx_material_log_date ON material_log(date);
        CREATE INDEX IF NOT EXISTS idx_material_log_project_date ON material_log(project_id, date);
        CREATE INDEX IF NOT EXISTS idx_material_log_material_project ON material_log(material_id, project_id);
        CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
        CREATE INDEX IF NOT EXISTS idx_project_payments_project_date ON project_payments(project_id, date);
        CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
        CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
        CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
    `;

    // Используем транзакцию для атомарного создания всех таблиц
    sqliteDbInstance.transaction(() => {
        sqliteDbInstance!.exec(createTablesSQL);
    })();

    console.log('[DB] Tables created successfully');
}

// Инициализация таблиц теперь происходит в createConnection()
// Это гарантирует, что таблицы создаются сразу после открытия соединения

/**
 * Переинициализировать соединение с базой данных
 * Используется после импорта базы данных
 */
export function reconnectDatabase(): void {
    // Оптимизация: если соединение уже открыто и файл не изменился, не переоткрываем
    if (sqliteDbInstance && drizzleDbInstance && tablesInitialized) {
        try {
            // Быстрая проверка: пробуем выполнить запрос
            sqliteDbInstance.prepare('SELECT 1').get();
            // Соединение активно, не переоткрываем
            return;
        } catch (e) {
            // Соединение неактивно, переоткрываем
        }
    }

    // Закрываем старое соединение полностью
    if (sqliteDbInstance) {
        try {
            sqliteDbInstance.close();
        } catch (e) {
            // Игнорируем ошибки закрытия
        }
        sqliteDbInstance = null;
    }

    // Сбрасываем Drizzle экземпляр
    drizzleDbInstance = null;

    // Сбрасываем флаг инициализации
    tablesInitialized = false;

    // Создаем новое соединение (таблицы инициализируются автоматически в createConnection)
    createConnection();
}

/**
 * Установить флаг принудительного переподключения
 * Используется после восстановления бэкапа для гарантии обновления соединений
 */
export function setForceReconnect(): void {
    forceReconnect = true;
    console.log('[DB] Force reconnect flag set');
}

/**
 * Сбросить флаг принудительного переподключения
 * Используется после успешной проверки данных
 */
export function resetForceReconnect(): void {
    forceReconnect = false;
    console.log('[DB] Force reconnect flag reset');
}

/**
 * Обновить время модификации БД после операций записи
 * Это гарантирует, что соединение будет обновлено и увидит новые данные
 */
export function updateLastDbModTime(): void {
    try {
        if (fs.existsSync(DB_PATH)) {
            const currentModTime = fs.statSync(DB_PATH).mtimeMs;
            const walPath = DB_PATH + '-wal';
            const walModTime = fs.existsSync(walPath) ? fs.statSync(walPath).mtimeMs : currentModTime;
            // Используем максимальное время модификации (основной файл или WAL)
            lastDbFileModTime = Math.max(currentModTime, walModTime);
        }
    } catch (e) {
        // Игнорируем ошибки
    }
}

// Обработка закрытия приложения (только один раз)
if (!process.listenerCount('beforeExit')) {
    process.on('beforeExit', () => {
        if (sqliteDbInstance) {
            try {
                sqliteDbInstance.close();
            } catch (e) {
                // Игнорируем
            }
        }
    });
}

/**
 * Получить актуальное соединение с базой данных
 * Оптимизированная версия с кешированием проверок
 * @returns {ReturnType<typeof drizzle>} Drizzle экземпляр
 */
function getDbConnection(): ReturnType<typeof drizzle> {
    // КРИТИЧНО: Если установлен флаг принудительного переподключения, пересоздаем соединение
    if (forceReconnect) {
        forceReconnect = false; // Сбрасываем флаг после использования
        createConnection();
        return drizzleDbInstance!;
    }

    // Проверяем, что соединение существует и открыто
    if (!sqliteDbInstance || !drizzleDbInstance) {
        createConnection();
        return drizzleDbInstance!;
    }

    // Оптимизация: проверяем соединение только если оно может быть неактивным
    // Вместо проверки при каждом обращении, проверяем только при необходимости
    try {
        // Быстрая проверка соединения (не выполняем запрос, просто проверяем наличие)
        if (!sqliteDbInstance.open) {
            createConnection();
            return drizzleDbInstance!;
        }

        // Проверяем изменение файла БД только периодически (не при каждом обращении)
        // Это оптимизация производительности - проверка файловой системы дорогая
        const shouldCheckFileMod = Math.random() < 0.1; // Проверяем только в 10% случаев

        if (shouldCheckFileMod) {
            try {
                if (fs.existsSync(DB_PATH)) {
                    const currentModTime = fs.statSync(DB_PATH).mtimeMs;
                    const walPath = DB_PATH + '-wal';
                    const walModTime = fs.existsSync(walPath) ? fs.statSync(walPath).mtimeMs : 0;

                    // Если основной файл или WAL файл изменились значительно, пересоздаем соединение
                    // Используем порог в 1 секунду, чтобы избежать ложных срабатываний
                    const timeDiff = Math.max(
                        Math.abs(currentModTime - lastDbFileModTime),
                        walModTime > 0 ? Math.abs(walModTime - lastDbFileModTime) : 0
                    );

                    if (timeDiff > 1000 && lastDbFileModTime > 0) {
                        createConnection();
                        return drizzleDbInstance!;
                    }
                }
            } catch (e) {
                // Игнорируем ошибки проверки файла
            }
        }
    } catch (e) {
        // Соединение закрыто или повреждено - пересоздаем
        createConnection();
    }

    return drizzleDbInstance!;
}

/**
 * Получить актуальное соединение с БД
 * Экспортируем функцию вместо Proxy для лучшей производительности и явности
 * @returns {ReturnType<typeof drizzle>} Drizzle экземпляр
 */
export function getDb(): ReturnType<typeof drizzle> {
    return getDbConnection();
}

// Экспортируем Drizzle клиент через Proxy для обратной совместимости
// ОПТИМИЗАЦИЯ: Proxy используется только для совместимости со старым кодом
// В новом коде рекомендуется использовать функцию getDb() напрямую
const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
        // Получаем актуальное соединение
        const actualDb = getDbConnection();

        const value = (actualDb as any)[prop];
        if (typeof value === 'function') {
            // Привязываем контекст к актуальному соединению
            return value.bind(actualDb);
        }
        return value;
    }
});

export default db;
export { db, schema };
export * from './schema';

// Экспортируем sqlite через функцию для безопасности
export function getSqliteDb(): Database.Database {
    if (!sqliteDbInstance) {
        createConnection();
    }
    if (!sqliteDbInstance) {
        throw new Error('Database connection is not available');
    }
    return sqliteDbInstance;
}

// Для обратной совместимости экспортируем геттер через Proxy
export const sqliteDb: Database.Database = new Proxy({} as Database.Database, {
    get(_target, prop) {
        const db = getSqliteDb();
        const value = (db as any)[prop];
        if (typeof value === 'function') {
            return value.bind(db);
        }
        return value;
    }
}) as Database.Database;

export type { Database as SqliteDatabase } from 'better-sqlite3';

