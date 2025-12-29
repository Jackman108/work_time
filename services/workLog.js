// Сервис для учёта заработанных денег работниками
const db = require('../database');

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
    query += ' AND wl.project_id = ?';
    params.push(filters.projectId);
  }
  if (filters.employeeId) {
    query += ' AND wl.employee_id = ?';
    params.push(filters.employeeId);
  }
  if (filters.dateFrom) {
    query += ' AND wl.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    query += ' AND wl.date <= ?';
    params.push(filters.dateTo);
  }
  
  query += ' ORDER BY wl.date DESC, wl.created_at DESC';
  
  return db.prepare(query).all(...params);
}

/**
 * Создать запись учёта заработанных денег
 * @param {Object} data - Данные записи
 * @returns {Object} Созданная запись
 */
function createWorkLog(data) {
  const { employee_id, project_id, date, salary_per_day, notes } = data;
  const salaryValue = typeof salary_per_day === 'string' ? parseFloat(salary_per_day) : (salary_per_day || 0);
  
  if (isNaN(salaryValue) || salaryValue <= 0) {
    throw new Error('Зарплата за день должна быть положительным числом');
  }
  
  const stmt = db.prepare(`
    INSERT INTO work_log (employee_id, project_id, date, salary_per_day, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(employee_id, project_id, date, salaryValue, notes || null);

  if (!result || !result.lastInsertRowid) {
    throw new Error('Не удалось создать запись в БД');
  }

  // Получаем полную запись с данными сотрудника и проекта
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
  `).get(result.lastInsertRowid);
}

/**
 * Обновить запись учёта заработанных денег
 * @param {number} id - ID записи
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённая запись
 */
function updateWorkLog(id, data) {
  const { employee_id, project_id, date, salary_per_day, notes } = data;
  const salaryValue = typeof salary_per_day === 'string' ? parseFloat(salary_per_day) : (salary_per_day || 0);

  if (isNaN(salaryValue) || salaryValue <= 0) {
    throw new Error('Зарплата за день должна быть положительным числом');
  }

  const stmt = db.prepare(`
    UPDATE work_log
    SET employee_id = ?, project_id = ?, date = ?, salary_per_day = ?, notes = ?
    WHERE id = ?
  `);
  stmt.run(employee_id, project_id, date, salaryValue, notes || null, id);

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
 * Удалить запись учёта заработанных денег
 * @param {number} id - ID записи
 * @returns {boolean} Успешно ли удалена
 */
function deleteWorkLog(id) {
  const stmt = db.prepare('DELETE FROM work_log WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  getAllWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog
};
