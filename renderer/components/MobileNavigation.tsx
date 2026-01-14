/**
 * Мобильная навигация с drawer/sidebar
 * 
 * Адаптированная версия навигации для мобильных устройств.
 * Использует offcanvas drawer для лучшего UX на маленьких экранах.
 * 
 * Принципы:
 * - Touch-friendly элементы
 * - Простая навигация
 * - Оптимизация для маленьких экранов
 */

import { useState, useEffect, ReactElement } from 'react';
import { getAllRoutes, getRouteConfig } from '@renderer/router';
import { ROUTES } from '@renderer/constants';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
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

  // Закрываем drawer при изменении активной вкладки
  useEffect(() => {
    setIsOpen(false);
  }, [activeTab]);

  // Закрываем drawer при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-nav-drawer') && !target.closest('.mobile-nav-toggle')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      // Предотвращаем скролл body когда drawer открыт
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Мобильная навигация - верхняя панель */}
      <nav className="navbar navbar-dark bg-primary shadow-sm sticky-top d-md-none">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center">
            <span className="me-2">🏗️</span>
            <span className="d-none d-sm-inline">Строительный учёт</span>
            <span className="d-sm-none">Учёт</span>
          </span>
          
          {/* Кнопка открытия drawer */}
          <button
            className="btn btn-link text-white mobile-nav-toggle"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Открыть меню"
            style={{ 
              minWidth: '44px', 
              minHeight: '44px',
              padding: '0.5rem',
              border: 'none'
            }}
          >
            <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
          </button>
        </div>
      </nav>

      {/* Мобильный drawer (offcanvas) */}
      <div 
        className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}
        onClick={(e) => {
          // Закрываем при клике на overlay
          if (e.target === e.currentTarget) {
            setIsOpen(false);
          }
        }}
      >
        {/* Overlay (тёмный фон) */}
        <div className="mobile-nav-overlay"></div>
        
        {/* Drawer контент */}
        <div className="mobile-nav-content">
          {/* Заголовок drawer */}
          <div className="mobile-nav-header">
            <h5 className="mb-0">Меню</h5>
            <button
              className="btn btn-link text-dark"
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть меню"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                padding: '0.5rem',
                fontSize: '1.5rem'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Список навигации */}
          <nav className="mobile-nav-list">
            {tabsWithLabels.map(tab => (
              <button
                key={tab.id}
                className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="mobile-nav-icon">{tab.icon}</span>
                <span className="mobile-nav-label">{tab.label}</span>
                {activeTab === tab.id && (
                  <i className="bi bi-check2 mobile-nav-check"></i>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Стили для мобильного drawer (inline для быстрой загрузки) */}
      <style>{`
        /* Мобильный drawer */
        .mobile-nav-drawer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1050;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .mobile-nav-drawer.open {
          pointer-events: auto;
        }

        .mobile-nav-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .mobile-nav-drawer.open .mobile-nav-overlay {
          opacity: 1;
        }

        .mobile-nav-content {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 280px;
          max-width: 85vw;
          background: white;
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .mobile-nav-drawer.open .mobile-nav-content {
          transform: translateX(0);
        }

        .mobile-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .mobile-nav-list {
          flex: 1;
          padding: 0.5rem 0;
          overflow-y: auto;
        }

        .mobile-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 1rem;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s ease;
          min-height: 56px;
          gap: 1rem;
        }

        .mobile-nav-item:active {
          background-color: #f8f9fa;
        }

        .mobile-nav-item.active {
          background-color: #e7f1ff;
          color: #0d6efd;
          font-weight: 500;
        }

        .mobile-nav-icon {
          font-size: 1.5rem;
          width: 2rem;
          text-align: center;
        }

        .mobile-nav-label {
          flex: 1;
          font-size: 1rem;
        }

        .mobile-nav-check {
          color: #0d6efd;
          font-size: 1.25rem;
        }

        /* Анимация появления drawer */
        @media (prefers-reduced-motion: reduce) {
          .mobile-nav-drawer,
          .mobile-nav-overlay,
          .mobile-nav-content {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
