/**
 * Сервис для учёта заработанных денег работниками
 * Использует BaseRepository для базовых операций
 * Реализует бизнес-логику специфичную для учёта рабочего времени
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/workLog
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для work_log
const workLogRepository = new BaseRepository('work_log', {
  orderBy: 'date',
  orderDirection: 'DESC'
});

/**
 * Получить полную запись с данными сотрудника и проекта
 * @param {number} id - ID записи
 * @returns {Object|null} Полная запись или null
 */
function getWorkLogWithJoins(id) {
  return db.prepare(`
    SELECT
      wl.id,
      wl.employee_id,
      wl.project_id,
      wl.date,
      COALESCE(wl.salary_per_day, 0) as salary_per_day,
      wl.notes,
      wl.created_at,
      e.name as employee_name,
      e.role as employee_role,
      p.name as project_name,
      COALESCE(wl.salary_per_day, 0) as salary
    FROM work_log wl
    JOIN employees e ON wl.employee_id = e.id
    JOIN projects p ON wl.project_id = p.id
    WHERE wl.id = ?
  `).get(id);
}

/**
 * Получить все записи учёта заработанных денег
 * @param {Object} filters - Фильтры (projectId, employeeId, dateFrom, dateTo)
 * @returns {Array} Список записей
 */
function getAllWorkLogs(filters = {}) {
  let query = `
    SELECT 
      wl.id,
      wl.employee_id,
      wl.project_id,
      wl.date,
      COALESCE(wl.salary_per_day, 0) as salary_per_day,
      wl.notes,
      wl.created_at,
      e.name as employee_name,
      e.role as employee_role,
      p.name as project_name,
      COALESCE(wl.salary_per_day, 0) as salary
    FROM work_log wl
    JOIN employees e ON wl.employee_id = e.id
    JOIN projects p ON wl.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.projectId) {
    Validator.validateId(filters.projectId, 'projectId');
    query += ' AND wl.project_id = ?';
    params.push(filters.projectId);
  }
  if (filters.employeeId) {
    Validator.validateId(filters.employeeId, 'employeeId');
    query += ' AND wl.employee_id = ?';
    params.push(filters.employeeId);
  }
  if (filters.dateFrom) {
    Validator.validateDate(filters.dateFrom, 'dateFrom');
    query += ' AND wl.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    Validator.validateDate(filters.dateTo, 'dateTo');
    query += ' AND wl.date <= ?';
    params.push(filters.dateTo);
  }
  
  query += ' ORDER BY wl.date DESC, wl.created_at DESC';
  
  return db.prepare(query).all(...params);
}

/**
 * Валидировать данные записи учёта рабочего времени
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateWorkLogData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['employee_id', 'project_id', 'date', 'salary_per_day']);
  }

  return {
    employee_id: Validator.validateId(data.employee_id, 'ID сотрудника'),
    project_id: Validator.validateId(data.project_id, 'ID проекта'),
    date: Validator.validateDate(data.date, 'Дата'),
    salary_per_day: Validator.validateNumber(data.salary_per_day, 'Зарплата за день', {
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
 * Проверить наличие дубля записи (сотрудник + проект + дата)
 * @param {number} employeeId - ID сотрудника
 * @param {number} projectId - ID проекта
 * @param {string} date - Дата
 * @param {number} excludeId - ID записи для исключения (при обновлении)
 * @returns {boolean} true, если дубль существует
 */
function checkDuplicate(employeeId, projectId, date, excludeId = null) {
  let query = `
    SELECT COUNT(*) as count
    FROM work_log
    WHERE employee_id = ? AND project_id = ? AND date = ?
  `;
  const params = [employeeId, projectId, date];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const result = db.prepare(query).get(...params);
  return result.count > 0;
}

/**
 * Создать запись учёта заработанных денег
 * @param {Object} data - Данные записи
 * @returns {Object} Созданная запись
 * @throws {ValidationError} Если данные невалидны или есть дубль
 */
function createWorkLog(data) {
  const validated = validateWorkLogData(data, false);
  
  // Проверка на дубли: один сотрудник не может иметь две записи в один день на одном объекте
  if (checkDuplicate(validated.employee_id, validated.project_id, validated.date)) {
    throw new ValidationError(
      'У этого сотрудника уже есть запись на этот объект в указанную дату. ' +
      'Один сотрудник может работать в один день на разных объектах, но не может иметь две записи на одном объекте.'
    );
  }
  
  const stmt = db.prepare(`
    INSERT INTO work_log (employee_id, project_id, date, salary_per_day, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    validated.employee_id,
    validated.project_id,
    validated.date,
    validated.salary_per_day,
    validated.notes
  );

  if (!result || !result.lastInsertRowid) {
    throw new Error('Не удалось создать запись в БД');
  }

  return getWorkLogWithJoins(result.lastInsertRowid);
}

/**
 * Обновить запись учёта заработанных денег
 * @param {number} id - ID записи
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённая запись
 * @throws {ValidationError} Если данные невалидны или есть дубль
 * @throws {NotFoundError} Если запись не найдена
 */
function updateWorkLog(id, data) {
  if (!workLogRepository.exists(id)) {
    throw new NotFoundError(`Запись учёта рабочего времени с ID ${id} не найдена`);
  }

  const validated = validateWorkLogData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });

  // Проверка на дубли: один сотрудник не может иметь две записи в один день на одном объекте
  // При обновлении нужно проверить финальные значения (после применения validated)
  // Получаем текущую запись для сравнения
  const currentLog = workLogRepository.getById(id);
  if (!currentLog) {
    throw new NotFoundError(`Запись учёта рабочего времени с ID ${id} не найдена`);
  }

  // Определяем финальные значения (validated имеет приоритет, иначе текущие значения)
  const finalEmployeeId = validated.employee_id !== undefined ? validated.employee_id : currentLog.employee_id;
  const finalProjectId = validated.project_id !== undefined ? validated.project_id : currentLog.project_id;
  const finalDate = validated.date !== undefined ? validated.date : currentLog.date;

  // Проверяем дубли только если хотя бы одно из полей изменилось
  const hasChanges = 
    finalEmployeeId !== currentLog.employee_id ||
    finalProjectId !== currentLog.project_id ||
    finalDate !== currentLog.date;

  if (hasChanges && finalEmployeeId && finalProjectId && finalDate) {
    if (checkDuplicate(finalEmployeeId, finalProjectId, finalDate, id)) {
      throw new ValidationError(
        'У этого сотрудника уже есть другая запись на этот объект в указанную дату. ' +
        'Один сотрудник может работать в один день на разных объектах, но не может иметь две записи на одном объекте.'
      );
    }
  }

  const stmt = db.prepare(`
    UPDATE work_log
    SET employee_id = ?, project_id = ?, date = ?, salary_per_day = ?, notes = ?
    WHERE id = ?
  `);
  
  stmt.run(
    validated.employee_id,
    validated.project_id,
    validated.date,
    validated.salary_per_day,
    validated.notes,
    id
  );

  return getWorkLogWithJoins(id);
}

/**
 * Удалить запись учёта заработанных денег
 * @param {number} id - ID записи
 * @returns {boolean} Успешно ли удалена
 * @throws {NotFoundError} Если запись не найдена
 */
function deleteWorkLog(id) {
  if (!workLogRepository.exists(id)) {
    throw new NotFoundError(`Запись учёта рабочего времени с ID ${id} не найдена`);
  }
  return workLogRepository.delete(id);
}

module.exports = {
  getAllWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog
};
