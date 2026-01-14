/**
 * Главный компонент приложения
 */

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NotificationProvider, Navigation } from '@renderer/components/common';
import { getRouteComponent, routeExists } from '@renderer/router';
import { ROUTES } from '@renderer/constants';

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
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="container py-4">
          {renderPage()}
        </div>
      </div>
    </NotificationProvider>
  );
}

