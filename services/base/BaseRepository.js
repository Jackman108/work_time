/**
 * Базовый репозиторий для работы с базой данных
 * Реализует паттерн Repository для централизации CRUD операций
 * Следует принципам DRY (Don't Repeat Yourself) и Single Responsibility
 * 
 * @module services/base/BaseRepository
 */

const db = require('../../database');

/**
 * Базовый класс репозитория с общими CRUD операциями
 * Наследуется конкретными репозиториями для специфичных сущностей
 */
class BaseRepository {
  /**
   * @param {string} tableName - Имя таблицы в БД
   * @param {Object} options - Дополнительные опции
   * @param {string} options.orderBy - Поле для сортировки по умолчанию
   * @param {string} options.orderDirection - Направление сортировки (ASC/DESC)
   */
  constructor(tableName, options = {}) {
    if (!tableName) {
      throw new Error('Table name is required for BaseRepository');
    }
    
    this.tableName = tableName;
    this.orderBy = options.orderBy || 'created_at';
    this.orderDirection = options.orderDirection || 'DESC';
  }

  /**
   * Получить все записи из таблицы
   * @param {Object} options - Опции запроса
   * @param {string} options.orderBy - Поле для сортировки
   * @param {string} options.orderDirection - Направление сортировки
   * @returns {Array} Массив всех записей
   */
  getAll(options = {}) {
    const orderBy = options.orderBy || this.orderBy;
    const orderDirection = options.orderDirection || this.orderDirection;
    
    const query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${orderDirection}`;
    return db.prepare(query).all();
  }

  /**
   * Получить запись по ID
   * @param {number} id - ID записи
   * @returns {Object|null} Запись или null, если не найдена
   */
  getById(id) {
    if (!id || isNaN(Number(id))) {
      throw new Error(`Invalid ID: ${id}`);
    }
    
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
  }

  /**
   * Создать новую запись
   * @param {Object} data - Данные для создания
   * @returns {Object} Созданная запись
   */
  create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a valid object');
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    
    const stmt = db.prepare(query);
    const result = stmt.run(...values);
    
    return this.getById(result.lastInsertRowid);
  }

  /**
   * Обновить запись
   * @param {number} id - ID записи
   * @param {Object} data - Новые данные
   * @returns {Object|null} Обновлённая запись или null
   */
  update(id, data) {
    if (!id || isNaN(Number(id))) {
      throw new Error(`Invalid ID: ${id}`);
    }
    
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Data must be a non-empty object');
    }

    // Автоматически добавляем updated_at, если таблица имеет это поле
    const hasUpdatedAt = this.hasColumn('updated_at');
    if (hasUpdatedAt && !data.updated_at) {
      data.updated_at = 'CURRENT_TIMESTAMP';
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields
      .map(field => {
        // Обработка CURRENT_TIMESTAMP без кавычек
        if (data[field] === 'CURRENT_TIMESTAMP') {
          return `${field} = CURRENT_TIMESTAMP`;
        }
        return `${field} = ?`;
      })
      .join(', ');
    
    // Фильтруем значения для CURRENT_TIMESTAMP
    const queryValues = values.filter((_, index) => data[fields[index]] !== 'CURRENT_TIMESTAMP');
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...queryValues, id);
    
    return this.getById(id);
  }

  /**
   * Удалить запись
   * @param {number} id - ID записи
   * @returns {boolean} true, если запись была удалена, false - если не найдена
   */
  delete(id) {
    if (!id || isNaN(Number(id))) {
      throw new Error(`Invalid ID: ${id}`);
    }
    
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Проверить существование записи по ID
   * @param {number} id - ID записи
   * @returns {boolean} true, если запись существует
   */
  exists(id) {
    if (!id || isNaN(Number(id))) {
      return false;
    }
    
    const result = db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`).get(id);
    return !!result;
  }

  /**
   * Проверить наличие колонки в таблице
   * @param {string} columnName - Имя колонки
   * @returns {boolean} true, если колонка существует
   * @private
   */
  hasColumn(columnName) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${this.tableName})`).all();
      return tableInfo.some(col => col.name === columnName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Выполнить произвольный SQL запрос
   * Используется для сложных запросов, которые не покрываются базовыми методами
   * @param {string} query - SQL запрос
   * @param {Array} params - Параметры запроса
   * @returns {*} Результат запроса
   */
  query(query, params = []) {
    return db.prepare(query).all(...params);
  }

  /**
   * Выполнить запрос и вернуть одну запись
   * @param {string} query - SQL запрос
   * @param {Array} params - Параметры запроса
   * @returns {Object|null} Результат запроса
   */
  queryOne(query, params = []) {
    return db.prepare(query).get(...params);
  }
}

module.exports = BaseRepository;

