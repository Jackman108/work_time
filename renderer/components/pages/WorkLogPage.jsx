import React, { useState, useEffect } from 'react';
import { getWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, getProjects, getEmployees } from '../../api';
import { useNotifications, useConfirmDialog, LoadingSpinner } from '../common';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { WorkLogForm } from '../forms';
import { WorkLogList } from '../lists';

/**
 * Страница учёта заработанных денег работниками
 * Использует систему уведомлений и обработку ошибок
 */
export default function WorkLogPage() {
  const [workLogs, setWorkLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const { execute: executeOperation, loading: operationLoading } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
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
      showError('Ошибка загрузки данных: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (logData) => {
    try {
      await executeOperation(
        () => createWorkLog(logData),
        {
          successMessage: 'Запись успешно добавлена',
          errorMessage: 'Ошибка создания записи'
        }
      );
      await loadData();
      setEditingLog(null);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, logData) => {
    try {
      await executeOperation(
        () => updateWorkLog(id, logData),
        {
          successMessage: 'Запись успешно обновлена',
          errorMessage: 'Ошибка обновления записи'
        }
      );
      await loadData();
      setEditingLog(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление записи',
        message: 'Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteWorkLog(id),
        {
          successMessage: 'Запись успешно удалена',
          errorMessage: 'Ошибка удаления записи'
        }
      );
      await loadData();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана
      }
    }
  };

  if (loading && workLogs.length === 0) {
    return <LoadingSpinner fullScreen={true} text="Загрузка данных..." size="lg" className="" />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">💰 Учёт заработанных денег работниками</h2>
        
        {operationLoading && <LoadingSpinner text="Выполнение операции..." size="md" fullScreen={false} className="" />}

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
          existingWorkLogs={workLogs.filter(wl => !editingLog || wl.id !== editingLog.id)}
        />
        <WorkLogList 
          workLogs={workLogs}
          onEdit={setEditingLog}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

