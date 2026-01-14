/**
 * Компонент навигации
 */

import React, { ReactElement } from 'react';
import { getAllRoutes, getRouteConfig } from '@renderer/router';
import { ROUTES } from '@renderer/constants';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps): ReactElement {
  const routes = getAllRoutes();
  
  const tabs: Tab[] = routes.map(route => {
    const config = getRouteConfig(route);
    if (!config) {
      return { id: route, label: route, icon: '' };
    }
    const title = String(config.title || route);
    const icon = String(config.icon || '');
    return {
      id: route,
      label: title.replace(/^[^\s]+\s/, ''),
      icon: icon
    };
  });

  const tabLabels: Record<string, string> = {
    [ROUTES.PROJECTS]: 'Объекты',
    [ROUTES.EMPLOYEES]: 'Сотрудники',
    [ROUTES.MATERIALS]: 'Материалы',
    [ROUTES.WORK_LOG]: 'Заработанные деньги',
    [ROUTES.MATERIAL_LOG]: 'Списание материалов',
    [ROUTES.PAYROLL]: 'Поступления',
    [ROUTES.REPORTS]: 'Отчёты',
    [ROUTES.SETTINGS]: 'Настройки'
  };

  const tabsWithLabels = tabs.map(tab => ({
    ...tab,
    label: tabLabels[tab.id] || tab.label
  }));

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top d-none d-md-block">
      <div className="container-fluid">
        <span className="navbar-brand d-flex align-items-center">
          <span className="me-2">🏗️</span>
          Строительный учёт
        </span>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {tabsWithLabels.map(tab => (
              <li className="nav-item" key={tab.id}>
                <button
                  className={`nav-link btn btn-link text-white ${activeTab === tab.id ? 'active fw-bold' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="me-1">{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}


