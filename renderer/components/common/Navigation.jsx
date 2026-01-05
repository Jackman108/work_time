import React from 'react';
import { ROUTES } from '../../constants';
import { getRouteConfig, getAllRoutes } from '../../router';

/**
 * Компонент навигации между разделами приложения
 * Использует централизованные константы маршрутов
 * Следует принципу Single Source of Truth
 * 
 * @module renderer/components/common/Navigation
 * @param {Object} props - Свойства компонента
 * @param {string} props.activeTab - Активный раздел
 * @param {Function} props.onTabChange - Обработчик смены раздела
 */
export default function Navigation({ activeTab, onTabChange }) {
  // Получаем конфигурацию маршрутов из роутера
  const routes = getAllRoutes();
  
  // Маппинг для коротких названий вкладок
  const tabLabels = {
    [ROUTES.PROJECTS]: 'Объекты',
    [ROUTES.EMPLOYEES]: 'Сотрудники',
    [ROUTES.MATERIALS]: 'Материалы',
    [ROUTES.WORK_LOG]: 'Заработанные деньги',
    [ROUTES.MATERIAL_LOG]: 'Списание материалов',
    [ROUTES.PAYROLL]: 'Поступления на проекты',
    [ROUTES.REPORTS]: 'Отчёты'
  };

  // Создаём массив вкладок на основе конфигурации маршрутов
  const tabs = routes.map(route => {
    const config = getRouteConfig(route);
    return {
      id: route,
      label: tabLabels[route] || config.title.replace(/^[^\s]+\s/, ''), // Используем короткое название или убираем иконку из заголовка
      icon: config.icon
    };
  });

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">🏗️ Строительный учёт</span>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            {tabs.map(tab => (
              <li key={tab.id} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,.75)',
                    cursor: 'pointer'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

