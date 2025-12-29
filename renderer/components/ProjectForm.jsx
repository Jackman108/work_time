import React, { useState, useEffect } from 'react';

/**
 * Форма для добавления/редактирования проекта
 * @param {Object} project - Проект для редактирования (если null - создание нового)
 * @param {Function} onSave - Обработчик сохранения
 * @param {Function} onCancel - Обработчик отмены
 */
export default function ProjectForm({ project, onSave, onCancel }) {
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    date_start: '', 
    date_end: '', 
    budget: 0 
  });
  const [error, setError] = useState('');

  // Заполняем форму данными проекта при редактировании
  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        address: project.address || '',
        date_start: project.date_start || '',
        date_end: project.date_end || '',
        budget: project.budget || 0
      });
    } else {
      setForm({ name: '', address: '', date_start: '', date_end: '', budget: 0 });
    }
  }, [project]);

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
        {project ? '✏️ Редактировать объект' : '➕ Добавить объект строительства'}
      </h3>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Название *</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Название объекта" 
            required
          />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Адрес</label>
          <input 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Адрес объекта" 
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-4 mb-2">
          <label className="form-label">Дата начала</label>
          <input 
            name="date_start" 
            value={form.date_start} 
            onChange={handleChange} 
            type="date" 
            className="form-control" 
          />
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">Дата окончания</label>
          <input 
            name="date_end" 
            value={form.date_end} 
            onChange={handleChange} 
            type="date" 
            className="form-control" 
          />
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">Бюджет (руб.)</label>
          <input 
            name="budget" 
            value={form.budget} 
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
          {project ? 'Сохранить' : 'Добавить'}
        </button>
        {project && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

