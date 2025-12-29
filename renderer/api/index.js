// Централизованный API для общения с main process через IPC
// Все методы организованы по модулям для удобства поддержки

// ---------- Проекты ----------
export async function getProjects() {
  return await window.electronAPI.invoke('projects:getAll');
}

export async function getProjectById(id) {
  return await window.electronAPI.invoke('projects:getById', id);
}

export async function createProject(data) {
  return await window.electronAPI.invoke('projects:create', data);
}

export async function updateProject(id, data) {
  return await window.electronAPI.invoke('projects:update', id, data);
}

export async function deleteProject(id) {
  return await window.electronAPI.invoke('projects:delete', id);
}

export async function getProjectStats(projectId) {
  return await window.electronAPI.invoke('projects:getStats', projectId);
}

// ---------- Сотрудники ----------
export async function getEmployees() {
  return await window.electronAPI.invoke('employees:getAll');
}

export async function getEmployeeById(id) {
  return await window.electronAPI.invoke('employees:getById', id);
}

export async function createEmployee(data) {
  return await window.electronAPI.invoke('employees:create', data);
}

export async function updateEmployee(id, data) {
  return await window.electronAPI.invoke('employees:update', id, data);
}

export async function deleteEmployee(id) {
  return await window.electronAPI.invoke('employees:delete', id);
}

export async function getEmployeeStats(employeeId, dateFrom, dateTo) {
  return await window.electronAPI.invoke('employees:getStats', employeeId, dateFrom, dateTo);
}

// ---------- Материалы ----------
export async function getMaterials() {
  return await window.electronAPI.invoke('materials:getAll');
}

export async function getMaterialById(id) {
  return await window.electronAPI.invoke('materials:getById', id);
}

export async function createMaterial(data) {
  return await window.electronAPI.invoke('materials:create', data);
}

export async function updateMaterial(id, data) {
  return await window.electronAPI.invoke('materials:update', id, data);
}

export async function deleteMaterial(id) {
  return await window.electronAPI.invoke('materials:delete', id);
}

export async function getMaterialStats(materialId) {
  return await window.electronAPI.invoke('materials:getStats', materialId);
}

// ---------- Учёт рабочего времени ----------
export async function getWorkLogs(filters = {}) {
  return await window.electronAPI.invoke('workLog:getAll', filters);
}

export async function createWorkLog(data) {
  return await window.electronAPI.invoke('workLog:create', data);
}

export async function updateWorkLog(id, data) {
  return await window.electronAPI.invoke('workLog:update', id, data);
}

export async function deleteWorkLog(id) {
  return await window.electronAPI.invoke('workLog:delete', id);
}
// ---------- Поступления денег на проекты ----------
export async function getProjectPayments(filters = {}) {
  return await window.electronAPI.invoke('projectPayments:getAll', filters);
}

export async function createProjectPayment(data) {
  return await window.electronAPI.invoke('projectPayments:create', data);
}

export async function updateProjectPayment(id, data) {
  return await window.electronAPI.invoke('projectPayments:update', id, data);
}

export async function deleteProjectPayment(id) {
  return await window.electronAPI.invoke('projectPayments:delete', id);
}

export async function getTotalPaymentsByProject(projectId) {
  return await window.electronAPI.invoke('projectPayments:getTotalByProject', projectId);
}

// ---------- Отчёты ----------
export async function getAllProjectsReport() {
  return await window.electronAPI.invoke('reports:getAllProjects');
}

export async function getAllEmployeesReport(dateFrom, dateTo) {
  return await window.electronAPI.invoke('reports:getAllEmployees', dateFrom, dateTo);
}

export async function getAllMaterialsReport() {
  return await window.electronAPI.invoke('reports:getAllMaterials');
}


export async function getOverallStats() {
  return await window.electronAPI.invoke('reports:getOverallStats');
}

