/**
 * Централизованный API для общения с main process через IPC
 * Все методы организованы по модулям для удобства поддержки
 * Реализует единый подход к обработке ответов и ошибок
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/api
 * @see {@link types/index.d.ts} для определений типов
 */

// Импортируем константы IPC каналов из main process
// В renderer процессе мы используем строковые константы для совместимости
// В будущем можно создать общий пакет констант
const IPC_CHANNELS = {
  PROJECTS: {
    GET_ALL: 'projects:getAll',
    GET_BY_ID: 'projects:getById',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
    GET_STATS: 'projects:getStats'
  },
  EMPLOYEES: {
    GET_ALL: 'employees:getAll',
    GET_BY_ID: 'employees:getById',
    CREATE: 'employees:create',
    UPDATE: 'employees:update',
    DELETE: 'employees:delete',
    GET_STATS: 'employees:getStats'
  },
  MATERIALS: {
    GET_ALL: 'materials:getAll',
    GET_BY_ID: 'materials:getById',
    CREATE: 'materials:create',
    UPDATE: 'materials:update',
    DELETE: 'materials:delete',
    GET_STATS: 'materials:getStats'
  },
  WORK_LOG: {
    GET_ALL: 'workLog:getAll',
    CREATE: 'workLog:create',
    UPDATE: 'workLog:update',
    DELETE: 'workLog:delete'
  },
  MATERIAL_LOG: {
    GET_ALL: 'materialLog:getAll',
    CREATE: 'materialLog:create',
    UPDATE: 'materialLog:update',
    DELETE: 'materialLog:delete'
  },
  PROJECT_PAYMENTS: {
    GET_ALL: 'projectPayments:getAll',
    CREATE: 'projectPayments:create',
    UPDATE: 'projectPayments:update',
    DELETE: 'projectPayments:delete',
    GET_TOTAL_BY_PROJECT: 'projectPayments:getTotalByProject'
  },
  REPORTS: {
    GET_ALL_PROJECTS: 'reports:getAllProjects',
    GET_ALL_EMPLOYEES: 'reports:getAllEmployees',
    GET_ALL_MATERIALS: 'reports:getAllMaterials',
    GET_OVERALL_STATS: 'reports:getOverallStats'
  }
};

/**
 * Обработать ответ от IPC вызова
 * Извлекает данные из структурированного ответа или выбрасывает ошибку
 * @param {Types.ApiResponse} response - Ответ от IPC
 * @returns {*} Данные из ответа
 * @throws {Error} Если ответ содержит ошибку
 */
function handleResponse(response) {
  if (!response) {
    throw new Error('Пустой ответ от сервера');
  }

  if (response.success === false) {
    const error = response.error || {};
    const errorMessage = (error && typeof error === 'object' && 'message' in error) 
      ? String(error.message)
      : 'Произошла ошибка';
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
/**
 * Получить все проекты
 * @returns {Promise<Types.Project[]>} Список всех проектов
 */
export async function getProjects() {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.GET_ALL);
}

/**
 * Получить проект по ID
 * @param {number} id - ID проекта
 * @returns {Promise<Types.Project>} Проект
 */
export async function getProjectById(id) {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.GET_BY_ID, id);
}

/**
 * Создать новый проект
 * @param {Types.ProjectCreateData} data - Данные проекта
 * @returns {Promise<Types.Project>} Созданный проект
 */
export async function createProject(data) {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.CREATE, data);
}

/**
 * Обновить проект
 * @param {number} id - ID проекта
 * @param {Types.ProjectUpdateData} data - Новые данные проекта
 * @returns {Promise<Types.Project>} Обновлённый проект
 */
export async function updateProject(id, data) {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.UPDATE, id, data);
}

/**
 * Удалить проект
 * @param {number} id - ID проекта
 * @returns {Promise<boolean>} Успешно ли удалён
 */
export async function deleteProject(id) {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.DELETE, id);
}

/**
 * Получить статистику по проекту
 * @param {number} projectId - ID проекта
 * @returns {Promise<Types.ProjectStats>} Статистика проекта
 */
export async function getProjectStats(projectId) {
  return await safeInvoke(IPC_CHANNELS.PROJECTS.GET_STATS, projectId);
}

// ---------- Сотрудники ----------
/**
 * Получить всех сотрудников
 * @returns {Promise<Types.Employee[]>} Список всех сотрудников
 */
export async function getEmployees() {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.GET_ALL);
}

