import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NotificationProvider, Navigation } from './components/common';
import { getRouteComponent, routeExists } from './router';
import { ROUTES } from './constants';

/**
 * Главный компонент приложения
 * Управляет навигацией между разделами и отображением соответствующих страниц
 * Использует централизованный роутер для управления маршрутами
 * Следует принципам Single Responsibility и Open/Closed
 */
export default function App() {
  const [activeTab, setActiveTab] = useState(ROUTES.PROJECTS);

  /**
   * Рендерим активную страницу в зависимости от выбранного раздела
   * Использует централизованный роутер вместо switch
   */
  const renderPage = () => {
    // Проверяем существование маршрута
    if (!routeExists(activeTab)) {
      console.warn(`Маршрут ${activeTab} не найден, используем маршрут по умолчанию`);
      const PageComponent = getRouteComponent(ROUTES.PROJECTS);
      return PageComponent ? <PageComponent /> : null;
    }

    const PageComponent = getRouteComponent(activeTab);
    return PageComponent ? <PageComponent /> : null;
  };

  return (
    <NotificationProvider>
      <div className="min-vh-100 bg-light">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="container py-4">
          {renderPage()}
        </div>
      </div>
    </NotificationProvider>
  );
}
