import React, { useState, useEffect } from 'react';

/**
 * Форма для добавления/редактирования материала
 */
export default function MaterialForm({ material, onSave, onCancel }) {
  const [form, setForm] = useState({ 
    name: '', 
    unit: 'шт', 
    price_per_unit: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (material) {
      setForm({
        name: material.name || '',
        unit: material.unit || 'шт',
        price_per_unit: material.price_per_unit || 0
      });
    } else {
      setForm({ name: '', unit: 'шт', price_per_unit: 0 });
    }
  }, [material]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Название обязательно');
      return;
    }
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError('Ошибка сохранения: ' + err.message);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {material ? '✏️ Редактировать материал' : '➕ Добавить материал'}
      </h3>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Название *</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Цемент, Кирпич, Доска" 
            required
          />
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Единица измерения</label>
          <select 
            name="unit" 
            value={form.unit} 
            onChange={handleChange} 
            className="form-select"
          >
            <option value="шт">шт</option>
            <option value="кг">кг</option>
            <option value="т">т</option>
            <option value="м">м</option>
            <option value="м²">м²</option>
            <option value="м³">м³</option>
            <option value="л">л</option>
          </select>
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Цена за единицу (руб.)</label>
          <input 
            name="price_per_unit" 
            value={form.price_per_unit} 
            onChange={handleChange} 
            type="number" 
            step="0.01"
            min="0"
            className="form-control" 
            placeholder="0"
          />
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}
      <div className="mt-3">
        <button className="btn btn-primary me-2" type="submit">
          {material ? 'Сохранить' : 'Добавить'}
        </button>
        {material && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

