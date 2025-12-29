import React, { useState, useEffect } from 'react';
import { getWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, getProjects, getEmployees } from '../../api';
import WorkLogForm from '../WorkLogForm';
import WorkLogList from '../WorkLogList';

/**
 * Страница учёта заработанных денег работниками
 */
export default function WorkLogPage() {
  const [workLogs, setWorkLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [logsData, projectsData, employeesData] = await Promise.all([
        getWorkLogs(filters),
        getProjects(),
        getEmployees()
      ]);
      setWorkLogs(logsData);
      setProjects(projectsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleAdd = async (logData) => {
    try {
      await createWorkLog(logData);
      await loadData();
      setEditingLog(null);
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, logData) => {
    try {
      await updateWorkLog(id, logData);
      await loadData();
      setEditingLog(null);
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await deleteWorkLog(id);
        await loadData();
      } catch (error) {
        console.error('Ошибка удаления записи:', error);
        alert('Ошибка удаления записи');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">💰 Учёт заработанных денег работниками</h2>
      
      {/* Фильтры */}
      <div className="card card-body mb-4">
        <h5 className="mb-3">Фильтры</h5>
        <div className="row">
          <div className="col-md-3 mb-2">
            <label className="form-label">Проект</label>
            <select 
              className="form-select"
              value={filters.projectId || ''}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value || null })}
            >
              <option value="">Все проекты</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Сотрудник</label>
            <select 
              className="form-select"
              value={filters.employeeId || ''}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || null })}
            >
              <option value="">Все сотрудники</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">С</label>
            <input 
              type="date"
              className="form-control"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">По</label>
            <input 
              type="date"
              className="form-control"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
            />
          </div>
        </div>
        <button 
          className="btn btn-sm btn-outline-secondary mt-2"
          onClick={() => setFilters({})}
        >
          Сбросить фильтры
        </button>
      </div>

      <WorkLogForm 
        log={editingLog}
        projects={projects}
        employees={employees}
        onSave={editingLog ? (data) => handleUpdate(editingLog.id, data) : handleAdd}
        onCancel={() => setEditingLog(null)}
      />
      <WorkLogList 
        workLogs={workLogs}
        onEdit={setEditingLog}
        onDelete={handleDelete}
      />
    </div>
  );
}

