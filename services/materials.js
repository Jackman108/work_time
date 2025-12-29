// Сервис для работы с материалами
const db = require('../database');

/**
 * Получить все материалы
 * @returns {Array} Список всех материалов
 */
function getAllMaterials() {
  return db.prepare('SELECT * FROM materials ORDER BY name').all();
}

/**
 * Получить материал по ID
 * @param {number} id - ID материала
 * @returns {Object|null} Материал или null
 */
function getMaterialById(id) {
  return db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
}

/**
 * Создать новый материал
 * @param {Object} data - Данные материала
 * @returns {Object} Созданный материал
 */
function createMaterial(data) {
  const { name, unit, price_per_unit } = data;
  const stmt = db.prepare(`
    INSERT INTO materials (name, unit, price_per_unit)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(name, unit || 'шт', price_per_unit || 0);
  return getMaterialById(result.lastInsertRowid);
}

/**
 * Обновить материал
 * @param {number} id - ID материала
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый материал
 */
function updateMaterial(id, data) {
  const { name, unit, price_per_unit } = data;
  const stmt = db.prepare(`
    UPDATE materials 
    SET name = ?, unit = ?, price_per_unit = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, unit || 'шт', price_per_unit || 0, id);
  return getMaterialById(id);
}

/**
 * Удалить материал
 * @param {number} id - ID материала
 * @returns {boolean} Успешно ли удалён
 */
function deleteMaterial(id) {
  const stmt = db.prepare('DELETE FROM materials WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Получить статистику по материалу (общее количество списанного, стоимость)
 * @param {number} materialId - ID материала
 * @returns {Object} Статистика материала
 */
function getMaterialStats(materialId) {
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

