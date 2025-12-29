/**
 * Модуль для работы с базой данных SQLite через better-sqlite3
 * Реализует инициализацию БД, миграции и поддержку транзакций
 * Следует принципам Single Responsibility и DRY
 * 
 * @module database
 */

const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

// Конфигурация базы данных
const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'app.db');

/**
 * Создать директорию для БД, если она не существует
 */
function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Создаём директорию перед открытием БД
ensureDbDirectory();

// Создаём/открываем базу данных
// Включаем поддержку внешних ключей для целостности данных
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON'); // Включаем проверку внешних ключей

/**
 * Инициализация структуры базы данных
 * Создаёт все необходимые таблицы и индексы
 */
function initDB() {
  const schema = `
    -- Таблица проектов (строительных объектов)
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        date_start DATE,
        date_end DATE,
        budget REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Таблица сотрудников
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        wage_per_hour REAL DEFAULT 0,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Таблица материалов
    CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unit TEXT DEFAULT 'шт',
        price_per_unit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Таблица учёта списания материалов
    CREATE TABLE IF NOT EXISTS material_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        date DATE NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    
    -- Таблица учёта поступлений денег на проекты
    CREATE TABLE IF NOT EXISTS project_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        date DATE NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    
    -- Таблица учёта заработанных денег работниками
    CREATE TABLE IF NOT EXISTS work_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        date DATE NOT NULL,
        salary_per_day REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    
    -- Индексы для ускорения запросов
    CREATE INDEX IF NOT EXISTS idx_work_log_employee ON work_log(employee_id);
    CREATE INDEX IF NOT EXISTS idx_work_log_project ON work_log(project_id);
    CREATE INDEX IF NOT EXISTS idx_work_log_date ON work_log(date);
    -- Уникальный индекс для предотвращения дублей: один сотрудник не может иметь две записи в один день на одном объекте
    CREATE UNIQUE INDEX IF NOT EXISTS idx_work_log_unique ON work_log(employee_id, project_id, date);
    CREATE INDEX IF NOT EXISTS idx_material_log_material ON material_log(material_id);
    CREATE INDEX IF NOT EXISTS idx_material_log_project ON material_log(project_id);
    CREATE INDEX IF NOT EXISTS idx_material_log_date ON material_log(date);
    CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
  `;
  
  db.exec(schema);
}

/**
 * Проверить наличие колонки в таблице
 * @param {string} tableName - Имя таблицы
 * @param {string} columnName - Имя колонки
 * @returns {boolean} true, если колонка существует
 */
function hasColumn(tableName, columnName) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return tableInfo.some(col => col.name === columnName);
  } catch (error) {
    return false;
  }
}

/**
 * Выполнить миграцию (добавление колонки)
 * @param {string} tableName - Имя таблицы
 * @param {string} columnName - Имя колонки
 * @param {string} columnDefinition - Определение колонки (тип и ограничения)
 * @returns {boolean} true, если миграция была выполнена
 */
function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  if (!hasColumn(tableName, columnName)) {
  try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      return true;
  } catch (error) {
      const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      if (isDev) {
        console.error(`Ошибка миграции ${tableName}.${columnName}:`, error.message);
      }
      return false;
    }
  }
  return false;
}

/**
 * Выполнить все миграции базы данных
 * Использует более элегантный подход с проверкой наличия колонок
 */
function runMigrations() {
  const migrations = [
    // Миграции для таблицы projects
    { table: 'projects', column: 'budget', definition: 'REAL DEFAULT 0' },
    { table: 'projects', column: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { table: 'projects', column: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    
    // Миграции для таблицы employees
    { table: 'employees', column: 'phone', definition: 'TEXT' },
    { table: 'employees', column: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { table: 'employees', column: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    
    // Миграции для таблицы materials
    { table: 'materials', column: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { table: 'materials', column: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    
    // Миграции для таблицы work_log
    { table: 'work_log', column: 'salary_per_day', definition: 'REAL DEFAULT 0' },
    { table: 'work_log', column: 'notes', definition: 'TEXT' },
    { table: 'work_log', column: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    
    // Миграции для таблицы material_log
    { table: 'material_log', column: 'notes', definition: 'TEXT' },
    { table: 'material_log', column: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];

  // Миграция: добавление уникального индекса для предотвращения дублей в work_log
  try {
    // Проверяем существование индекса
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name='idx_work_log_unique'
    `).get();
    
    if (!indexes) {
      // Сначала удаляем возможные дубли (оставляем первую запись)
      db.exec(`
        DELETE FROM work_log
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM work_log
          GROUP BY employee_id, project_id, date
        )
      `);
      
      // Создаём уникальный индекс
      db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_work_log_unique 
        ON work_log(employee_id, project_id, date)
      `);
    }
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDev) {
      console.error('Ошибка создания уникального индекса для work_log:', error.message);
    }
  }

  // Выполняем миграции в транзакции для безопасности
  const transaction = db.transaction(() => {
    migrations.forEach(migration => {
      addColumnIfNotExists(migration.table, migration.column, migration.definition);
    });
  });

  transaction();
  }

/**
 * Выполнить функцию в транзакции
 * Автоматически откатывает изменения при ошибке
 * @param {Function} fn - Функция для выполнения в транзакции
 * @returns {*} Результат выполнения функции
 */
function transaction(fn) {
  const txn = db.transaction(fn);
  return txn();
}

// Инициализация БД и выполнение миграций
initDB();
runMigrations();

// Экспортируем БД и утилиту для транзакций
module.exports = db;
module.exports.transaction = transaction;

