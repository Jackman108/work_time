/**
 * Константы IPC каналов
 * Централизованное управление всеми каналами IPC для предотвращения ошибок
 * Следует принципу Single Source of Truth
 * 
 * @module config/ipc-channels
 */

/**
 * IPC каналы для проектов
 */
const PROJECTS = {
  GET_ALL: 'projects:getAll',
  GET_BY_ID: 'projects:getById',
  CREATE: 'projects:create',
  UPDATE: 'projects:update',
  DELETE: 'projects:delete',
  GET_STATS: 'projects:getStats'
};

/**
 * IPC каналы для сотрудников
 */
const EMPLOYEES = {
  GET_ALL: 'employees:getAll',
  GET_BY_ID: 'employees:getById',
  CREATE: 'employees:create',
  UPDATE: 'employees:update',
  DELETE: 'employees:delete',
  GET_STATS: 'employees:getStats'
};

/**
 * IPC каналы для материалов
 */
const MATERIALS = {
  GET_ALL: 'materials:getAll',
  GET_BY_ID: 'materials:getById',
  CREATE: 'materials:create',
  UPDATE: 'materials:update',
  DELETE: 'materials:delete',
  GET_STATS: 'materials:getStats'
};

/**
 * IPC каналы для учёта рабочего времени
 */
const WORK_LOG = {
  GET_ALL: 'workLog:getAll',
  CREATE: 'workLog:create',
  UPDATE: 'workLog:update',
  DELETE: 'workLog:delete'
};

/**
 * IPC каналы для учёта списания материалов
 */
const MATERIAL_LOG = {
  GET_ALL: 'materialLog:getAll',
  CREATE: 'materialLog:create',
  UPDATE: 'materialLog:update',
  DELETE: 'materialLog:delete'
};

/**
 * IPC каналы для поступлений денег на проекты
 */
const PROJECT_PAYMENTS = {
  GET_ALL: 'projectPayments:getAll',
  CREATE: 'projectPayments:create',
  UPDATE: 'projectPayments:update',
  DELETE: 'projectPayments:delete',
  GET_TOTAL_BY_PROJECT: 'projectPayments:getTotalByProject'
};

/**
 * IPC каналы для отчётов
 */
const REPORTS = {
  GET_ALL_PROJECTS: 'reports:getAllProjects',
  GET_ALL_EMPLOYEES: 'reports:getAllEmployees',
  GET_ALL_MATERIALS: 'reports:getAllMaterials',
  GET_OVERALL_STATS: 'reports:getOverallStats'
};

/**
 * Все IPC каналы в одном объекте для удобства
 */
const IPC_CHANNELS = {
  PROJECTS,
  EMPLOYEES,
  MATERIALS,
  WORK_LOG,
  MATERIAL_LOG,
  PROJECT_PAYMENTS,
  REPORTS
};

module.exports = {
  IPC_CHANNELS,
  PROJECTS,
  EMPLOYEES,
  MATERIALS,
  WORK_LOG,
  MATERIAL_LOG,
  PROJECT_PAYMENTS,
  REPORTS
};

