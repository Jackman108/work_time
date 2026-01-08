/**
 * Страница отчётов и аналитики
 */

import React, { useState, useEffect } from 'react';
import { 
  getAllProjectsReport, 
  getAllEmployeesReport, 
  getAllMaterialsReport, 
  getOverallStats 
} from '../../api';
import { 
  useNotifications, 
  LoadingSpinner,
  ProjectsBarChart,
  CostsPieChart,
  EmployeesBarChart,
  MaterialsPieChart,
  OverallStatsChart
} from '../common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { ProjectReport, EmployeeReport, MaterialReport, OverallStats } from '../../types';

type ReportType = 'overall' | 'projects' | 'employees' | 'materials';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('overall');
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [projectsReport, setProjectsReport] = useState<ProjectReport[]>([]);
  const [employeesReport, setEmployeesReport] = useState<EmployeeReport[]>([]);
  const [materialsReport, setMaterialsReport] = useState<MaterialReport[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const { showError, showSuccess } = useNotifications();

  useEffect(() => {
    loadOverallStats();
  }, []);

  useEffect(() => {
    if (activeReport === 'projects') {
      loadProjectsReport();
    } else if (activeReport === 'employees') {
      loadEmployeesReport();
    } else if (activeReport === 'materials') {
      loadMaterialsReport();
    }
  }, [activeReport, dateFrom, dateTo]);

  const loadOverallStats = async () => {
    try {
      const data = await getOverallStats();
      setOverallStats(data);
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка загрузки общей статистики:', error);
      showError('Ошибка загрузки общей статистики: ' + (err.message || 'Неизвестная ошибка'));
    }
  };

  const loadProjectsReport = async () => {
    setLoading(true);
    try {
      const data = await getAllProjectsReport();
      setProjectsReport(data);
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка загрузки отчёта по проектам:', error);
      showError('Ошибка загрузки отчёта по проектам: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesReport = async () => {
    setLoading(true);
    try {
      const data = await getAllEmployeesReport(dateFrom || null, dateTo || null);
      setEmployeesReport(data);
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка загрузки отчёта по сотрудникам:', error);
      showError('Ошибка загрузки отчёта по сотрудникам: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialsReport = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterialsReport();
      setMaterialsReport(data);
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка загрузки отчёта по материалам:', error);
      showError('Ошибка загрузки отчёта по материалам: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const renderOverallStats = () => {
    if (!overallStats) {
      return <LoadingSpinner text="Загрузка статистики..." />;
    }

    return (
      <div>
        <h3 className="mb-4">📊 Общая статистика</h3>
        
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5>🏗️ Объекты</h5>
                <h2>{overallStats.projectsCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5>👷 Сотрудники</h5>
                <h2>{overallStats.employeesCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5>📦 Материалы</h5>
                <h2>{overallStats.materialsCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body text-center">
                <h5>💰 Бюджет</h5>
                <h4>{formatCurrency(overallStats.totalBudget)}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h6>Расходы на зарплату:</h6>
                <h4 className="text-danger">{formatCurrency(overallStats.totalSalaryCosts)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h6>Расходы на материалы:</h6>
                <h4 className="text-danger">{formatCurrency(overallStats.totalMaterialCosts)}</h4>
              </div>
            </div>
          </div>
        </div>

        {showCharts && <OverallStatsChart overallStats={overallStats} />}
      </div>
    );
  };

  const renderProjectsReport = () => {
    if (loading) {
      return <LoadingSpinner text="Загрузка отчёта..." />;
    }

    return (
      <div>
        <h3 className="mb-4">🏗️ Отчёт по объектам</h3>
        
        {showCharts && projectsReport.length > 0 && (
          <div className="mb-4">
            <ProjectsBarChart data={projectsReport} />
            <CostsPieChart data={projectsReport} />
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Объект</th>
                <th>Бюджет</th>
                <th>Зарплаты</th>
                <th>Материалы</th>
                <th>Поступления</th>
                <th>Баланс</th>
              </tr>
            </thead>
            <tbody>
              {projectsReport.map(project => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{formatCurrency(project.budget)}</td>
                  <td className="text-danger">{formatCurrency(project.salary_costs)}</td>
                  <td className="text-danger">{formatCurrency(project.material_costs)}</td>
                  <td className="text-success">{formatCurrency(project.payments_received)}</td>
                  <td className={project.balance >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(project.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEmployeesReport = () => {
    if (loading) {
      return <LoadingSpinner text="Загрузка отчёта..." />;
    }

    return (
      <div>
        <h3 className="mb-4">👷 Отчёт по сотрудникам</h3>
        
        <div className="row mb-4">
          <div className="col-md-4">
            <label className="form-label">С даты:</label>
            <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-4">
            <label className="form-label">По дату:</label>
            <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {showCharts && employeesReport.length > 0 && (
          <div className="mb-4">
            <EmployeesBarChart data={employeesReport} />
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Должность</th>
                <th>Дней отработано</th>
                <th>Заработано</th>
                <th>Проектов</th>
              </tr>
            </thead>
            <tbody>
              {employeesReport.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role || '-'}</td>
                  <td>{employee.days_worked}</td>
                  <td>{formatCurrency(employee.total_salary)}</td>
                  <td>{employee.projects_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMaterialsReport = () => {
    if (loading) {
      return <LoadingSpinner text="Загрузка отчёта..." />;
    }

    return (
      <div>
        <h3 className="mb-4">📦 Отчёт по материалам</h3>
        
        {showCharts && materialsReport.length > 0 && (
          <div className="mb-4">
            <MaterialsPieChart data={materialsReport} />
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Материал</th>
                <th>Ед. изм.</th>
                <th>Цена за ед.</th>
                <th>Использовано</th>
                <th>Общая стоимость</th>
                <th>Проектов</th>
              </tr>
            </thead>
            <tbody>
              {materialsReport.map(material => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>{formatCurrency(material.price_per_unit)}</td>
                  <td>{material.total_amount}</td>
                  <td>{formatCurrency(material.total_cost)}</td>
                  <td>{material.projects_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">📊 Отчёты и аналитика</h1>

      <div className="mb-4">
        <div className="btn-group" role="group">
          <button 
            className={`btn ${activeReport === 'overall' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveReport('overall')}
          >
            📈 Общая статистика
          </button>
          <button 
            className={`btn ${activeReport === 'projects' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveReport('projects')}
          >
            🏗️ Объекты
          </button>
          <button 
            className={`btn ${activeReport === 'employees' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveReport('employees')}
          >
            👷 Сотрудники
          </button>
          <button 
            className={`btn ${activeReport === 'materials' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveReport('materials')}
          >
            📦 Материалы
          </button>
        </div>

        <div className="form-check form-switch d-inline-block ms-4">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="showCharts" 
            checked={showCharts}
            onChange={e => setShowCharts(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="showCharts">Показать графики</label>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {activeReport === 'overall' && renderOverallStats()}
          {activeReport === 'projects' && renderProjectsReport()}
          {activeReport === 'employees' && renderEmployeesReport()}
          {activeReport === 'materials' && renderMaterialsReport()}
        </div>
      </div>
    </div>
  );
}


