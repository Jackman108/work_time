/**
 * Страница управления сотрудниками
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '@renderer/hooks';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@renderer/api';
import { formatDate, formatCurrency } from '@renderer/utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '@renderer/components/FormErrors';
import FormValidator from '@renderer/utils/formValidator';
import type { Employee, EmployeeFormData } from '@renderer/types';

const initialFormData: EmployeeFormData = {
  name: '',
  phone: '',
  position: '',
  hire_date: '',
  salary_per_day: ''
};

export default function EmployeesPage() {
  
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const pageData = usePageData<Employee>({
    loadData: getEmployees,
    createItem: createEmployee,
    updateItem: updateEmployee,
    deleteItem: async (id) => { await deleteEmployee(id); },
    messages: {
      createSuccess: 'Сотрудник успешно создан',
      updateSuccess: 'Сотрудник успешно обновлён',
      deleteSuccess: 'Сотрудник успешно удалён',
      deleteConfirmTitle: 'Удаление сотрудника',
      deleteConfirmMessage: 'Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить.'
    }
  });

  const { items: employees, loading, editingItem, setEditingItem, handleAdd, handleUpdate, handleDelete, confirmDialog } = pageData;

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        phone: editingItem.phone || '',
        position: editingItem.position || '',
        hire_date: editingItem.hire_date ? editingItem.hire_date.split('T')[0] : '',
        salary_per_day: editingItem.salary_per_day ? String(editingItem.salary_per_day) : ''
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    const requiredValidation = FormValidator.validateRequired(formData, ['name', 'phone', 'position']);
    Object.assign(errors, requiredValidation.errors);

    if (formData.salary_per_day) {
      const salaryValidation = FormValidator.validateNumber(formData.salary_per_day, 'salary_per_day', {
        min: 0,
        allowZero: false
      });
      if (!salaryValidation.isValid && salaryValidation.error) {
        errors.salary_per_day = salaryValidation.error;
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
        phone: formData.phone,
        position: formData.position,
        salary_per_day: formData.salary_per_day ? parseFloat(formData.salary_per_day) : null,
        hire_date: formData.hire_date || null
      };

      if (editingItem) {
        await handleUpdate(editingItem.id, submitData);
      } else {
        await handleAdd(submitData);
      }
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения сотрудника:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Управление сотрудниками</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} disabled={loading}>
          + Добавить сотрудника
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={employees.length} />

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingItem ? 'Редактирование сотрудника' : 'Новый сотрудник'}</h5>
          </div>
          <div className="card-body">
            <FormErrors errors={formErrors} />
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">ФИО *</label>
                  <input type="text" className={getFieldClasses('name', formErrors)} name="name" value={formData.name} onChange={handleInputChange} required />
                  <FieldError error={formErrors.name || ''} show={!!formErrors.name} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Телефон *</label>
                  <input type="tel" className={getFieldClasses('phone', formErrors)} name="phone" value={formData.phone} onChange={handleInputChange} required />
                  <FieldError error={formErrors.phone || ''} show={!!formErrors.phone} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Должность *</label>
                  <input type="text" className={getFieldClasses('position', formErrors)} name="position" value={formData.position} onChange={handleInputChange} required />
                  <FieldError error={formErrors.position || ''} show={!!formErrors.position} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Дата найма</label>
                  <input type="date" className="form-control" name="hire_date" value={formData.hire_date} onChange={handleInputChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Зарплата в день (руб.)</label>
                  <input type="number" step="0.01" className={getFieldClasses('salary_per_day', formErrors)} name="salary_per_day" value={formData.salary_per_day} onChange={handleInputChange} />
                  <FieldError error={formErrors.salary_per_day || ''} show={!!formErrors.salary_per_day} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">{editingItem ? 'Сохранить' : 'Создать'}</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && employees.length === 0 && !showForm && (
        <div className="alert alert-info">Сотрудники не найдены. Создайте первого сотрудника.</div>
      )}

      {employees.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Телефон</th>
                    <th>Должность</th>
                    <th>Дата найма</th>
                    <th>Зарплата в день</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.phone}</td>
                      <td>{employee.position}</td>
                      <td>{formatDate(employee.hire_date)}</td>
                      <td>{employee.salary_per_day ? formatCurrency(employee.salary_per_day) : '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingItem(employee)}>Редактировать</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(employee.id)}>Удалить</button>
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


