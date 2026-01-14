/**
 * Страница управления строительными объектами
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '@renderer/hooks';
import { getProjects, createProject, updateProject, deleteProject } from '@renderer/api';
import { formatCurrency, formatDate } from '@renderer/utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '@renderer/components/FormErrors';
import FormValidator from '@renderer/utils/formValidator';
import MobileCardView, { type CardColumnConfig } from '@renderer/components/MobileCardView';
import MobileFormModal from '@renderer/components/MobileFormModal';
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
    <div className="container mt-2 mt-md-4">
      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <h1 className="h3 h-md-1 mb-0">Управление объектами</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => { resetForm(); setShowForm(true); }} 
          disabled={loading}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <i className="bi bi-plus-lg d-md-none"></i>
          <span className="d-none d-md-inline">+ Добавить объект</span>
          <span className="d-md-none">Добавить</span>
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={projects.length} />

      {/* Форма в модальном окне на мобильных, в карточке на desktop */}
      <MobileFormModal
        isOpen={showForm}
        onClose={resetForm}
        title={editingItem ? 'Редактирование объекта' : 'Новый объект'}
        className="d-md-none"
      >
        <FormErrors errors={formErrors} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Название *</label>
            <input type="text" className={getFieldClasses('name', formErrors)} name="name" value={formData.name} onChange={handleInputChange} required />
            <FieldError error={formErrors.name || ''} show={!!formErrors.name} />
          </div>
          <div className="mb-3">
            <label className="form-label">Адрес *</label>
            <input type="text" className={getFieldClasses('address', formErrors)} name="address" value={formData.address} onChange={handleInputChange} required />
            <FieldError error={formErrors.address || ''} show={!!formErrors.address} />
          </div>
          <div className="mb-3">
            <label className="form-label">Бюджет *</label>
            <input type="number" step="0.01" className={getFieldClasses('budget', formErrors)} name="budget" value={formData.budget} onChange={handleInputChange} required />
            <FieldError error={formErrors.budget || ''} show={!!formErrors.budget} />
          </div>
          <div className="mb-3">
            <label className="form-label">Дата начала</label>
            <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleInputChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Дата окончания</label>
            <input type="date" className={getFieldClasses('end_date', formErrors)} name="end_date" value={formData.end_date} onChange={handleInputChange} />
            <FieldError error={formErrors.end_date || ''} show={!!formErrors.end_date} />
          </div>
          <div className="mb-3">
            <label className="form-label">Описание</label>
            <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              {editingItem ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      </MobileFormModal>

      {/* Desktop форма (в карточке) */}
      {showForm && (
        <div className="card mb-4 d-none d-md-block">
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
          <div className="card-body p-0 p-md-3">
            {/* Конфигурация колонок для MobileCardView */}
            {(() => {
              const columns: CardColumnConfig[] = [
                {
                  key: 'name',
                  label: 'Название',
                  priority: 1,
                  fullWidth: true
                },
                {
                  key: 'address',
                  label: 'Адрес',
                  cardLabel: 'Адрес',
                  priority: 2,
                  fullWidth: true
                },
                {
                  key: 'budget',
                  label: 'Бюджет',
                  cardLabel: 'Бюджет',
                  priority: 3,
                  format: (value) => formatCurrency(value)
                },
                {
                  key: 'dates',
                  label: 'Даты',
                  cardLabel: 'Период',
                  priority: 4,
                  fullWidth: true,
                  format: (_, item) => {
                    if (item.start_date && item.end_date) {
                      return `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`;
                    }
                    if (item.start_date) {
                      return `С ${formatDate(item.start_date)}`;
                    }
                    if (item.end_date) {
                      return `До ${formatDate(item.end_date)}`;
                    }
                    return '-';
                  }
                }
              ];

              return (
                <MobileCardView
                  data={projects.map(p => ({ ...p, dates: null }))} // dates вычисляется в format
                  columns={columns}
                  keyField="id"
                  renderActions={(project) => (
                    <>
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => setEditingItem(project)}
                        style={{ minWidth: 'auto', flex: 1 }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        <span className="d-none d-sm-inline">Редактировать</span>
                        <span className="d-sm-none">Изменить</span>
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => handleDelete(project.id)}
                        style={{ minWidth: 'auto', flex: 1 }}
                      >
                        <i className="bi bi-trash me-1"></i>
                        <span className="d-none d-sm-inline">Удалить</span>
                        <span className="d-sm-none">Удалить</span>
                      </button>
                    </>
                  )}
                  emptyState={
                    <div className="alert alert-info m-3">
                      Объекты не найдены. Создайте первый объект.
                    </div>
                  }
                />
              );
            })()}
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}


