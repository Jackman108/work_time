/**
 * Сервис для работы с материалами
 * Использует BaseRepository для базовых CRUD операций
 * Реализует бизнес-логику специфичную для материалов
 * Следует принципам SOLID: Single Responsibility, Dependency Inversion
 * 
 * @module services/materials
 */

const BaseRepository = require('./base/BaseRepository');
const Validator = require('./base/Validator');
const { ValidationError, NotFoundError } = require('./base/ErrorHandler');
const db = require('../database');

// Создаём репозиторий для материалов
const materialsRepository = new BaseRepository('materials', {
  orderBy: 'name',
  orderDirection: 'ASC'
});

/**
 * Получить все материалы
 * @returns {Array} Список всех материалов
 */
function getAllMaterials() {
  return materialsRepository.getAll();
}

/**
 * Получить материал по ID
 * @param {number} id - ID материала
 * @returns {Object|null} Материал или null
 * @throws {NotFoundError} Если материал не найден
 */
function getMaterialById(id) {
  const material = materialsRepository.getById(id);
  if (!material) {
    throw new NotFoundError(`Материал с ID ${id} не найден`);
  }
  return material;
}

/**
 * Валидировать данные материала
 * @param {Object} data - Данные для валидации
 * @param {boolean} isUpdate - Является ли это обновлением
 * @returns {Object} Валидированные данные
 * @throws {ValidationError} Если данные невалидны
 */
function validateMaterialData(data, isUpdate = false) {
  if (!isUpdate) {
    Validator.validateRequired(data, ['name']);
  }

  return {
    name: Validator.validateString(data.name, 'Название материала', {
      minLength: 1,
      maxLength: 255
    }),
    unit: Validator.validateString(data.unit, 'Единица измерения', {
      maxLength: 50
    }) || 'шт',
    price_per_unit: Validator.validateNumber(data.price_per_unit, 'Цена за единицу', {
      min: 0,
      allowZero: true,
      allowNegative: false
    })
  };
}

/**
 * Создать новый материал
 * @param {Object} data - Данные материала
 * @returns {Object} Созданный материал
 * @throws {ValidationError} Если данные невалидны
 */
function createMaterial(data) {
  const validated = validateMaterialData(data, false);
  return materialsRepository.create(validated);
}

/**
 * Обновить материал
 * @param {number} id - ID материала
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый материал
 * @throws {ValidationError} Если данные невалидны
 * @throws {NotFoundError} Если материал не найден
 */
function updateMaterial(id, data) {
  if (!materialsRepository.exists(id)) {
    throw new NotFoundError(`Материал с ID ${id} не найден`);
  }

  const validated = validateMaterialData(data, true);
  // Удаляем undefined значения
  Object.keys(validated).forEach(key => {
    if (validated[key] === undefined) {
      delete validated[key];
    }
  });

  return materialsRepository.update(id, validated);
}

/**
 * Удалить материал
 * @param {number} id - ID материала
 * @returns {boolean} Успешно ли удалён
 * @throws {NotFoundError} Если материал не найден
 */
function deleteMaterial(id) {
  if (!materialsRepository.exists(id)) {
    throw new NotFoundError(`Материал с ID ${id} не найден`);
  }
  return materialsRepository.delete(id);
}

/**
 * Получить статистику по материалу (общее количество списанного, стоимость)
 * @param {number} materialId - ID материала
 * @returns {Object} Статистика материала
 * @throws {NotFoundError} Если материал не найден
 */
function getMaterialStats(materialId) {
  if (!materialsRepository.exists(materialId)) {
    throw new NotFoundError(`Материал с ID ${materialId} не найден`);
  }

  return db.prepare(`
    SELECT 
      COALESCE(SUM(ml.amount), 0) as total_amount,
      COALESCE(SUM(ml.amount * m.price_per_unit), 0) as total_cost,
      COUNT(DISTINCT ml.project_id) as projects_count
    FROM material_log ml
    JOIN materials m ON ml.material_id = m.id
    WHERE ml.material_id = ?
  `).get(materialId);
}

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialStats
};

