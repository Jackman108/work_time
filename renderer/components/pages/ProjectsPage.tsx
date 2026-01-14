/**
 * Страница управления строительными объектами
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '@renderer/hooks';
import { getProjects, createProject, updateProject, deleteProject } from '@renderer/api';
import { formatCurrency, formatDate } from '@renderer/utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '@renderer/components/FormErrors';
import FormValidator from '@renderer/utils/formValidator';
import type { Project, ProjectFormData } from '@renderer/types';

const initialFormData: ProjectFormData = {
  name: '',
  address: '',
  budget: '',
  start_date: '',
  end_date: '',
  description: ''
};

export default function ProjectsPage() {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const { items: projects, loading, editingItem, setEditingItem, handleAdd, handleUpdate, handleDelete, confirmDialog } = usePageData<Project>({
    loadData: getProjects,
    createItem: createProject,
    updateItem: updateProject,
    deleteItem: deleteProject,
    messages: {
      createSuccess: 'Проект успешно создан',
      updateSuccess: 'Проект успешно обновлён',
      deleteSuccess: 'Проект успешно удалён',
      deleteConfirmTitle: 'Удаление проекта',
      deleteConfirmMessage: 'Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.'
    }
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        address: editingItem.address || '',
        budget: editingItem.budget ? String(editingItem.budget) : '',
        start_date: editingItem.start_date ? editingItem.start_date.split('T')[0] : '',
        end_date: editingItem.end_date ? editingItem.end_date.split('T')[0] : '',
        description: editingItem.description || ''
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    const requiredValidation = FormValidator.validateRequired(formData, ['name', 'address', 'budget']);
    Object.assign(errors, requiredValidation.errors);

    const budgetValidation = FormValidator.validateNumber(formData.budget, 'budget', {
      min: 0,
      allowZero: false,
      required: true
    });
    if (!budgetValidation.isValid && budgetValidation.error) {
      errors.budget = budgetValidation.error;
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        errors.end_date = 'Дата окончания не может быть раньше даты начала';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        name: formData.name,
        address: formData.address,
        budget: parseFloat(formData.budget),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        description: formData.description || null
      };

      if (editingItem) {
        await handleUpdate(editingItem.id, submitData);
      } else {
        await handleAdd(submitData);
      }
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения проекта:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Управление объектами</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} disabled={loading}>
          + Добавить объект
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={projects.length} />

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingItem ? 'Редактирование объекта' : 'Новый объект'}</h5>
          </div>
          <div className="card-body">
            <FormErrors errors={formErrors} />
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Название *</label>
                  <input type="text" className={getFieldClasses('name', formErrors)} name="name" value={formData.name} onChange={handleInputChange} required />
                  <FieldError error={formErrors.name || ''} show={!!formErrors.name} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Адрес *</label>
                  <input type="text" className={getFieldClasses('address', formErrors)} name="address" value={formData.address} onChange={handleInputChange} required />
                  <FieldError error={formErrors.address || ''} show={!!formErrors.address} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Бюджет *</label>
                  <input type="number" step="0.01" className={getFieldClasses('budget', formErrors)} name="budget" value={formData.budget} onChange={handleInputChange} required />
                  <FieldError error={formErrors.budget || ''} show={!!formErrors.budget} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Дата начала</label>
                  <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleInputChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Дата окончания</label>
                  <input type="date" className={getFieldClasses('end_date', formErrors)} name="end_date" value={formData.end_date} onChange={handleInputChange} />
                  <FieldError error={formErrors.end_date || ''} show={!!formErrors.end_date} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Описание</label>
                <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingItem ? 'Сохранить' : 'Создать'}</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && projects.length === 0 && !showForm && (
        <div className="alert alert-info">Объекты не найдены. Создайте первый объект.</div>
      )}

      {projects.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Адрес</th>
                    <th>Бюджет</th>
                    <th>Даты</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.address}</td>
                      <td>{formatCurrency(project.budget)}</td>
                      <td>
                        {project.start_date && formatDate(project.start_date)}
                        {project.start_date && project.end_date && ' - '}
                        {project.end_date && formatDate(project.end_date)}
                        {!project.start_date && !project.end_date && '-'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingItem(project)}>Редактировать</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(project.id)}>Удалить</button>
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


