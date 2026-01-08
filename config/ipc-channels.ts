/**
 * Константы IPC каналов
 * Централизованное управление всеми каналами IPC для предотвращения ошибок
 * Следует принципу Single Source of Truth
 * 
 * @module config/ipc-channels
 */

import type { IpcChannels } from '../types/ipc-channels';

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
} as const;

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
} as const;

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
} as const;

/**
 * IPC каналы для учёта рабочего времени
 */
const WORK_LOG = {
  GET_ALL: 'workLog:getAll',
  CREATE: 'workLog:create',
  UPDATE: 'workLog:update',
  DELETE: 'workLog:delete'
} as const;

/**
 * IPC каналы для учёта списания материалов
 */
const MATERIAL_LOG = {
  GET_ALL: 'materialLog:getAll',
  CREATE: 'materialLog:create',
  UPDATE: 'materialLog:update',
  DELETE: 'materialLog:delete'
} as const;

/**
 * IPC каналы для поступлений денег на проекты
 */
const PROJECT_PAYMENTS = {
  GET_ALL: 'projectPayments:getAll',
  CREATE: 'projectPayments:create',
  UPDATE: 'projectPayments:update',
  DELETE: 'projectPayments:delete',
  GET_TOTAL_BY_PROJECT: 'projectPayments:getTotalByProject'
} as const;

/**
 * IPC каналы для отчётов
 */
const REPORTS = {
  GET_ALL_PROJECTS: 'reports:getAllProjects',
  GET_ALL_EMPLOYEES: 'reports:getAllEmployees',
  GET_ALL_MATERIALS: 'reports:getAllMaterials',
  GET_OVERALL_STATS: 'reports:getOverallStats'
} as const;

/**
 * IPC каналы для резервного копирования и восстановления БД
 */
const BACKUP = {
  EXPORT: 'backup:export',
  EXPORT_TO_EXE_DIR: 'backup:exportToExeDir',
  IMPORT: 'backup:import',
  IMPORT_FROM_FILE: 'backup:importFromFile',
  CREATE_AUTO_BACKUP: 'backup:createAutoBackup',
  GET_BACKUP_LIST: 'backup:getBackupList',
  DELETE_BACKUP: 'backup:deleteBackup',
  GET_EXE_DIRECTORY: 'backup:getExeDirectory',
  CLEANUP_OLD_FILES: 'backup:cleanupOldFiles'
} as const;

/**
 * IPC каналы для диалогов выбора файлов
 */
const DIALOG = {
  SHOW_OPEN_DIALOG: 'dialog:showOpenDialog',
  SHOW_SAVE_DIALOG: 'dialog:showSaveDialog'
} as const;

/**
 * Все IPC каналы в одном объекте для удобства
 */
const IPC_CHANNELS: IpcChannels = {
  PROJECTS,
  EMPLOYEES,
  MATERIALS,
  WORK_LOG,
  MATERIAL_LOG,
  PROJECT_PAYMENTS,
  REPORTS,
  BACKUP,
  DIALOG
};

export {
  IPC_CHANNELS,
  PROJECTS,
  EMPLOYEES,
  MATERIALS,
  WORK_LOG,
  MATERIAL_LOG,
  PROJECT_PAYMENTS,
  REPORTS,
  BACKUP,
  DIALOG
};


