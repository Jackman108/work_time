import React, { useState, useEffect } from 'react';
import { getProjectPayments, createProjectPayment, updateProjectPayment, deleteProjectPayment, getProjects } from '../../api';
import ProjectPaymentForm from '../ProjectPaymentForm';
import ProjectPaymentList from '../ProjectPaymentList';

/**
 * Страница учёта поступлений денег на проекты
 */
export default function PayrollPage() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [paymentsData, projectsData] = await Promise.all([
        getProjectPayments(filters),
        getProjects()
      ]);
      setPayments(paymentsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleAdd = async (paymentData) => {
    try {
      await createProjectPayment(paymentData);
      await loadData();
      setEditingPayment(null);
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, paymentData) => {
    try {
      await updateProjectPayment(id, paymentData);
      await loadData();
      setEditingPayment(null);
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await deleteProjectPayment(id);
        await loadData();
      } catch (error) {
        console.error('Ошибка удаления записи:', error);
        alert('Ошибка удаления записи');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">💵 Учёт поступлений денег на проекты</h2>
      
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
  );
}
