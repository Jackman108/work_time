/**
 * Общие константы IPC каналов
 * Единый источник истины для всех IPC каналов
 * Используется в main process и может быть импортирован в renderer через типы
 * 
 * РЕОРГАНИЗАЦИЯ: Файл перемещён из shared/ipc-channels.ts в config/ipc-channels.ts
 * для лучшей организации структуры проекта.
 * 
 * @module config/ipc-channels
 */

/**
 * IPC каналы для проектов
 */
export const PROJECTS_CHANNELS = {
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
export const EMPLOYEES_CHANNELS = {
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
export const MATERIALS_CHANNELS = {
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
export const WORK_LOG_CHANNELS = {
  GET_ALL: 'workLog:getAll',
  CREATE: 'workLog:create',
  UPDATE: 'workLog:update',
  DELETE: 'workLog:delete'
} as const;

/**
 * IPC каналы для учёта списания материалов
 */
export const MATERIAL_LOG_CHANNELS = {
  GET_ALL: 'materialLog:getAll',
  CREATE: 'materialLog:create',
  UPDATE: 'materialLog:update',
  DELETE: 'materialLog:delete'
} as const;

/**
 * IPC каналы для поступлений денег на проекты
 */
export const PROJECT_PAYMENTS_CHANNELS = {
  GET_ALL: 'projectPayments:getAll',
  CREATE: 'projectPayments:create',
  UPDATE: 'projectPayments:update',
  DELETE: 'projectPayments:delete',
  GET_TOTAL_BY_PROJECT: 'projectPayments:getTotalByProject'
} as const;

/**
 * IPC каналы для отчётов
 */
export const REPORTS_CHANNELS = {
  GET_ALL_PROJECTS: 'reports:getAllProjects',
  GET_ALL_EMPLOYEES: 'reports:getAllEmployees',
  GET_ALL_MATERIALS: 'reports:getAllMaterials',
  GET_OVERALL_STATS: 'reports:getOverallStats'
} as const;

/**
 * IPC каналы для резервного копирования и восстановления БД
 */
export const BACKUP_CHANNELS = {
  EXPORT_TO_FILE: 'backup:exportToFile',
  IMPORT_FROM_FILE: 'backup:importFromFile',
  GET_BACKUP_LIST: 'backup:getBackupList',
  DELETE_BACKUP: 'backup:deleteBackup',
  GET_EXE_DIRECTORY: 'backup:getExeDirectory',
  GET_CURRENT_DATABASE_INFO: 'backup:getCurrentDatabaseInfo'
} as const;

/**
 * IPC каналы для диалогов выбора файлов
 */
export const DIALOG_CHANNELS = {
  SHOW_OPEN_DIALOG: 'dialog:showOpenDialog',
  SHOW_SAVE_DIALOG: 'dialog:showSaveDialog'
} as const;

/**
 * Все IPC каналы в одном объекте
 * Соответствует структуре из config/ipc-channels.ts для обратной совместимости
 */
export const IPC_CHANNELS = {
  PROJECTS: PROJECTS_CHANNELS,
  EMPLOYEES: EMPLOYEES_CHANNELS,
  MATERIALS: MATERIALS_CHANNELS,
  WORK_LOG: WORK_LOG_CHANNELS,
  MATERIAL_LOG: MATERIAL_LOG_CHANNELS,
  PROJECT_PAYMENTS: PROJECT_PAYMENTS_CHANNELS,
  REPORTS: REPORTS_CHANNELS,
  BACKUP: BACKUP_CHANNELS,
  DIALOG: DIALOG_CHANNELS
} as const;

/**
 * Типы для IPC каналов (для использования в TypeScript)
 */
export type IpcChannels = typeof IPC_CHANNELS;
