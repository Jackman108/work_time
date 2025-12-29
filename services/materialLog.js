/**
 * Сервис для учёта списания материалов на проекты
 * Использует BaseRepository для базовых операций
 * Реализует бизнес-логику специфичную для учёта материалов
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/materialLog
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для material_log
const materialLogRepository = new BaseRepository('material_log', {
  orderBy: 'date',
  orderDirection: 'DESC'
});

/**
 * Получить полную запись с данными материала и проекта
 * @param {number} id - ID записи
 * @returns {Object|null} Полная запись или null
 */
function getMaterialLogWithJoins(id) {
  return db.prepare(`
    SELECT
      ml.id,
      ml.material_id,
      ml.project_id,
      ml.date,
      ml.amount,
      ml.notes,
      ml.created_at,
      m.name as material_name,
      m.unit as material_unit,
      m.price_per_unit as material_price,
      p.name as project_name,
      (ml.amount * m.price_per_unit) as total_cost
    FROM material_log ml
    JOIN materials m ON ml.material_id = m.id
    JOIN projects p ON ml.project_id = p.id
    WHERE ml.id = ?
  `).get(id);
}

/**
 * Получить все записи учёта списания материалов
 * @param {Object} filters - Фильтры (projectId, materialId, dateFrom, dateTo)
 * @returns {Array} Список записей
 */
function getAllMaterialLogs(filters = {}) {
  let query = `
    SELECT 
      ml.id,
      ml.material_id,
      ml.project_id,
      ml.date,
      ml.amount,
      ml.notes,
      ml.created_at,
      m.name as material_name,
      m.unit as material_unit,
      m.price_per_unit as material_price,
      p.name as project_name,
      (ml.amount * m.price_per_unit) as total_cost
    FROM material_log ml
    JOIN materials m ON ml.material_id = m.id
    JOIN projects p ON ml.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.projectId) {
    Validator.validateId(filters.projectId, 'projectId');
    query += ' AND ml.project_id = ?';
    params.push(filters.projectId);
  }
  if (filters.materialId) {
    Validator.validateId(filters.materialId, 'materialId');
    query += ' AND ml.material_id = ?';
    params.push(filters.materialId);
  }
  if (filters.dateFrom) {
    Validator.validateDate(filters.dateFrom, 'dateFrom');
    query += ' AND ml.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    Validator.validateDate(filters.dateTo, 'dateTo');
    query += ' AND ml.date <= ?';
    params.push(filters.dateTo);
  }
  
  query += ' ORDER BY ml.date DESC, ml.created_at DESC';
  
  return db.prepare(query).all(...params);
}

/**
 * Валидировать данные записи учёта списания материалов
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateMaterialLogData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['material_id', 'project_id', 'date', 'amount']);
  }

  return {
    material_id: Validator.validateId(data.material_id, 'ID материала'),
    project_id: Validator.validateId(data.project_id, 'ID проекта'),
    date: Validator.validateDate(data.date, 'Дата'),
    amount: Validator.validateNumber(data.amount, 'Количество', {
      min: 0.01,
      allowZero: false,
      allowNegative: false
    }),
    notes: Validator.validateString(data.notes, 'Примечания', {
      maxLength: 1000
    })
  };
}

/**
 * Создать запись учёта списания материалов
 * @param {Object} data - Данные записи
 * @returns {Object} Созданная запись
 * @throws {ValidationError} Если данные невалидны
 */
function createMaterialLog(data) {
  const validated = validateMaterialLogData(data, false);
  
  const stmt = db.prepare(`
    INSERT INTO material_log (material_id, project_id, date, amount, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    validated.material_id,
    validated.project_id,
    validated.date,
    validated.amount,
    validated.notes
  );

  if (!result || !result.lastInsertRowid) {
    throw new Error('Не удалось создать запись в БД');
  }

  return getMaterialLogWithJoins(result.lastInsertRowid);
}

/**
 * Обновить запись учёта списания материалов
 * @param {number} id - ID записи
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённая запись
 * @throws {ValidationError} Если данные невалидны
 * @throws {NotFoundError} Если запись не найдена
 */
function updateMaterialLog(id, data) {
  if (!materialLogRepository.exists(id)) {
    throw new NotFoundError(`Запись учёта списания материалов с ID ${id} не найдена`);
  }

  const validated = validateMaterialLogData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });

  const stmt = db.prepare(`
    UPDATE material_log
    SET material_id = ?, project_id = ?, date = ?, amount = ?, notes = ?
    WHERE id = ?
  `);
  
  stmt.run(
    validated.material_id,
    validated.project_id,
    validated.date,
    validated.amount,
    validated.notes,
    id
  );

  return getMaterialLogWithJoins(id);
}

/**
 * Удалить запись учёта списания материалов
 * @param {number} id - ID записи
 * @returns {boolean} Успешно ли удалена
 * @throws {NotFoundError} Если запись не найдена
 */
function deleteMaterialLog(id) {
  if (!materialLogRepository.exists(id)) {
    throw new NotFoundError(`Запись учёта списания материалов с ID ${id} не найдена`);
  }
  return materialLogRepository.delete(id);
}

module.exports = {
  getAllMaterialLogs,
  createMaterialLog,
  updateMaterialLog,
  deleteMaterialLog
};

