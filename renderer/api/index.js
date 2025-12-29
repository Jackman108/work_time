/**
 * Централизованный API для общения с main process через IPC
 * Все методы организованы по модулям для удобства поддержки
 * Реализует единый подход к обработке ответов и ошибок
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/api
 */

/**
 * Обработать ответ от IPC вызова
 * Извлекает данные из структурированного ответа или выбрасывает ошибку
 * @param {Object} response - Ответ от IPC
 * @returns {*} Данные из ответа
 * @throws {Error} Если ответ содержит ошибку
 */
function handleResponse(response) {
  if (!response) {
    throw new Error('Пустой ответ от сервера');
  }

  if (response.success === false) {
    const error = response.error || {};
    const errorMessage = error.message || 'Произошла ошибка';
    throw new Error(errorMessage);
  }

  return response.data;
}

/**
 * Безопасный вызов IPC с обработкой ошибок
 * @param {string} channel - Канал IPC
 * @param {...any} args - Аргументы
 * @returns {Promise} Данные или ошибка
 */
async function safeInvoke(channel, ...args) {
  try {
    const response = await window.electronAPI.invoke(channel, ...args);
    return handleResponse(response);
  } catch (error) {
    console.error(`Ошибка при вызове ${channel}:`, error);
    throw error;
  }
}

// ---------- Проекты ----------
export async function getProjects() {
  return await safeInvoke('projects:getAll');
}

export async function getProjectById(id) {
  return await safeInvoke('projects:getById', id);
}

export async function createProject(data) {
  return await safeInvoke('projects:create', data);
}

export async function updateProject(id, data) {
  return await safeInvoke('projects:update', id, data);
}

export async function deleteProject(id) {
  return await safeInvoke('projects:delete', id);
}

export async function getProjectStats(projectId) {
  return await safeInvoke('projects:getStats', projectId);
}

// ---------- Сотрудники ----------
export async function getEmployees() {
  return await safeInvoke('employees:getAll');
}

export async function getEmployeeById(id) {
  return await safeInvoke('employees:getById', id);
}

export async function createEmployee(data) {
  return await safeInvoke('employees:create', data);
}

export async function updateEmployee(id, data) {
  return await safeInvoke('employees:update', id, data);
}

export async function deleteEmployee(id) {
  return await safeInvoke('employees:delete', id);
}

export async function getEmployeeStats(employeeId, dateFrom, dateTo) {
  return await safeInvoke('employees:getStats', employeeId, dateFrom, dateTo);
}

// ---------- Материалы ----------
export async function getMaterials() {
  return await safeInvoke('materials:getAll');
}

export async function getMaterialById(id) {
  return await safeInvoke('materials:getById', id);
}

export async function createMaterial(data) {
  return await safeInvoke('materials:create', data);
}

export async function updateMaterial(id, data) {
  return await safeInvoke('materials:update', id, data);
}

export async function deleteMaterial(id) {
  return await safeInvoke('materials:delete', id);
}

export async function getMaterialStats(materialId) {
  return await safeInvoke('materials:getStats', materialId);
}

// ---------- Учёт рабочего времени ----------
export async function getWorkLogs(filters = {}) {
  return await safeInvoke('workLog:getAll', filters);
}

export async function createWorkLog(data) {
  return await safeInvoke('workLog:create', data);
}

export async function updateWorkLog(id, data) {
  return await safeInvoke('workLog:update', id, data);
}

export async function deleteWorkLog(id) {
  return await safeInvoke('workLog:delete', id);
}

// ---------- Учёт списания материалов ----------
export async function getMaterialLogs(filters = {}) {
  return await safeInvoke('materialLog:getAll', filters);
}

export async function createMaterialLog(data) {
  return await safeInvoke('materialLog:create', data);
}

export async function updateMaterialLog(id, data) {
  return await safeInvoke('materialLog:update', id, data);
}

export async function deleteMaterialLog(id) {
  return await safeInvoke('materialLog:delete', id);
}

// ---------- Поступления денег на проекты ----------
export async function getProjectPayments(filters = {}) {
  return await safeInvoke('projectPayments:getAll', filters);
}

export async function createProjectPayment(data) {
  return await safeInvoke('projectPayments:create', data);
}

export async function updateProjectPayment(id, data) {
  return await safeInvoke('projectPayments:update', id, data);
}

export async function deleteProjectPayment(id) {
  return await safeInvoke('projectPayments:delete', id);
}

export async function getTotalPaymentsByProject(projectId) {
  return await safeInvoke('projectPayments:getTotalByProject', projectId);
}

// ---------- Отчёты ----------
export async function getAllProjectsReport() {
  return await safeInvoke('reports:getAllProjects');
}

export async function getAllEmployeesReport(dateFrom, dateTo) {
  return await safeInvoke('reports:getAllEmployees', dateFrom, dateTo);
}

export async function getAllMaterialsReport() {
  return await safeInvoke('reports:getAllMaterials');
}

export async function getOverallStats() {
  return await safeInvoke('reports:getOverallStats');
}

