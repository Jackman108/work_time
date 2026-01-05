import React, { useState, useEffect } from 'react';
import FormValidator from '../../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from '../common/FormErrors';
import { getTodayDate } from '../../utils/formatters';

/**
 * Дефолтные значения формы списания материалов (без даты, дата вычисляется динамически)
 */
const DEFAULT_MATERIAL_LOG_FORM = {
  material_id: '',
  project_id: '',
  amount: 0,
  notes: ''
};

/**
 * Форма для добавления/редактирования записи списания материалов
 * С валидацией на клиенте
 * @param {Object} props - Пропсы компонента
 * @param {Types.MaterialLog|null} [props.log] - Запись для редактирования (если null - создание новой)
 * @param {Types.Material[]} props.materials - Список материалов
 * @param {Types.Project[]} props.projects - Список проектов
 * @param {Function} props.onSave - Обработчик сохранения
 * @param {Function} props.onCancel - Обработчик отмены
 */
export default function MaterialLogForm({ log, materials, projects, onSave, onCancel }) {
  const [form, setForm] = useState({ ...DEFAULT_MATERIAL_LOG_FORM, date: getTodayDate() });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (log) {
      setForm({
        material_id: log.material_id || '',
        project_id: log.project_id || '',
        date: log.date || getTodayDate(),
        amount: log.amount || 0,
        notes: log.notes || ''
      });
    } else {
      setForm({ ...DEFAULT_MATERIAL_LOG_FORM, date: getTodayDate() });
    }
  }, [log]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    const rules = {
      required: ['material_id', 'project_id', 'date', 'amount'],
      fields: {
        material_id: {
          type: 'string',
          label: 'Материал',
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
        amount: {
          type: 'number',
          label: 'Количество',
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

    const dataToSave = {
      ...form,
      material_id: parseInt(form.material_id),
      project_id: parseInt(form.project_id),
      amount: parseFloat(form.amount)
    };

    try {
      await onSave(dataToSave);
    } catch (err) {
      setGeneralError('Ошибка сохранения: ' + err.message);
    }
  };

  // Получаем выбранный материал для отображения единицы измерения
  const selectedMaterial = materials.find(m => m.id === parseInt(form.material_id));

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <h3 className="h5 mb-3">
        {log ? '✏️ Редактировать запись списания' : '➕ Добавить списание материала'}
      </h3>

      <FormErrors errors={errors} generalError={generalError} />

      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Материал *</label>
          <select 
            name="material_id" 
            value={form.material_id} 
            onChange={handleChange} 
            className={getFieldClasses('material_id', errors)}
            required
          >
            <option value="">Выберите материал</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit || 'шт'}, {m.price_per_unit ? `${m.price_per_unit.toFixed(2)} руб.` : '0 руб.'})
              </option>
            ))}
          </select>
          <FieldError error={errors.material_id} show={!!errors.material_id} />
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
          <label className="form-label">
            Количество {selectedMaterial ? `(${selectedMaterial.unit || 'шт'})` : ''} *
          </label>
          <input 
            name="amount" 
            value={form.amount} 
            onChange={handleChange}
            type="number" 
            step="0.01"
            min="0.01"
            className={getFieldClasses('amount', errors)}
            placeholder="0"
            required
          />
          <FieldError error={errors.amount} show={!!errors.amount} />
          {selectedMaterial && (
            <small className="form-text text-muted">
              Стоимость: {((form.amount || 0) * (selectedMaterial.price_per_unit || 0)).toFixed(2)} руб.
            </small>
          )}
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

