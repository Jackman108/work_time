// Сервис для учёта поступлений денег на проекты
const db = require('../database');

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
    query += ' AND pp.project_id = ?';
    params.push(filters.projectId);
  }
  if (filters.dateFrom) {
    query += ' AND pp.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    query += ' AND pp.date <= ?';
    params.push(filters.dateTo);
  }
  
  query += ' ORDER BY pp.date DESC, pp.created_at DESC';
  
  return db.prepare(query).all(...params);
}

/**
 * Создать запись поступления денег на проект
 * @param {Object} data - Данные записи
 * @returns {Object} Созданная запись
 */
function createProjectPayment(data) {
  const { project_id, date, amount, notes } = data;
  const amountValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  
  const stmt = db.prepare(`
    INSERT INTO project_payments (project_id, date, amount, notes)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(project_id, date, amountValue, notes || null);
  
  // Получаем полную запись с данными проекта
  return db.prepare(`
    SELECT 
      pp.*,
      p.name as project_name,
      p.address as project_address
    FROM project_payments pp
    JOIN projects p ON pp.project_id = p.id
    WHERE pp.id = ?
  `).get(result.lastInsertRowid);
}

/**
 * Обновить запись поступления денег
 * @param {number} id - ID записи
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённая запись
 */
function updateProjectPayment(id, data) {
  const { project_id, date, amount, notes } = data;
  const amountValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  
  const stmt = db.prepare(`
    UPDATE project_payments 
    SET project_id = ?, date = ?, amount = ?, notes = ?
    WHERE id = ?
  `);
  stmt.run(project_id, date, amountValue, notes || null, id);
  
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
 * Удалить запись поступления денег
 * @param {number} id - ID записи
 * @returns {boolean} Успешно ли удалена
 */
function deleteProjectPayment(id) {
  const stmt = db.prepare('DELETE FROM project_payments WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Получить общую сумму поступлений на проект
 * @param {number} projectId - ID проекта
 * @returns {number} Общая сумма поступлений
 */
function getTotalPaymentsByProject(projectId) {
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

