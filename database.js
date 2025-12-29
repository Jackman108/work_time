// Базовый модуль для работы с базой данных SQLite через better-sqlite3
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'db', 'app.db');
const fs = require('fs');

// Если папки для БД нет, создаём
if (!fs.existsSync(path.join(__dirname, 'db'))) {
  fs.mkdirSync(path.join(__dirname, 'db'));
}

// Создаём/открываем базу
const db = new Database(dbPath);

// Создать таблицы, если не существуют
function initDB() {
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_material_log_material ON material_log(material_id);
    CREATE INDEX IF NOT EXISTS idx_material_log_project ON material_log(project_id);
    CREATE INDEX IF NOT EXISTS idx_material_log_date ON material_log(date);
    CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
  `);
}

initDB();

// Миграции для обновления существующих баз данных
function runMigrations() {
  // Проверяем наличие колонки budget в таблице projects
  try {
    db.prepare('SELECT budget FROM projects LIMIT 1').get();
  } catch (error) {
    if (error.message.includes('no such column: budget')) {
      db.exec('ALTER TABLE projects ADD COLUMN budget REAL DEFAULT 0');
    }
  }

  // Проверяем наличие колонки phone в таблице employees
  try {
    db.prepare('SELECT phone FROM employees LIMIT 1').get();
  } catch (error) {
    if (error.message.includes('no such column: phone')) {
      db.exec('ALTER TABLE employees ADD COLUMN phone TEXT');
    }
  }

  // Проверяем наличие колонки notes в таблице work_log
  try {
    db.prepare('SELECT notes FROM work_log LIMIT 1').get();
  } catch (error) {
    if (error.message.includes('no such column: notes')) {
      db.exec('ALTER TABLE work_log ADD COLUMN notes TEXT');
    }
  }

  // Миграция: переход с часовой оплаты на сдельную (зарплата за день)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(work_log)").all();
    const hasSalaryPerDay = tableInfo.some(col => col.name === 'salary_per_day');
    
    if (!hasSalaryPerDay) {
      try {
        db.exec('ALTER TABLE work_log ADD COLUMN salary_per_day REAL DEFAULT 0');
      } catch (migrationError) {
        console.error('Ошибка миграции salary_per_day:', migrationError.message);
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке структуры таблицы work_log:', error.message);
  }

  // Проверяем наличие колонки notes в таблице material_log
  try {
    db.prepare('SELECT notes FROM material_log LIMIT 1').get();
  } catch (error) {
    if (error.message.includes('no such column: notes')) {
      db.exec('ALTER TABLE material_log ADD COLUMN notes TEXT');
    }
  }

  // Проверяем наличие колонок created_at и updated_at
  try {
    db.prepare('SELECT created_at FROM projects LIMIT 1').get();
  } catch (error) {
    if (error.message.includes('no such column: created_at')) {
      db.exec(`
        ALTER TABLE projects ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE projects ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE employees ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE employees ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE materials ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE materials ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE work_log ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE material_log ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
      `);
    }
  }
}

// Выполняем миграции при каждом запуске
runMigrations();

module.exports = db;

