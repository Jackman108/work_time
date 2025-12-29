// Сервис для работы с проектами (строительными объектами)
const db = require('../database');

/**
 * Получить все проекты
 * @returns {Array} Список всех проектов
 */
function getAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

/**
 * Получить проект по ID
 * @param {number} id - ID проекта
 * @returns {Object|null} Проект или null
 */
function getProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

/**
 * Создать новый проект
 * @param {Object} data - Данные проекта
 * @returns {Object} Созданный проект
 */
function createProject(data) {
  const { name, address, date_start, date_end, budget } = data;
  const stmt = db.prepare(`
    INSERT INTO projects (name, address, date_start, date_end, budget)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, address || null, date_start || null, date_end || null, budget || 0);
  return getProjectById(result.lastInsertRowid);
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый проект
 */
function updateProject(id, data) {
  const { name, address, date_start, date_end, budget } = data;
  const stmt = db.prepare(`
    UPDATE projects 
    SET name = ?, address = ?, date_start = ?, date_end = ?, budget = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, address || null, date_start || null, date_end || null, budget || 0, id);
  return getProjectById(id);
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {boolean} Успешно ли удалён
 */
function deleteProject(id) {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Получить статистику по проекту (затраты на людей и материалы)
 * @param {number} projectId - ID проекта
 * @returns {Object} Статистика проекта
 */
function getProjectStats(projectId) {
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