/**
 * Получить сотрудника по ID
 * @param {number} id - ID сотрудника
 * @returns {Promise<Types.Employee>} Сотрудник
 */
export async function getEmployeeById(id) {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.GET_BY_ID, id);
}

/**
 * Создать нового сотрудника
 * @param {Types.EmployeeCreateData} data - Данные сотрудника
 * @returns {Promise<Types.Employee>} Созданный сотрудник
 */
export async function createEmployee(data) {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.CREATE, data);
}

/**
 * Обновить сотрудника
 * @param {number} id - ID сотрудника
 * @param {Types.EmployeeUpdateData} data - Новые данные сотрудника
 * @returns {Promise<Types.Employee>} Обновлённый сотрудник
 */
export async function updateEmployee(id, data) {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.UPDATE, id, data);
}

/**
 * Удалить сотрудника
 * @param {number} id - ID сотрудника
 * @returns {Promise<boolean>} Успешно ли удалён
 */
export async function deleteEmployee(id) {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.DELETE, id);
}

/**
 * Получить статистику по сотруднику
 * @param {number} employeeId - ID сотрудника
 * @param {string|null} dateFrom - Дата начала периода
 * @param {string|null} dateTo - Дата окончания периода
 * @returns {Promise<Types.EmployeeStats>} Статистика сотрудника
 */
export async function getEmployeeStats(employeeId, dateFrom, dateTo) {
  return await safeInvoke(IPC_CHANNELS.EMPLOYEES.GET_STATS, employeeId, dateFrom, dateTo);
}

// ---------- Материалы ----------
/**
 * Получить все материалы
 * @returns {Promise<Types.Material[]>} Список всех материалов
 */
export async function getMaterials() {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.GET_ALL);
}

/**
 * Получить материал по ID
 * @param {number} id - ID материала
 * @returns {Promise<Types.Material>} Материал
 */
export async function getMaterialById(id) {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.GET_BY_ID, id);
}

/**
 * Создать новый материал
 * @param {Types.MaterialCreateData} data - Данные материала
 * @returns {Promise<Types.Material>} Созданный материал
 */
export async function createMaterial(data) {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.CREATE, data);
}

/**
 * Обновить материал
 * @param {number} id - ID материала
 * @param {Types.MaterialUpdateData} data - Новые данные материала
 * @returns {Promise<Types.Material>} Обновлённый материал
 */
export async function updateMaterial(id, data) {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.UPDATE, id, data);
}

/**
 * Удалить материал
 * @param {number} id - ID материала
 * @returns {Promise<boolean>} Успешно ли удалён
 */
export async function deleteMaterial(id) {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.DELETE, id);
}

/**
 * Получить статистику по материалу
 * @param {number} materialId - ID материала
 * @returns {Promise<Types.MaterialStats>} Статистика материала
 */
export async function getMaterialStats(materialId) {
  return await safeInvoke(IPC_CHANNELS.MATERIALS.GET_STATS, materialId);
}

// ---------- Учёт рабочего времени ----------
/**
 * Получить записи рабочего времени
 * @param {Types.WorkLogFilters} [filters={}] - Фильтры
 * @returns {Promise<Types.WorkLog[]>} Список записей рабочего времени
 */
export async function getWorkLogs(filters = {}) {
  return await safeInvoke(IPC_CHANNELS.WORK_LOG.GET_ALL, filters);
}

/**
 * Создать запись рабочего времени
 * @param {Types.WorkLogCreateData} data - Данные записи
 * @returns {Promise<Types.WorkLog>} Созданная запись
 */
export async function createWorkLog(data) {
  return await safeInvoke(IPC_CHANNELS.WORK_LOG.CREATE, data);
}

/**
 * Обновить запись рабочего времени
 * @param {number} id - ID записи
 * @param {Types.WorkLogUpdateData} data - Новые данные записи
 * @returns {Promise<Types.WorkLog>} Обновлённая запись
 */
export async function updateWorkLog(id, data) {
  return await safeInvoke(IPC_CHANNELS.WORK_LOG.UPDATE, id, data);
}

/**
 * Удалить запись рабочего времени
 * @param {number} id - ID записи
 * @returns {Promise<boolean>} Успешно ли удалена
 */
export async function deleteWorkLog(id) {
  return await safeInvoke(IPC_CHANNELS.WORK_LOG.DELETE, id);
}

// ---------- Учёт списания материалов ----------
/**
 * Получить записи списания материалов
 * @param {Types.MaterialLogFilters} [filters={}] - Фильтры
 * @returns {Promise<Types.MaterialLog[]>} Список записей списания материалов
 */
