/**
 * Страница учёта списания материалов
 */

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { usePageData, PageLoadingSpinner } from '../../hooks';
import { getMaterialLogs, createMaterialLog, updateMaterialLog, deleteMaterialLog, getProjects, getMaterials } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import FormErrors, { FieldError, getFieldClasses } from '../FormErrors';
import FormValidator from '../../utils/formValidator';
import type { MaterialLog, MaterialLogFormData, Project, Material } from '../../types';

const initialFormData: MaterialLogFormData = {
  project_id: '',
  material_id: '',
  date: '',
  amount: '',
  notes: ''
};

export default function MaterialLogPage() {
  const [formData, setFormData] = useState<MaterialLogFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const { items: materialLogs, loading, editingItem, setEditingItem, handleAdd, handleUpdate, handleDelete, confirmDialog } = usePageData<MaterialLog>({
    loadData: getMaterialLogs,
    createItem: createMaterialLog,
    updateItem: updateMaterialLog,
    deleteItem: deleteMaterialLog,
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
    loadMaterials();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data || []);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setFormData({
        project_id: editingItem.project_id ? String(editingItem.project_id) : '',
        material_id: editingItem.material_id ? String(editingItem.material_id) : '',
        date: editingItem.date ? editingItem.date.split('T')[0] : '',
        amount: editingItem.amount ? String(editingItem.amount) : '',
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
    
    const requiredValidation = FormValidator.validateRequired(formData, ['project_id', 'material_id', 'date', 'amount']);
    Object.assign(errors, requiredValidation.errors);

    const amountValidation = FormValidator.validateNumber(formData.amount, 'amount', {
      min: 0,
      allowZero: false,
      required: true
    });
    if (!amountValidation.isValid && amountValidation.error) {
      errors.amount = amountValidation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        project_id: parseInt(formData.project_id),
        material_id: parseInt(formData.material_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
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

  const getMaterialUnit = (materialId: number): string => {
    const material = materials.find(m => m.id === materialId);
    return material?.unit || '';
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Списание материалов</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} disabled={loading}>
          + Добавить запись
        </button>
      </div>

      <PageLoadingSpinner loading={loading} itemsCount={materialLogs.length} />

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
                  <label className="form-label">Объект *</label>
                  <select className={getFieldClasses('project_id', formErrors)} name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                    <option value="">Выберите объект</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                  <FieldError error={formErrors.project_id || ''} show={!!formErrors.project_id} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Материал *</label>
                  <select className={getFieldClasses('material_id', formErrors)} name="material_id" value={formData.material_id} onChange={handleInputChange} required>
                    <option value="">Выберите материал</option>
                    {materials.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>
                    ))}
                  </select>
                  <FieldError error={formErrors.material_id || ''} show={!!formErrors.material_id} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Дата *</label>
                  <input type="date" className={getFieldClasses('date', formErrors)} name="date" value={formData.date} onChange={handleInputChange} required />
                  <FieldError error={formErrors.date || ''} show={!!formErrors.date} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Количество *</label>
                  <input type="number" step="0.01" className={getFieldClasses('amount', formErrors)} name="amount" value={formData.amount} onChange={handleInputChange} required />
                  <FieldError error={formErrors.amount || ''} show={!!formErrors.amount} />
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

      {!loading && materialLogs.length === 0 && !showForm && (
        <div className="alert alert-info">Записи не найдены. Создайте первую запись.</div>
      )}

      {materialLogs.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Материал</th>
                    <th>Дата</th>
                    <th>Количество</th>
                    <th>Стоимость</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {materialLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.project_name || '-'}</td>
                      <td>{log.material_name || '-'}</td>
                      <td>{formatDate(log.date)}</td>
                      <td>{log.amount} {log.unit || ''}</td>
                      <td>{formatCurrency((log.amount || 0) * (log.price_per_unit || 0))}</td>
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


