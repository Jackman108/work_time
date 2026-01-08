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

// Определяем путь к БД (аналогично database.ts)
let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
if (!isPortable && process.execPath) {
    const execName = path.basename(process.execPath, '.exe');
    isPortable = execName.includes('portable') || execName.includes('Portable');
}

// В dev режиме __dirname указывает на dist-main, поэтому идём на уровень выше
const projectRoot = __dirname.endsWith('dist-main')
    ? path.dirname(__dirname)
    : __dirname;

const DB_DIR = isPortable
    ? path.join(process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath), 'db')
    : path.join(projectRoot, 'db');
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
    }

    // Создаём новое better-sqlite3 соединение с оптимизациями
    sqliteDbInstance = new Database(DB_PATH, {
        // Оптимизации для производительности
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Критически важные настройки
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
}

// Инициализируем соединение при первой загрузке
createConnection();

// Кеш для проверки инициализации таблиц
let tablesInitialized = false;

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
 * Инициализировать таблицы из схемы
 * Вызывается автоматически при первом запуске (один раз)
 */
function initTables(): void {
    if (tablesInitialized) {
        return; // Уже инициализировано
    }

    try {
        // Оптимизированная проверка наличия всех таблиц одним запросом
        if (checkTablesExist()) {
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
        tablesInitialized = true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[DB] Error initializing schema:', err.message);
        // Продолжаем работу, таблицы могут уже существовать
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

// Инициализируем таблицы при загрузке модуля
initTables();

/**
 * Переинициализировать соединение с базой данных
 * Используется после импорта базы данных
 */
export function reconnectDatabase(): void {
    console.log('[DB] Reconnecting database after import...');
    tablesInitialized = false; // Сбрасываем флаг инициализации
    createConnection();
    initTables(); // Повторно инициализируем таблицы
}

// Обработка закрытия приложения
process.on('beforeExit', () => {
    if (sqliteDbInstance) {
        sqliteDbInstance.close();
    }
});

// Функция для получения актуального соединения
function getDbConnection(): ReturnType<typeof drizzle> {
    if (!drizzleDbInstance) {
        createConnection();
    }
    return drizzleDbInstance!;
}

// Экспортируем Drizzle клиент и схемы
const db = getDbConnection();
export default db;
export { db, schema };
export * from './schema';

// Экспортируем sqlite для случаев, когда нужен прямой доступ
export const sqliteDb = sqliteDbInstance;
export type { Database as SqliteDatabase } from 'better-sqlite3';

