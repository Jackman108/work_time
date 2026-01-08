/**
 * Константы приложения
 */

export const ROUTES = {
  PROJECTS: 'projects',
  EMPLOYEES: 'employees',
  MATERIALS: 'materials',
  WORK_LOG: 'work_log',
  MATERIAL_LOG: 'material_log',
  PAYROLL: 'payroll',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];


