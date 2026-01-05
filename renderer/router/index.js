/**
 * Роутер приложения
 * Централизованное управление маршрутами
 * Следует принципам Single Responsibility и Open/Closed
 * 
 * @module renderer/router
 */

import ProjectsPage from '../components/pages/ProjectsPage';
import EmployeesPage from '../components/pages/EmployeesPage';
import MaterialsPage from '../components/pages/MaterialsPage';
import WorkLogPage from '../components/pages/WorkLogPage';
import MaterialLogPage from '../components/pages/MaterialLogPage';
import PayrollPage from '../components/pages/PayrollPage';
import ReportsPage from '../components/pages/ReportsPage';
import { ROUTES } from '../constants';

/**
 * Конфигурация маршрутов
 * Легко расширяется для добавления новых страниц
 */
export const routes = {
  [ROUTES.PROJECTS]: {
    component: ProjectsPage,
    title: 'Управление строительными объектами',
    icon: '🏗️'
  },
  [ROUTES.EMPLOYEES]: {
    component: EmployeesPage,
    title: 'Управление сотрудниками',
    icon: '👷'
  },
  [ROUTES.MATERIALS]: {
    component: MaterialsPage,
    title: 'Управление материалами',
    icon: '📦'
  },
  [ROUTES.WORK_LOG]: {
    component: WorkLogPage,
    title: 'Учёт заработанных денег работниками',
    icon: '💰'
  },
  [ROUTES.MATERIAL_LOG]: {
    component: MaterialLogPage,
    title: 'Учёт списания материалов',
    icon: '📋'
  },
  [ROUTES.PAYROLL]: {
    component: PayrollPage,
    title: 'Учёт поступлений денег на проекты',
    icon: '💵'
  },
  [ROUTES.REPORTS]: {
    component: ReportsPage,
    title: 'Отчёты и аналитика',
    icon: '📊'
  }
};

/**
 * Получить компонент страницы по маршруту
 * @param {string} route - Маршрут
 * @returns {React.Component|null} Компонент страницы или null
 */
export function getRouteComponent(route) {
  const routeConfig = routes[route];
  return routeConfig ? routeConfig.component : null;
}

/**
 * Получить конфигурацию маршрута
 * @param {string} route - Маршрут
 * @returns {Object|null} Конфигурация маршрута или null
 */
export function getRouteConfig(route) {
  return routes[route] || null;
}

/**
 * Проверить существование маршрута
 * @param {string} route - Маршрут
 * @returns {boolean} true, если маршрут существует
 */
export function routeExists(route) {
  return route in routes;
}

/**
 * Получить все доступные маршруты
 * @returns {Array<string>} Массив маршрутов
 */
export function getAllRoutes() {
  return Object.keys(routes);
}

