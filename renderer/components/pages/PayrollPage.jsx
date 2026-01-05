import React, { useState, useEffect } from 'react';
import { getProjectPayments, createProjectPayment, updateProjectPayment, deleteProjectPayment, getProjects } from '../../api';
import { useNotifications, useConfirmDialog, LoadingSpinner } from '../common';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { ProjectPaymentForm } from '../forms';
import { ProjectPaymentList } from '../lists';

/**
 * Страница учёта поступлений денег на проекты
 * Использует систему уведомлений и обработку ошибок
 */
export default function PayrollPage() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
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
      const [paymentsData, projectsData] = await Promise.all([
        getProjectPayments(filters),
        getProjects()
      ]);
      setPayments(paymentsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      showError('Ошибка загрузки данных: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (paymentData) => {
    try {
      await executeOperation(
        () => createProjectPayment(paymentData),
        {
          successMessage: 'Запись поступления успешно добавлена',
          errorMessage: 'Ошибка создания записи поступления'
        }
      );
      await loadData();
      setEditingPayment(null);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, paymentData) => {
    try {
      await executeOperation(
        () => updateProjectPayment(id, paymentData),
        {
          successMessage: 'Запись поступления успешно обновлена',
          errorMessage: 'Ошибка обновления записи поступления'
        }
      );
      await loadData();
      setEditingPayment(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление записи',
        message: 'Вы уверены, что хотите удалить эту запись поступления? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteProjectPayment(id),
        {
          successMessage: 'Запись поступления успешно удалена',
          errorMessage: 'Ошибка удаления записи поступления'
        }
      );
      await loadData();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана
      }
    }
  };

  if (loading && payments.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка данных..." />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">💵 Учёт поступлений денег на проекты</h2>
        
        {operationLoading && <LoadingSpinner text="Выполнение операции..." />}

        {/* Фильтры */}
        <div className="card card-body mb-4">
          <h5 className="mb-3">Фильтры</h5>
          <div className="row">
            <div className="col-md-4 mb-2">
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
            <div className="col-md-4 mb-2">
              <label className="form-label">С</label>
              <input 
                type="date"
                className="form-control"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
              />
            </div>
            <div className="col-md-4 mb-2">
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

        <ProjectPaymentForm 
          payment={editingPayment}
          projects={projects}
          onSave={editingPayment ? (data) => handleUpdate(editingPayment.id, data) : handleAdd}
          onCancel={() => setEditingPayment(null)}
        />
        <ProjectPaymentList 
          payments={payments}
          onEdit={setEditingPayment}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}
