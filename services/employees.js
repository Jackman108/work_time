// Сервис для работы с сотрудниками
const db = require('../database');

/**
 * Получить всех сотрудников
 * @returns {Array} Список всех сотрудников
 */
function getAllEmployees() {
  return db.prepare('SELECT * FROM employees ORDER BY name').all();
}

/**
 * Получить сотрудника по ID
 * @param {number} id - ID сотрудника
 * @returns {Object|null} Сотрудник или null
 */
function getEmployeeById(id) {
  return db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
}

/**
 * Создать нового сотрудника
 * @param {Object} data - Данные сотрудника
 * @returns {Object} Созданный сотрудник
 */
function createEmployee(data) {
  const { name, role, wage_per_hour, phone } = data;
  const stmt = db.prepare(`
    INSERT INTO employees (name, role, wage_per_hour, phone)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, role || null, wage_per_hour || 0, phone || null);
  return getEmployeeById(result.lastInsertRowid);
}

/**
 * Обновить сотрудника
 * @param {number} id - ID сотрудника
 * @param {Object} data - Новые данные
 * @returns {Object|null} Обновлённый сотрудник
 */
function updateEmployee(id, data) {
  const { name, role, wage_per_hour, phone } = data;
  const stmt = db.prepare(`
    UPDATE employees 
    SET name = ?, role = ?, wage_per_hour = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, role || null, wage_per_hour || 0, phone || null, id);
  return getEmployeeById(id);
}

/**
 * Удалить сотрудника
 * @param {number} id - ID сотрудника
 * @returns {boolean} Успешно ли удалён
 */
function deleteEmployee(id) {
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Получить статистику по сотруднику (общее время работы, зарплата)
 * @param {number} employeeId - ID сотрудника
 * @param {string} dateFrom - Дата начала периода (опционально)
 * @param {string} dateTo - Дата окончания периода (опционально)
 * @returns {Object} Статистика сотрудника
 */
function getEmployeeStats(employeeId, dateFrom = null, dateTo = null) {
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

