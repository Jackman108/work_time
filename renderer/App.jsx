import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from './components/Navigation.jsx';
import ProjectsPage from './components/pages/ProjectsPage.jsx';
import EmployeesPage from './components/pages/EmployeesPage.jsx';
import MaterialsPage from './components/pages/MaterialsPage.jsx';
import WorkLogPage from './components/pages/WorkLogPage.jsx';
import PayrollPage from './components/pages/PayrollPage.jsx';
import ReportsPage from './components/pages/ReportsPage.jsx';

/**
 * Главный компонент приложения
 * Управляет навигацией между разделами и отображением соответствующих страниц
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('projects');

  // Рендерим активную страницу в зависимости от выбранного раздела
  const renderPage = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'materials':
        return <MaterialsPage />;
      case 'work-log':
        return <WorkLogPage />;
      case 'payroll':
        return <PayrollPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <ProjectsPage />;
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container py-4">
        {renderPage()}
      </div>
    </div>
  );
}