export async function getMaterialLogs(filters = {}) {
  return await safeInvoke(IPC_CHANNELS.MATERIAL_LOG.GET_ALL, filters);
}

/**
 * Создать запись списания материала
 * @param {Types.MaterialLogCreateData} data - Данные записи
 * @returns {Promise<Types.MaterialLog>} Созданная запись
 */
export async function createMaterialLog(data) {
  return await safeInvoke(IPC_CHANNELS.MATERIAL_LOG.CREATE, data);
}

/**
 * Обновить запись списания материала
 * @param {number} id - ID записи
 * @param {Types.MaterialLogUpdateData} data - Новые данные записи
 * @returns {Promise<Types.MaterialLog>} Обновлённая запись
 */
export async function updateMaterialLog(id, data) {
  return await safeInvoke(IPC_CHANNELS.MATERIAL_LOG.UPDATE, id, data);
}

/**
 * Удалить запись списания материала
 * @param {number} id - ID записи
 * @returns {Promise<boolean>} Успешно ли удалена
 */
export async function deleteMaterialLog(id) {
  return await safeInvoke(IPC_CHANNELS.MATERIAL_LOG.DELETE, id);
}

// ---------- Поступления денег на проекты ----------
/**
 * Получить записи поступлений денег на проекты
 * @param {Types.ProjectPaymentFilters} [filters={}] - Фильтры
 * @returns {Promise<Types.ProjectPayment[]>} Список записей поступлений
 */
export async function getProjectPayments(filters = {}) {
  return await safeInvoke(IPC_CHANNELS.PROJECT_PAYMENTS.GET_ALL, filters);
}

/**
 * Создать запись поступления денег на проект
 * @param {Types.ProjectPaymentCreateData} data - Данные записи
 * @returns {Promise<Types.ProjectPayment>} Созданная запись
 */
export async function createProjectPayment(data) {
  return await safeInvoke(IPC_CHANNELS.PROJECT_PAYMENTS.CREATE, data);
}

/**
 * Обновить запись поступления денег на проект
 * @param {number} id - ID записи
 * @param {Types.ProjectPaymentUpdateData} data - Новые данные записи
 * @returns {Promise<Types.ProjectPayment>} Обновлённая запись
 */
export async function updateProjectPayment(id, data) {
  return await safeInvoke(IPC_CHANNELS.PROJECT_PAYMENTS.UPDATE, id, data);
}

/**
 * Удалить запись поступления денег на проект
 * @param {number} id - ID записи
 * @returns {Promise<boolean>} Успешно ли удалена
 */
export async function deleteProjectPayment(id) {
  return await safeInvoke(IPC_CHANNELS.PROJECT_PAYMENTS.DELETE, id);
}

/**
 * Получить общую сумму поступлений по проекту
 * @param {number} projectId - ID проекта
 * @returns {Promise<number>} Общая сумма поступлений
 */
export async function getTotalPaymentsByProject(projectId) {
  return await safeInvoke(IPC_CHANNELS.PROJECT_PAYMENTS.GET_TOTAL_BY_PROJECT, projectId);
}

// ---------- Отчёты ----------
/**
 * Получить отчёт по всем проектам
 * @returns {Promise<Types.ProjectReport[]>} Отчёт по проектам
 */
export async function getAllProjectsReport() {
  return await safeInvoke(IPC_CHANNELS.REPORTS.GET_ALL_PROJECTS);
}

/**
 * Получить отчёт по всем сотрудникам
 * @param {string|null} [dateFrom] - Дата начала периода
 * @param {string|null} [dateTo] - Дата окончания периода
 * @returns {Promise<Types.EmployeeReport[]>} Отчёт по сотрудникам
 */
export async function getAllEmployeesReport(dateFrom, dateTo) {
  return await safeInvoke(IPC_CHANNELS.REPORTS.GET_ALL_EMPLOYEES, dateFrom, dateTo);
}

/**
 * Получить отчёт по всем материалам
 * @returns {Promise<Types.MaterialReport[]>} Отчёт по материалам
 */
export async function getAllMaterialsReport() {
  return await safeInvoke(IPC_CHANNELS.REPORTS.GET_ALL_MATERIALS);
}

/**
 * Получить общую статистику
 * @returns {Promise<Types.OverallStats>} Общая статистика
 */
export async function getOverallStats() {
  return await safeInvoke(IPC_CHANNELS.REPORTS.GET_OVERALL_STATS);
}

