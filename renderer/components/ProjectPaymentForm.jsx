import React, { useState, useEffect } from 'react';

/**
 * Форма для добавления/редактирования записи поступления денег на проект
 */
export default function ProjectPaymentForm({ payment, projects, onSave, onCancel }) {
  const [form, setForm] = useState({ 
    project_id: '', 
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setForm({
        project_id: payment.project_id || '',
        date: payment.date || new Date().toISOString().split('T')[0],
        amount: payment.amount || 0,
        notes: payment.notes || ''
      });
    } else {
      setForm({ 
        project_id: '', 
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: ''
      });
    }
  }, [payment]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleAmountBlur = (e) => {
    // При потере фокуса округляем сумму до кратного 100
    const inputValue = parseFloat(e.target.value) || 0;
    const roundedValue = Math.round(inputValue / 100) * 100;
    setForm({ ...form, amount: roundedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_id) {
      setError('Выберите проект');
      return;
    }
    // Округляем сумму до кратного 100
    const roundedAmount = Math.round(form.amount / 100) * 100;
    if (roundedAmount <= 0) {
      setError('Сумма должна быть больше 0 и кратной 100 рублям');
      return;
    }
    setError('');
    const dataToSave = {
      ...form,
      project_id: parseInt(form.project_id),
      amount: roundedAmount
    };
    try {
      await onSave(dataToSave);
    } catch (err) {
      setError('Ошибка сохранения: ' + err.message);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {payment ? '✏️ Редактировать запись' : '➕ Добавить поступление денег на проект'}
      </h3>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Проект *</label>
          <select 
            name="project_id" 
            value={form.project_id} 
            onChange={handleChange} 
            className="form-select"
            required
          >
            <option value="">Выберите проект</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Дата *</label>
          <input 
            name="date" 
            value={form.date} 
            onChange={handleChange} 
            type="date" 
            className="form-control" 
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Сумма поступления (руб., кратно 100) *</label>
          <input 
            name="amount" 
            value={form.amount} 
            onChange={handleChange}
            onBlur={handleAmountBlur}
            type="number" 
            step="100"
            min="100"
            className="form-control" 
            placeholder="100"
            required
          />
          <small className="form-text text-muted">Сумма поступления денег на проект, кратная 100 рублям</small>
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Примечание</label>
          <input 
            name="notes" 
            value={form.notes} 
            onChange={handleChange} 
            className="form-control" 
            placeholder="Опционально"
          />
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}
      <div className="mt-3">
        <button className="btn btn-primary me-2" type="submit">
          {payment ? 'Сохранить' : 'Добавить'}
        </button>
        {payment && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

