/**
 * Сервис для работы с проектами (строительными объектами)
 * Использует BaseRepository для базовых CRUD операций
 * Реализует бизнес-логику специфичную для проектов
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/projects
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для проектов
const projectsRepository = new BaseRepository('projects', {
  orderBy: 'created_at',
  orderDirection: 'DESC'
});

/**
 * Получить все проекты
 * @returns {Array} Список всех проектов
 */
function getAllProjects() {
  return projectsRepository.getAll();
}

/**
 * Получить проект по ID
 * @param {number} id - ID проекта
 * @returns {Object|null} Проект или null
 * @throws {NotFoundError} Если проект не найден
 */
function getProjectById(id) {
  const project = projectsRepository.getById(id);
  if (!project) {
    throw new NotFoundError(`Проект с ID ${id} не найден`);
  }
  return project;
}

/**
 * Валидировать данные проекта
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением (для пропуска некоторых проверок)
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateProjectData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['name']);
  }

  const validated = {
    name: Validator.validateString(data.name, 'Название проекта', {
      minLength: 1,
      maxLength: 255
    }),
    address: Validator.validateString(data.address, 'Адрес', {
      maxLength: 500
    }),
    date_start: Validator.validateDate(data.date_start, 'Дата начала'),
    date_end: Validator.validateDate(data.date_end, 'Дата окончания'),
    budget: Validator.validateNumber(data.budget, 'Бюджет', {
      min: 0,
      allowZero: true,
      allowNegative: false
    })
  };

  // Проверка логики дат
  if (validated.date_start && validated.date_end) {
    const startDate = new Date(validated.date_start);
    const endDate = new Date(validated.date_end);
    if (endDate < startDate) {
      throw new ValidationError('Дата окончания не может быть раньше даты начала');
    }
  }

  return validated;
}

/**
 * Создать новый проект
 * @param {Object} data - Данные проекта
 * @returns {Object} Созданный проект
 * @throws {ValidationError} Если данные невалидны
 */
function createProject(data) {
  const validated = validateProjectData(data, false);
  return projectsRepository.create(validated);
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый проект
 * @throws {ValidationError} Если данные невалидны
 * @throws {NotFoundError} Если проект не найден
 */
function updateProject(id, data) {
  // Проверяем существование проекта
  if (!projectsRepository.exists(id)) {
    throw new NotFoundError(`Проект с ID ${id} не найден`);
  }

  const validated = validateProjectData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });

  return projectsRepository.update(id, validated);
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {boolean} Успешно ли удалён
 * @throws {NotFoundError} Если проект не найден
 */
function deleteProject(id) {
  if (!projectsRepository.exists(id)) {
    throw new NotFoundError(`Проект с ID ${id} не найден`);
  }
  return projectsRepository.delete(id);
}

/**
 * Получить статистику по проекту (затраты на людей и материалы)
 * @param {number} projectId - ID проекта
 * @returns {Object} Статистика проекта
 * @throws {NotFoundError} Если проект не найден
 */
function getProjectStats(projectId) {
  // Проверяем существование проекта
  if (!projectsRepository.exists(projectId)) {
    throw new NotFoundError(`Проект с ID ${projectId} не найден`);
  }

  // Затраты на зарплату (сдельная оплата - сумма за день)
  const salaryCosts = db.prepare(`
    SELECT COALESCE(SUM(wl.salary_per_day), 0) as total
    FROM work_log wl
    WHERE wl.project_id = ?
  `).get(projectId);

  // Затраты на материалы
  const materialCosts = db.prepare(`
    SELECT COALESCE(SUM(ml.amount * m.price_per_unit), 0) as total
    FROM material_log ml
    JOIN materials m ON ml.material_id = m.id
    WHERE ml.project_id = ?
  `).get(projectId);

  return {
    salaryCosts: salaryCosts.total || 0,
    materialCosts: materialCosts.total || 0,
    totalCosts: (salaryCosts.total || 0) + (materialCosts.total || 0)
  };
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};

