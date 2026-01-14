/**
 * Главный компонент приложения
 */

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NotificationProvider } from '@renderer/components/common';
import Navigation from '@renderer/components/Navigation';
import MobileNavigation from '@renderer/components/MobileNavigation';
import { getRouteComponent, routeExists } from '@renderer/router';
import { ROUTES } from '@renderer/constants';
import '@renderer/styles/global.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(ROUTES.PROJECTS);

  const renderPage = () => {
    if (!routeExists(activeTab)) {
      console.warn(`Маршрут ${activeTab} не найден`);
      const PageComponent = getRouteComponent(ROUTES.PROJECTS);
      if (!PageComponent) return null;
      return <PageComponent />;
    }

    const PageComponent = getRouteComponent(activeTab);
    if (!PageComponent) return null;
    return <PageComponent />;
  };

  return (
    <NotificationProvider>
      <div className="min-vh-100 bg-light">
        {/* Мобильная навигация (видна только на мобильных) */}
        <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Desktop навигация (видна только на desktop) */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Контент страницы */}
        <div className="container py-3 py-md-4">
          {renderPage()}
        </div>
      </div>
    </NotificationProvider>
  );
}

