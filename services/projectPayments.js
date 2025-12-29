/**
 * Сервис для учёта поступлений денег на проекты
 * Использует BaseRepository для базовых операций
 * Реализует бизнес-логику специфичную для платежей по проектам
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/projectPayments
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для project_payments
const projectPaymentsRepository = new BaseRepository('project_payments', {
  orderBy: 'date',
  orderDirection: 'DESC'
});

/**
 * Получить полную запись с данными проекта
 * @param {number} id - ID записи
 * @returns {Object|null} Полная запись или null
 */
function getProjectPaymentWithJoins(id) {
  return db.prepare(`
    SELECT 
      pp.*,
      p.name as project_name,
      p.address as project_address
    FROM project_payments pp
    JOIN projects p ON pp.project_id = p.id
    WHERE pp.id = ?
  `).get(id);
}

/**
 * Получить все записи поступлений денег на проекты
 * @param {Object} filters - Фильтры (projectId, dateFrom, dateTo)
 * @returns {Array} Список записей
 */
function getAllProjectPayments(filters = {}) {
  let query = `
    SELECT 
      pp.*,
      p.name as project_name,
      p.address as project_address
    FROM project_payments pp
    JOIN projects p ON pp.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.projectId) {
    Validator.validateId(filters.projectId, 'projectId');
    query += ' AND pp.project_id = ?';
    params.push(filters.projectId);
  }
  if (filters.dateFrom) {
    Validator.validateDate(filters.dateFrom, 'dateFrom');
    query += ' AND pp.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    Validator.validateDate(filters.dateTo, 'dateTo');
    query += ' AND pp.date <= ?';
    params.push(filters.dateTo);
  }
  
  query += ' ORDER BY pp.date DESC, pp.created_at DESC';
  
  return db.prepare(query).all(...params);
}

/**
 * Валидировать данные платежа по проекту
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateProjectPaymentData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['project_id', 'date', 'amount']);
  }

  return {
    project_id: Validator.validateId(data.project_id, 'ID проекта'),
    date: Validator.validateDate(data.date, 'Дата'),
    amount: Validator.validateNumber(data.amount, 'Сумма', {
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
 * Создать запись поступления денег на проект
 * @param {Object} data - Данные записи
 * @returns {Object} Созданная запись
 * @throws {ValidationError} Если данные невалидны
 */
function createProjectPayment(data) {
  const validated = validateProjectPaymentData(data, false);
  
  const stmt = db.prepare(`
    INSERT INTO project_payments (project_id, date, amount, notes)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    validated.project_id,
    validated.date,
    validated.amount,
    validated.notes
  );
  
  return getProjectPaymentWithJoins(result.lastInsertRowid);
}

/**
 * Обновить запись поступления денег
 * @param {number} id - ID записи
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённая запись
 * @throws {ValidationError} Если данные невалидны
 * @throws {NotFoundError} Если запись не найдена
 */
function updateProjectPayment(id, data) {
  if (!projectPaymentsRepository.exists(id)) {
    throw new NotFoundError(`Платёж с ID ${id} не найден`);
  }

  const validated = validateProjectPaymentData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });
  
  const stmt = db.prepare(`
    UPDATE project_payments 
    SET project_id = ?, date = ?, amount = ?, notes = ?
    WHERE id = ?
  `);
  
  stmt.run(
    validated.project_id,
    validated.date,
    validated.amount,
    validated.notes,
    id
  );
  
  return getProjectPaymentWithJoins(id);
}

/**
 * Удалить запись поступления денег
 * @param {number} id - ID записи
 * @returns {boolean} Успешно ли удалена
 * @throws {NotFoundError} Если запись не найдена
 */
function deleteProjectPayment(id) {
  if (!projectPaymentsRepository.exists(id)) {
    throw new NotFoundError(`Платёж с ID ${id} не найден`);
  }
  return projectPaymentsRepository.delete(id);
}

/**
 * Получить общую сумму поступлений на проект
 * @param {number} projectId - ID проекта
 * @returns {number} Общая сумма поступлений
 * @throws {NotFoundError} Если проект не найден
 */
function getTotalPaymentsByProject(projectId) {
  // Проверяем существование проекта через запрос
  const projectExists = db.prepare('SELECT 1 FROM projects WHERE id = ? LIMIT 1').get(projectId);
  if (!projectExists) {
    throw new NotFoundError(`Проект с ID ${projectId} не найден`);
  }

  const result = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM project_payments
    WHERE project_id = ?
  `).get(projectId);
  return result.total || 0;
}

module.exports = {
  getAllProjectPayments,
  createProjectPayment,
  updateProjectPayment,
  deleteProjectPayment,
  getTotalPaymentsByProject
};

