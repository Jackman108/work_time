import React, { useState, useEffect } from 'react';
import FormValidator from '../../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from '../common/FormErrors';
import { getTodayDate } from '../../utils/formatters';

/**
 * Дефолтные значения формы поступления денег (без даты, дата вычисляется динамически)
 */
const DEFAULT_PAYMENT_FORM = {
  project_id: '',
  amount: 0,
  notes: ''
};

/**
 * Форма для добавления/редактирования записи поступления денег на проект
 * С валидацией на клиенте
 * @param {Object} props - Пропсы компонента
 * @param {Types.ProjectPayment|null} [props.payment] - Запись для редактирования (если null - создание новой)
 * @param {Types.Project[]} props.projects - Список проектов
 * @param {Function} props.onSave - Обработчик сохранения
 * @param {Function} props.onCancel - Обработчик отмены
 */
export default function ProjectPaymentForm({ payment, projects, onSave, onCancel }) {
  const [form, setForm] = useState({ ...DEFAULT_PAYMENT_FORM, date: getTodayDate() });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (payment) {
      setForm({
        project_id: payment.project_id || '',
        date: payment.date || getTodayDate(),
        amount: payment.amount || 0,
        notes: payment.notes || ''
      });
    } else {
      setForm({ ...DEFAULT_PAYMENT_FORM, date: getTodayDate() });
    }
  }, [payment]);

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const value = e.target.type === 'number' 
      ? (e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
      : e.target.value;
    
    setForm({ ...form, [fieldName]: value });
    
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: null });
    }
  };

  const handleAmountBlur = (e) => {
    // При потере фокуса округляем сумму до кратного 100
    const inputValue = parseFloat(e.target.value) || 0;
    const roundedValue = Math.round(inputValue / 100) * 100;
    setForm({ ...form, amount: roundedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    const rules = {
      required: ['project_id', 'date', 'amount'],
      fields: {
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
        amount: {
          type: 'number',
          label: 'Сумма',
          required: true,
          min: 100,
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

    // Округляем сумму до кратного 100
    const roundedAmount = Math.round(form.amount / 100) * 100;
    if (roundedAmount < 100) {
      setErrors({ amount: 'Сумма должна быть не менее 100 рублей' });
      return;
    }

    const dataToSave = {
      ...form,
      project_id: parseInt(form.project_id),
      amount: roundedAmount
    };

    try {
      await onSave(dataToSave);
    } catch (err) {
      setGeneralError('Ошибка сохранения: ' + err.message);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {payment ? '✏️ Редактировать запись' : '➕ Добавить поступление денег на проект'}
      </h3>

      <FormErrors errors={errors} generalError={generalError} />

      <div className="row">
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
        <div className="col-md-6 mb-2">
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
            className={getFieldClasses('amount', errors)}
            placeholder="100"
            required
          />
          <FieldError error={errors.amount} show={!!errors.amount} />
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

