import React, { useState, useEffect } from 'react';

/**
 * Форма для добавления/редактирования сотрудника
 */
export default function EmployeeForm({ employee, onSave, onCancel }) {
  const [form, setForm] = useState({ 
    name: '', 
    role: '', 
    wage_per_hour: 0,
    phone: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        role: employee.role || '',
        wage_per_hour: employee.wage_per_hour || 0,
        phone: employee.phone || ''
      });
    } else {
      setForm({ name: '', role: '', wage_per_hour: 0, phone: '' });
    }
  }, [employee]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('ФИО обязательно');
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
        {employee ? '✏️ Редактировать сотрудника' : '➕ Добавить сотрудника'}
      </h3>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">ФИО *</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Иванов Иван Иванович" 
            required
          />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Должность</label>
          <input 
            name="role" 
            value={form.role} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Прораб, Мастер, Рабочий" 
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Ставка за час (руб.)</label>
          <input 
            name="wage_per_hour" 
            value={form.wage_per_hour} 
            onChange={handleChange} 
            type="number" 
            step="0.01"
            min="0"
            className="form-control" 
            placeholder="0"
          />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Телефон</label>
          <input 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="+7 (999) 123-45-67" 
          />
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}
      <div className="mt-3">
        <button className="btn btn-primary me-2" type="submit">
          {employee ? 'Сохранить' : 'Добавить'}
        </button>
        {employee && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

