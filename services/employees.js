/**
 * Сервис для работы с сотрудниками
 * Использует BaseRepository для базовых CRUD операций
 * Реализует бизнес-логику специфичную для сотрудников
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/employees
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для сотрудников
const employeesRepository = new BaseRepository('employees', {
  orderBy: 'name',
  orderDirection: 'ASC'
});

/**
 * Получить всех сотрудников
 * @returns {Array} Список всех сотрудников
 */
function getAllEmployees() {
  return employeesRepository.getAll();
}

/**
 * Получить сотрудника по ID
 * @param {number} id - ID сотрудника
 * @returns {Object|null} Сотрудник или null
 * @throws {NotFoundError} Если сотрудник не найден
 */
function getEmployeeById(id) {
  const employee = employeesRepository.getById(id);
  if (!employee) {
    throw new NotFoundError(`Сотрудник с ID ${id} не найден`);
  }
  return employee;
}

/**
 * Валидировать данные сотрудника
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateEmployeeData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['name']);
  }

  return {
    name: Validator.validateString(data.name, 'Имя сотрудника', {
      minLength: 1,
      maxLength: 255
    }),
    role: Validator.validateString(data.role, 'Должность', {
      maxLength: 255
    }),
    wage_per_hour: Validator.validateNumber(data.wage_per_hour, 'Оплата за час', {
      min: 0,
      allowZero: true,
      allowNegative: false
    }),
    phone: data.phone ? Validator.validatePhone(data.phone, 'Телефон') : null
  };
}

/**
 * Создать нового сотрудника
 * @param {Object} data - Данные сотрудника
 * @returns {Object} Созданный сотрудник
 * @throws {ValidationError} Если данные невалидны
 */
function createEmployee(data) {
  const validated = validateEmployeeData(data, false);
  return employeesRepository.create(validated);
}

/**
 * Обновить сотрудника
 * @param {number} id - ID сотрудника
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый сотрудник
 * @throws {ValidationError} Если данные невалидны
 * @throws {NotFoundError} Если сотрудник не найден
 */
function updateEmployee(id, data) {
  if (!employeesRepository.exists(id)) {
    throw new NotFoundError(`Сотрудник с ID ${id} не найден`);
  }

  const validated = validateEmployeeData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });

  return employeesRepository.update(id, validated);
}

/**
 * Удалить сотрудника
 * @param {number} id - ID сотрудника
 * @returns {boolean} Успешно ли удалён
 * @throws {NotFoundError} Если сотрудник не найден
 */
function deleteEmployee(id) {
  if (!employeesRepository.exists(id)) {
    throw new NotFoundError(`Сотрудник с ID ${id} не найден`);
  }
  return employeesRepository.delete(id);
}

/**
 * Получить статистику по сотруднику (общее время работы, зарплата)
 * @param {number} employeeId - ID сотрудника
 * @param {string} dateFrom - Дата начала периода (опционально)
 * @param {string} dateTo - Дата окончания периода (опционально)
 * @returns {Object} Статистика сотрудника
 * @throws {NotFoundError} Если сотрудник не найден
 */
function getEmployeeStats(employeeId, dateFrom = null, dateTo = null) {
  if (!employeesRepository.exists(employeeId)) {
    throw new NotFoundError(`Сотрудник с ID ${employeeId} не найден`);
  }

  let query = `
    SELECT 
      COUNT(*) as days_worked,
      COALESCE(SUM(wl.salary_per_day), 0) as total_salary,
      COUNT(DISTINCT wl.project_id) as projects_count
    FROM work_log wl
    WHERE wl.employee_id = ?
  `;
  const params = [employeeId];
  
  if (dateFrom) {
    query += ' AND wl.date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND wl.date <= ?';
    params.push(dateTo);
  }
  
  return db.prepare(query).get(...params);
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
};

