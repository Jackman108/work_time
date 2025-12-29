import React, { useState, useEffect } from 'react';
import { 
  getAllProjectsReport, 
  getAllEmployeesReport, 
  getAllMaterialsReport, 
  getOverallStats 
} from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Страница отчётов и аналитики
 * Показывает общую картину по объектам, людям и материалам
 */
export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('overall');
  const [overallStats, setOverallStats] = useState(null);
  const [projectsReport, setProjectsReport] = useState([]);
  const [employeesReport, setEmployeesReport] = useState([]);
  const [materialsReport, setMaterialsReport] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.error('Ошибка загрузки общей статистики:', error);
    }
  };

  const loadProjectsReport = async () => {
    setLoading(true);
    try {
      const data = await getAllProjectsReport();
      setProjectsReport(data);
    } catch (error) {
      console.error('Ошибка загрузки отчёта по проектам:', error);
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
      console.error('Ошибка загрузки отчёта по сотрудникам:', error);
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
      console.error('Ошибка загрузки отчёта по материалам:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
      <h2 className="mb-4">📊 Отчёты и аналитика</h2>

      {/* Общая статистика */}
      {overallStats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Проектов</h5>
                <h2 className="text-primary">{overallStats.projectsCount}</h2>
                <p className="text-muted mb-0">Бюджет: {formatCurrency(overallStats.totalBudget)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Сотрудников</h5>
                <h2 className="text-success">{overallStats.employeesCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Материалов</h5>
                <h2 className="text-info">{overallStats.materialsCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Общие затраты</h5>
                <h2 className="text-danger">{formatCurrency(overallStats.totalCosts)}</h2>
                <p className="text-muted mb-0">
                  Зарплата: {formatCurrency(overallStats.totalSalaryCosts)}<br/>
                  Материалы: {formatCurrency(overallStats.totalMaterialCosts)}
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Поступления</h5>
                <h2 className="text-success">{formatCurrency(overallStats.totalPaymentsReceived)}</h2>
                <p className={`mb-0 ${overallStats.totalBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  Баланс: <strong>{formatCurrency(overallStats.totalBalance)}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Навигация по отчётам */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeReport === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveReport('overall')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Общая статистика
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeReport === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveReport('projects')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            По проектам
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeReport === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveReport('employees')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            По сотрудникам
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeReport === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveReport('materials')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            По материалам
          </button>
        </li>
      </ul>

      {/* Фильтры для отчёта по сотрудникам */}
      {activeReport === 'employees' && (
        <div className="card card-body mb-4">
          <h5 className="mb-3">Период</h5>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">С</label>
              <input 
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">По</label>
              <input 
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Отчёт по проектам */}
      {activeReport === 'projects' && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Проект</th>
                    <th>Адрес</th>
                    <th>Сроки</th>
                    <th>Бюджет</th>
                    <th>Поступления</th>
                    <th>Зарплата</th>
                    <th>Материалы</th>
                    <th>Всего затрат</th>
                    <th>Баланс</th>
                    <th>Остаток бюджета</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsReport.map(project => (
                    <tr key={project.id}>
                      <td><strong>{project.name}</strong></td>
                      <td>{project.address || '-'}</td>
                      <td>
                        {formatDate(project.date_start)} — {formatDate(project.date_end)}
                      </td>
                      <td>{formatCurrency(project.budget)}</td>
                      <td className="text-success"><strong>{formatCurrency(project.payments_received)}</strong></td>
                      <td>{formatCurrency(project.salary_costs)}</td>
                      <td>{formatCurrency(project.material_costs)}</td>
                      <td>{formatCurrency(project.total_costs)}</td>
                      <td className={project.balance >= 0 ? 'text-success' : 'text-danger'}>
                        <strong>{formatCurrency(project.balance)}</strong>
                      </td>
                      <td className={project.budget_remaining < 0 ? 'text-danger' : ''}>
                        {formatCurrency(project.budget_remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Отчёт по сотрудникам */}
      {activeReport === 'employees' && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Сотрудник</th>
                    <th>Должность</th>
                    <th>Отработано дней</th>
                    <th>Зарплата</th>
                    <th>Проектов</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesReport.map(employee => (
                    <tr key={employee.id}>
                      <td><strong>{employee.name}</strong></td>
                      <td>{employee.role || '-'}</td>
                      <td>{employee.days_worked || 0}</td>
                      <td><strong>{formatCurrency(employee.total_salary)}</strong></td>
                      <td>{employee.projects_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Отчёт по материалам */}
      {activeReport === 'materials' && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Материал</th>
                    <th>Единица</th>
                    <th>Цена за единицу</th>
                    <th>Всего списано</th>
                    <th>Общая стоимость</th>
                    <th>Проектов</th>
                  </tr>
                </thead>
                <tbody>
                  {materialsReport.map(material => (
                    <tr key={material.id}>
                      <td><strong>{material.name}</strong></td>
                      <td>{material.unit}</td>
                      <td>{formatCurrency(material.price_per_unit)}</td>
                      <td>{material.total_amount || 0}</td>
                      <td><strong>{formatCurrency(material.total_cost)}</strong></td>
                      <td>{material.projects_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

