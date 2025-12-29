// Сервис для генерации отчётов и аналитики
const db = require('../database');

/**
 * Получить общую статистику по всем проектам
 * @returns {Array} Статистика по каждому проекту
 */
function getAllProjectsReport() {
  return db.prepare(`
    SELECT 
      p.*,
      COALESCE((SELECT SUM(wl.salary_per_day) FROM work_log wl WHERE wl.project_id = p.id), 0) as salary_costs,
      COALESCE((SELECT SUM(ml.amount * m.price_per_unit) 
                 FROM material_log ml 
                 JOIN materials m ON ml.material_id = m.id 
                 WHERE ml.project_id = p.id), 0) as material_costs,
      COALESCE((SELECT SUM(pp.amount) FROM project_payments pp WHERE pp.project_id = p.id), 0) as payments_received,
      (COALESCE((SELECT SUM(wl.salary_per_day) FROM work_log wl WHERE wl.project_id = p.id), 0) + 
       COALESCE((SELECT SUM(ml.amount * m.price_per_unit) 
                  FROM material_log ml 
                  JOIN materials m ON ml.material_id = m.id 
                  WHERE ml.project_id = p.id), 0)) as total_costs,
      (p.budget - (COALESCE((SELECT SUM(wl.salary_per_day) FROM work_log wl WHERE wl.project_id = p.id), 0) + 
                   COALESCE((SELECT SUM(ml.amount * m.price_per_unit) 
                              FROM material_log ml 
                              JOIN materials m ON ml.material_id = m.id 
                              WHERE ml.project_id = p.id), 0))) as budget_remaining,
      (COALESCE((SELECT SUM(pp.amount) FROM project_payments pp WHERE pp.project_id = p.id), 0) - 
       (COALESCE((SELECT SUM(wl.salary_per_day) FROM work_log wl WHERE wl.project_id = p.id), 0) + 
        COALESCE((SELECT SUM(ml.amount * m.price_per_unit) 
                   FROM material_log ml 
                   JOIN materials m ON ml.material_id = m.id 
                   WHERE ml.project_id = p.id), 0))) as balance
    FROM projects p
    ORDER BY p.created_at DESC
  `).all();
}

/**
 * Получить общую статистику по всем сотрудникам
 * @param {string} dateFrom - Дата начала периода (опционально)
 * @param {string} dateTo - Дата окончания периода (опционально)
 * @returns {Array} Статистика по каждому сотруднику
 */
function getAllEmployeesReport(dateFrom = null, dateTo = null) {
  let query = `
    SELECT 
      e.*,
      COUNT(wl.id) as days_worked,
      COALESCE(SUM(wl.salary_per_day), 0) as total_salary,
      COUNT(DISTINCT wl.project_id) as projects_count
    FROM employees e
    LEFT JOIN work_log wl ON e.id = wl.employee_id
    WHERE 1=1
  `;
  const params = [];
  
  if (dateFrom) {
    query += ' AND (wl.date >= ? OR wl.date IS NULL)';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND (wl.date <= ? OR wl.date IS NULL)';
    params.push(dateTo);
  }
  
  query += ' GROUP BY e.id ORDER BY e.name';
  
  return db.prepare(query).all(...params);
}

/**
 * Получить общую статистику по всем материалам
 * @returns {Array} Статистика по каждому материалу
 */
function getAllMaterialsReport() {
  return db.prepare(`
    SELECT 
      m.*,
      COALESCE(SUM(ml.amount), 0) as total_amount,
      COALESCE(SUM(ml.amount * m.price_per_unit), 0) as total_cost,
      COUNT(DISTINCT ml.project_id) as projects_count
    FROM materials m
    LEFT JOIN material_log ml ON m.id = ml.material_id
    GROUP BY m.id
    ORDER BY m.name
  `).all();
}

/**
 * Получить общую статистику (сводка)
 * @returns {Object} Общая статистика
 */
function getOverallStats() {
  const projects = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(budget), 0) as total_budget FROM projects').get();
  const employees = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  const materials = db.prepare('SELECT COUNT(*) as count FROM materials').get();
  const totalSalary = db.prepare(`
    SELECT COALESCE(SUM(wl.salary_per_day), 0) as total
    FROM work_log wl
  `).get();
  const totalMaterials = db.prepare(`
    SELECT COALESCE(SUM(ml.amount * m.price_per_unit), 0) as total
    FROM material_log ml
    JOIN materials m ON ml.material_id = m.id
  `).get();
  const totalPayments = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM project_payments
  `).get();
  
  return {
    projectsCount: projects.count,
    totalBudget: projects.total_budget,
    employeesCount: employees.count,
    materialsCount: materials.count,
    totalSalaryCosts: totalSalary.total || 0,
    totalMaterialCosts: totalMaterials.total || 0,
    totalCosts: (totalSalary.total || 0) + (totalMaterials.total || 0),
    totalPaymentsReceived: totalPayments.total || 0,
    totalBalance: (totalPayments.total || 0) - ((totalSalary.total || 0) + (totalMaterials.total || 0))
  };
}

module.exports = {
  getAllProjectsReport,
  getAllEmployeesReport,
  getAllMaterialsReport,
  getOverallStats
};

