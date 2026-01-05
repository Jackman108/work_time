/**
 * Константы для renderer процесса
 * Централизованное управление константами приложения
 * 
 * @module renderer/constants
 */

/**
 * Роуты приложения
 */
export const ROUTES = {
  PROJECTS: 'projects',
  EMPLOYEES: 'employees',
  MATERIALS: 'materials',
  WORK_LOG: 'work-log',
  MATERIAL_LOG: 'material-log',
  PAYROLL: 'payroll',
  REPORTS: 'reports'
};

/**
 * Типы уведомлений
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Типы диалогов подтверждения
 */
export const DIALOG_TYPES = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Настройки уведомлений по умолчанию
 */
export const NOTIFICATION_DEFAULTS = {
  SUCCESS_DURATION: 5000,
  ERROR_DURATION: 7000,
  WARNING_DURATION: 6000,
  INFO_DURATION: 5000
};

/**
 * Настройки загрузки
 */
export const LOADING_CONFIG = {
  FULL_SCREEN: true,
  INLINE: false
};

