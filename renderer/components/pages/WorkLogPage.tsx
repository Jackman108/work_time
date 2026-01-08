/**
 * Страница учёта заработанных денег работниками
 */

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '../../hooks';
import { getWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, getProjects, getEmployees } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '../FormErrors';
import FormValidator from '../../utils/formValidator';
import type { WorkLog, WorkLogFormData, Project, Employee } from '../../types';

const initialFormData: WorkLogFormData = {
  employee_id: '',
  project_id: '',
  date: '',
  salary_per_day: '',
  notes: ''
};

export default function WorkLogPage() {
  const [formData, setFormData] = useState<WorkLogFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const { items: workLogs, loading, editingItem, setEditingItem, handleAdd, handleUpdate, handleDelete, confirmDialog } = usePageData<WorkLog>({
    loadData: getWorkLogs,
    createItem: createWorkLog,
    updateItem: updateWorkLog,
    deleteItem: deleteWorkLog,
    messages: {
      createSuccess: 'Запись успешно создана',
      updateSuccess: 'Запись успешно обновлена',
      deleteSuccess: 'Запись успешно удалена',
      deleteConfirmTitle: 'Удаление записи',
      deleteConfirmMessage: 'Вы уверены, что хотите удалить эту запись?'
    }
  });

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setFormData({
        employee_id: editingItem.employee_id ? String(editingItem.employee_id) : '',
        project_id: editingItem.project_id ? String(editingItem.project_id) : '',
        date: editingItem.date ? editingItem.date.split('T')[0] : '',
        salary_per_day: editingItem.salary_per_day ? String(editingItem.salary_per_day) : '',
        notes: editingItem.notes || ''
      });
      setShowForm(true);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setShowForm(false);
    setEditingItem(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const requiredValidation = FormValidator.validateRequired(formData, ['employee_id', 'project_id', 'date', 'salary_per_day']);
    Object.assign(errors, requiredValidation.errors);

    const salaryValidation = FormValidator.validateNumber(formData.salary_per_day, 'salary_per_day', {
      min: 0,
      allowZero: false,
      required: true
    });
    if (!salaryValidation.isValid && salaryValidation.error) {
      errors.salary_per_day = salaryValidation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        employee_id: parseInt(formData.employee_id),
        project_id: parseInt(formData.project_id),
        date: formData.date,
        salary_per_day: parseFloat(formData.salary_per_day),
        notes: formData.notes || null
      };

      if (editingItem) {
        await handleUpdate(editingItem.id, submitData);
      } else {
        await handleAdd(submitData);
      }
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения записи:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Учёт заработанных денег</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} disabled={loading}>
          + Добавить запись
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={workLogs.length} />

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingItem ? 'Редактирование записи' : 'Новая запись'}</h5>
          </div>
          <div className="card-body">
            <FormErrors errors={formErrors} />
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Сотрудник *</label>
                  <select className={getFieldClasses('employee_id', formErrors)} name="employee_id" value={formData.employee_id} onChange={handleInputChange} required>
                    <option value="">Выберите сотрудника</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <FieldError error={formErrors.employee_id || ''} show={!!formErrors.employee_id} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Объект *</label>
                  <select className={getFieldClasses('project_id', formErrors)} name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                    <option value="">Выберите объект</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                  <FieldError error={formErrors.project_id || ''} show={!!formErrors.project_id} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Дата *</label>
                  <input type="date" className={getFieldClasses('date', formErrors)} name="date" value={formData.date} onChange={handleInputChange} required />
                  <FieldError error={formErrors.date || ''} show={!!formErrors.date} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Сумма за день *</label>
                  <input type="number" step="0.01" className={getFieldClasses('salary_per_day', formErrors)} name="salary_per_day" value={formData.salary_per_day} onChange={handleInputChange} required />
                  <FieldError error={formErrors.salary_per_day || ''} show={!!formErrors.salary_per_day} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Примечание</label>
                <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows={2} />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingItem ? 'Сохранить' : 'Создать'}</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && workLogs.length === 0 && !showForm && (
        <div className="alert alert-info">Записи не найдены. Создайте первую запись.</div>
      )}

      {workLogs.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Объект</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {workLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.employee_name || '-'}</td>
                      <td>{log.project_name || '-'}</td>
                      <td>{formatDate(log.date)}</td>
                      <td>{formatCurrency(log.salary_per_day)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingItem(log)}>Редактировать</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(log.id)}>Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}


