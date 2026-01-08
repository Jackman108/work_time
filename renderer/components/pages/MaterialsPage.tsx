/**
 * Страница управления материалами
 */

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '../../hooks';
import { useNotifications } from '../common';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api';
import { formatCurrency } from '../../utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '../FormErrors';
import FormValidator from '../../utils/formValidator';
import type { Material, MaterialFormData } from '../../types';

const initialFormData: MaterialFormData = {
  name: '',
  unit: '',
  price_per_unit: ''
};

export default function MaterialsPage() {
  const { showSuccess, showError } = useNotifications();
  
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const { items: materials, loading, editingItem, setEditingItem, handleAdd, handleUpdate, handleDelete, confirmDialog } = usePageData<Material>({
    loadData: getMaterials,
    createItem: createMaterial,
    updateItem: updateMaterial,
    deleteItem: deleteMaterial,
    messages: {
      createSuccess: 'Материал успешно создан',
      updateSuccess: 'Материал успешно обновлён',
      deleteSuccess: 'Материал успешно удалён',
      deleteConfirmTitle: 'Удаление материала',
      deleteConfirmMessage: 'Вы уверены, что хотите удалить этот материал? Это действие нельзя отменить.'
    }
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        unit: editingItem.unit || '',
        price_per_unit: editingItem.price_per_unit ? String(editingItem.price_per_unit) : ''
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
    
    const requiredValidation = FormValidator.validateRequired(formData, ['name', 'unit', 'price_per_unit']);
    Object.assign(errors, requiredValidation.errors);

    const priceValidation = FormValidator.validateNumber(formData.price_per_unit, 'price_per_unit', {
      min: 0,
      allowZero: false,
      required: true
    });
    if (!priceValidation.isValid && priceValidation.error) {
      errors.price_per_unit = priceValidation.error;
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
        unit: formData.unit,
        price_per_unit: parseFloat(formData.price_per_unit)
      };

      if (editingItem) {
        await handleUpdate(editingItem.id, submitData);
      } else {
        await handleAdd(submitData);
      }
      resetForm();
    } catch (error) {
      console.error('Ошибка сохранения материала:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Управление материалами</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} disabled={loading}>
          + Добавить материал
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={materials.length} />

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingItem ? 'Редактирование материала' : 'Новый материал'}</h5>
          </div>
          <div className="card-body">
            <FormErrors errors={formErrors} />
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Название *</label>
                  <input type="text" className={getFieldClasses('name', formErrors)} name="name" value={formData.name} onChange={handleInputChange} required />
                  <FieldError error={formErrors.name || ''} show={!!formErrors.name} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Единица измерения *</label>
                  <input type="text" className={getFieldClasses('unit', formErrors)} name="unit" value={formData.unit} onChange={handleInputChange} required placeholder="шт, м, кг и т.д." />
                  <FieldError error={formErrors.unit || ''} show={!!formErrors.unit} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Цена за единицу *</label>
                  <input type="number" step="0.01" className={getFieldClasses('price_per_unit', formErrors)} name="price_per_unit" value={formData.price_per_unit} onChange={handleInputChange} required />
                  <FieldError error={formErrors.price_per_unit || ''} show={!!formErrors.price_per_unit} />
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

      {!loading && materials.length === 0 && !showForm && (
        <div className="alert alert-info">Материалы не найдены. Создайте первый материал.</div>
      )}

      {materials.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Единица измерения</th>
                    <th>Цена за единицу</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(material => (
                    <tr key={material.id}>
                      <td>{material.name}</td>
                      <td>{material.unit}</td>
                      <td>{formatCurrency(material.price_per_unit)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingItem(material)}>Редактировать</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(material.id)}>Удалить</button>
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


