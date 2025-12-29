import React from 'react';

/**
 * Компонент навигации между разделами приложения
 * @param {string} activeTab - Активный раздел
 * @param {Function} onTabChange - Обработчик смены раздела
 */
export default function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'projects', label: 'Объекты', icon: '🏗️' },
    { id: 'employees', label: 'Сотрудники', icon: '👷' },
    { id: 'materials', label: 'Материалы', icon: '📦' },
    { id: 'work-log', label: 'Заработанные деньги', icon: '💰' },
    { id: 'payroll', label: 'Поступления на проекты', icon: '💵' },
    { id: 'reports', label: 'Отчёты', icon: '📊' }
  ];

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

