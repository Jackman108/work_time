import React, { useState, useEffect } from 'react';
import FormValidator from '../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from './FormErrors';
import { checkDuplicateByCombination } from '../utils/templates';

/**
 * Форма для добавления/редактирования записи рабочего времени
 * С валидацией на клиенте и проверкой дублей
 * @param {Object} log - Запись для редактирования (если null - создание новой)
 * @param {Array} projects - Список проектов
 * @param {Array} employees - Список сотрудников
 * @param {Function} onSave - Обработчик сохранения
 * @param {Function} onCancel - Обработчик отмены
 * @param {Array} existingWorkLogs - Существующие записи для проверки дублей
 */
export default function WorkLogForm({ log, projects, employees, onSave, onCancel, existingWorkLogs = [] }) {
  const [form, setForm] = useState({ 
    employee_id: '', 
    project_id: '', 
    date: new Date().toISOString().split('T')[0],
    salary_per_day: 0,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

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
    const fieldName = e.target.name;
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    // Если выбран сотрудник (и это новая запись, не редактирование), устанавливаем дефолтную зарплату
    if (fieldName === 'employee_id' && value && !log) {
      const selectedEmployee = employees.find(emp => emp.id === parseInt(value));
      if (selectedEmployee && selectedEmployee.wage_per_hour) {
        // Используем ставку за час как дефолтное значение, округляем до кратного 100
        const defaultSalary = Math.round(selectedEmployee.wage_per_hour / 100) * 100;
        setForm({ ...form, employee_id: value, salary_per_day: defaultSalary || 0 });
        if (errors.employee_id) {
          setErrors({ ...errors, employee_id: null });
        }
        return;
      }
    }
    
    setForm({ ...form, [fieldName]: value });
    
    // Очищаем ошибку поля при изменении
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: null });
    }
  };

  const handleSalaryBlur = (e) => {
    // При потере фокуса округляем зарплату до кратного 100 (опционально, для удобства)
    // Пользователь может вводить любые числа с клавиатуры, округление происходит только при потере фокуса
    const inputValue = parseFloat(e.target.value) || 0;
    if (inputValue > 0) {
      const roundedValue = Math.round(inputValue / 100) * 100;
      setForm({ ...form, salary_per_day: roundedValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    const rules = {
      required: ['employee_id', 'project_id', 'date', 'salary_per_day'],
      fields: {
        employee_id: {
          type: 'string',
          label: 'Сотрудник',
          required: true
        },
        project_id: {
          type: 'string',
          label: 'Проект',
          required: true
        },
        date: {
          type: 'date',
          label: 'Дата',
          required: true
        },
        salary_per_day: {
          type: 'number',
          label: 'Зарплата за день',
          required: true,
          min: 0.01,
          allowZero: false,
          allowNegative: false
        }
      }
    };

    const validation = FormValidator.validateForm(form, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Округляем зарплату до кратного 100
    const roundedSalary = Math.round(form.salary_per_day / 100) * 100;
    if (roundedSalary <= 0) {
      setErrors({ salary_per_day: 'Зарплата за день должна быть больше нуля' });
      return;
    }

    // Проверка на дубли: один сотрудник не может иметь две записи в один день на одном объекте
    const duplicateCheck = checkDuplicateByCombination(
      {
        employee_id: parseInt(form.employee_id),
        project_id: parseInt(form.project_id),
        date: form.date
      },
      existingWorkLogs,
      ['employee_id', 'project_id', 'date'],
      log ? log.id : null
    );

    if (duplicateCheck.hasDuplicate) {
      setErrors({ 
        date: 'У этого сотрудника уже есть запись на этот объект в указанную дату. ' +
              'Один сотрудник может работать в один день на разных объектах, но не может иметь две записи на одном объекте.'
      });
      return;
    }

    const dataToSave = {
      ...form,
      employee_id: parseInt(form.employee_id),
      project_id: parseInt(form.project_id),
      salary_per_day: roundedSalary
    };

    try {
      await onSave(dataToSave);
    } catch (err) {
      // Если ошибка от сервера о дубле, показываем её
      if (err.message && err.message.includes('уже есть запись')) {
        setErrors({ 
          date: err.message 
        });
      } else {
        setGeneralError('Ошибка сохранения: ' + err.message);
      }
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {log ? '✏️ Редактировать запись' : '➕ Добавить учёт'}
      </h3>

      <FormErrors errors={errors} generalError={generalError} />

      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Сотрудник *</label>
          <select 
            name="employee_id" 
            value={form.employee_id} 
            onChange={handleChange} 
            className={getFieldClasses('employee_id', errors)}
            required
          >
            <option value="">Выберите сотрудника</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} {e.role ? `(${e.role})` : ''}</option>
            ))}
          </select>
          <FieldError error={errors.employee_id} show={!!errors.employee_id} />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Проект *</label>
          <select 
            name="project_id" 
            value={form.project_id} 
            onChange={handleChange} 
            className={getFieldClasses('project_id', errors)}
            required
          >
            <option value="">Выберите проект</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <FieldError error={errors.project_id} show={!!errors.project_id} />
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
            className={getFieldClasses('date', errors)}
            required
          />
          <FieldError error={errors.date} show={!!errors.date} />
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">Зарплата за день (руб.) *</label>
          <input 
            name="salary_per_day" 
            value={form.salary_per_day} 
            onChange={handleChange}
            onBlur={handleSalaryBlur}
            type="number" 
            step="1"
            min="0"
            className={getFieldClasses('salary_per_day', errors)}
            placeholder="Введите сумму"
            required
          />
          <FieldError error={errors.salary_per_day} show={!!errors.salary_per_day} />
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

