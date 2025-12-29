import React, { useState, useEffect } from 'react';

/**
 * Форма для добавления/редактирования записи рабочего времени
 */
export default function WorkLogForm({ log, projects, employees, onSave, onCancel }) {
  const [form, setForm] = useState({ 
    employee_id: '', 
    project_id: '', 
    date: new Date().toISOString().split('T')[0],
    salary_per_day: 0,
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (log) {
      setForm({
        employee_id: log.employee_id || '',
        project_id: log.project_id || '',
        date: log.date || new Date().toISOString().split('T')[0],
        salary_per_day: log.salary_per_day || 0,
        notes: log.notes || ''
      });
    } else {
      setForm({ 
        employee_id: '', 
        project_id: '', 
        date: new Date().toISOString().split('T')[0],
        salary_per_day: 0,
        notes: ''
      });
    }
  }, [log]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    // Если выбран сотрудник (и это новая запись, не редактирование), устанавливаем дефолтную зарплату
    if (e.target.name === 'employee_id' && value && !log) {
      const selectedEmployee = employees.find(emp => emp.id === parseInt(value));
      if (selectedEmployee && selectedEmployee.wage_per_hour) {
        // Используем ставку за час как дефолтное значение, округляем до кратного 100
        const defaultSalary = Math.round(selectedEmployee.wage_per_hour / 100) * 100;
        setForm({ ...form, employee_id: value, salary_per_day: defaultSalary || 0 });
        return;
      }
    }
    
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSalaryBlur = (e) => {
    // При потере фокуса округляем зарплату до кратного 100
    const inputValue = parseFloat(e.target.value) || 0;
    const roundedValue = Math.round(inputValue / 100) * 100;
    setForm({ ...form, salary_per_day: roundedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.project_id) {
      setError('Выберите сотрудника и проект');
      return;
    }
    // Округляем зарплату до кратного 100
    const roundedSalary = Math.round(form.salary_per_day / 100) * 100;
    if (roundedSalary <= 0) {
      setError('Зарплата за день');
      return;
    }
    setError('');
    const dataToSave = {
      ...form,
      employee_id: parseInt(form.employee_id),
      project_id: parseInt(form.project_id),
      salary_per_day: roundedSalary
    };
    console.log('WorkLogForm - отправляемые данные:', dataToSave);
    try {
      await onSave(dataToSave);
    } catch (err) {
      console.error('WorkLogForm - ошибка сохранения:', err);
      setError('Ошибка сохранения: ' + err.message);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {log ? '✏️ Редактировать запись' : '➕ Добавить учёт'}
      </h3>
      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Сотрудник *</label>
          <select 
            name="employee_id" 
            value={form.employee_id} 
            onChange={handleChange} 
            className="form-select"
            required
          >
            <option value="">Выберите сотрудника</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} {e.role ? `(${e.role})` : ''}</option>
            ))}
          </select>
        </div>
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
      </div>
      <div className="row">
        <div className="col-md-4 mb-2">
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
        <div className="col-md-4 mb-2">
          <label className="form-label">Зарплата за день (руб.) *</label>
          <input 
            name="salary_per_day" 
            value={form.salary_per_day} 
            onChange={handleChange}
            onBlur={handleSalaryBlur}
            type="number" 
            step="100"
            min="100"
            className="form-control" 
            placeholder="100"
            required
          />
          <small className="form-text text-muted">Заработанные деньги работником</small>
        </div>
        <div className="col-md-4 mb-2">
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
          {log ? 'Сохранить' : 'Добавить'}
        </button>
        {log && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

