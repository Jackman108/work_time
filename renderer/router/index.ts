/**
 * Роутер приложения
 */

import React from 'react';
import ProjectsPage from '../components/pages/ProjectsPage';
import EmployeesPage from '../components/pages/EmployeesPage';
import MaterialsPage from '../components/pages/MaterialsPage';
import WorkLogPage from '../components/pages/WorkLogPage';
import MaterialLogPage from '../components/pages/MaterialLogPage';
import PayrollPage from '../components/pages/PayrollPage';
import ReportsPage from '../components/pages/ReportsPage';
import SettingsPage from '../components/pages/SettingsPage';
import { ROUTES } from '../constants';
import type { RouteConfig } from '../types';

type RoutesMap = {
  [key: string]: RouteConfig;
};

export const routes: RoutesMap = {
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
  },
  [ROUTES.SETTINGS]: {
    component: SettingsPage,
    title: 'Настройки',
    icon: '⚙️'
  }
};

export function getRouteComponent(route: string): React.ComponentType | null {
  const routeConfig = routes[route];
  return routeConfig ? routeConfig.component : null;
}

export function getRouteConfig(route: string): RouteConfig | null {
  return routes[route] || null;
}

export function routeExists(route: string): boolean {
  return route in routes;
}

export function getAllRoutes(): string[] {
  return Object.keys(routes);
}


