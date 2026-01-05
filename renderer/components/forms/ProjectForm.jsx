import React, { useState, useEffect } from 'react';
import FormValidator from '../../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from '../common/FormErrors';
import { saveToHistory, getSuggestions } from '../../utils/autocomplete';
import { getTemplates, saveTemplate, applyTemplate, checkDuplicates } from '../../utils/templates';

/**
 * Форма для добавления/редактирования проекта
 * С валидацией на клиенте, автозаполнением и шаблонами
 * @param {Object} props - Пропсы компонента
 * @param {Types.Project|null} [props.project] - Проект для редактирования (если null - создание нового)
 * @param {Function} props.onSave - Обработчик сохранения
 * @param {Function} props.onCancel - Обработчик отмены
 * @param {Types.Project[]} [props.existingProjects=[]] - Существующие проекты для проверки дублей
 */
export default function ProjectForm({ project, onSave, onCancel, existingProjects = [] }) {
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    date_start: '', 
    date_end: '', 
    budget: 0 
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
      loadTemplates();
    }
  }, [project]);

  // Загружаем шаблоны
  const loadTemplates = async () => {
    const templatesList = getTemplates('projects');
    setTemplates(templatesList);
  };


  const handleChange = (e) => {
    const fieldName = e.target.name;
    const value = e.target.type === 'number' 
      ? (e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
      : e.target.value;
    
    setForm({ ...form, [fieldName]: value });
    
    // Очищаем ошибку поля при изменении
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: null });
    }

    // Автозаполнение для текстовых полей
    if (e.target.type === 'text' && value.length >= 2) {
      const fieldSuggestions = getSuggestions(fieldName, value);
      if (fieldSuggestions.length > 0) {
        setSuggestions({ ...suggestions, [fieldName]: fieldSuggestions });
      } else {
        setSuggestions({ ...suggestions, [fieldName]: [] });
      }
    }

    // Валидация дат в реальном времени
    if (fieldName === 'date_start' || fieldName === 'date_end') {
      validateDates();
    }
  };

  const validateDates = () => {
    if (form.date_start && form.date_end) {
      const result = FormValidator.validateDateRange(form.date_start, form.date_end);
      if (!result.isValid) {
        setErrors({ ...errors, date_end: result.error });
      } else if (errors.date_end) {
        setErrors({ ...errors, date_end: null });
      }
    }
  };

  const handleSuggestionClick = (fieldName, suggestion) => {
    setForm({ ...form, [fieldName]: suggestion });
    setSuggestions({ ...suggestions, [fieldName]: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    // Правила валидации
    const rules = {
      required: ['name'],
      fields: {
        name: {
          type: 'string',
          label: 'Название',
          required: true,
          minLength: 1,
          maxLength: 255
        },
        address: {
          type: 'string',
          label: 'Адрес',
          required: false,
          maxLength: 500
        },
        date_start: {
          type: 'date',
          label: 'Дата начала',
          required: false
        },
        date_end: {
          type: 'date',
          label: 'Дата окончания',
          required: false
        },
        budget: {
          type: 'number',
          label: 'Бюджет',
          required: false,
          min: 0,
          allowNegative: false
        }
      },
      custom: [
        {
          field: 'date_end',
          validator: (data) => {
            if (data.date_start && data.date_end) {
              return FormValidator.validateDateRange(data.date_start, data.date_end);
            }
            return { isValid: true };
          }
        }
      ]
    };

    // Валидация формы
    const validation = FormValidator.validateForm(form, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Проверка на дубли (только при создании)
    if (!project) {
      const duplicateCheck = checkDuplicates(
        'projects',
        form,
        existingProjects,
        ['name']
      );

      if (duplicateCheck.hasDuplicate) {
        setErrors({ name: duplicateCheck.message });
        return;
      }
    }

    // Сохраняем в историю автозаполнения
    saveToHistory('name', form.name);
    if (form.address) {
      saveToHistory('address', form.address);
    }

    try {
      await onSave(form);
      // Очищаем форму после успешного сохранения
      if (!project) {
        setForm({ name: '', address: '', date_start: '', date_end: '', budget: 0 });
      }
    } catch (err) {
      setGeneralError('Ошибка сохранения: ' + err.message);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Введите название шаблона');
      return;
    }
    saveTemplate('projects', templateName, form);
    setTemplateName('');
    setShowTemplates(false);
    loadTemplates();
    alert('Шаблон сохранён');
  };

  const handleApplyTemplate = (templateName) => {
    const templateData = applyTemplate('projects', templateName);
    if (templateData) {
      setForm({ ...form, ...templateData });
      setShowTemplates(false);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">
          {project ? '✏️ Редактировать объект' : '➕ Добавить объект строительства'}
        </h3>
        {!project && (
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              📋 Шаблоны
            </button>
          </div>
        )}
      </div>

      {/* Шаблоны */}
      {showTemplates && !project && (
        <div className="card card-body mb-3 bg-light">
          <h6 className="mb-2">Шаблоны</h6>
          {templates.length > 0 && (
            <div className="mb-2">
              <label className="form-label small">Применить шаблон:</label>
              <div className="d-flex gap-2 flex-wrap">
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleApplyTemplate(template.name)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Название шаблона"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleSaveTemplate}
            >
              Сохранить как шаблон
            </button>
          </div>
        </div>
      )}

      <FormErrors errors={errors} generalError={generalError} />

      <div className="row">
        <div className="col-md-6 mb-2">
          <label className="form-label">Название *</label>
          <div className="position-relative">
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange}
              className={getFieldClasses('name', errors)}
              placeholder="Название объекта" 
              required
            />
            {suggestions.name && suggestions.name.length > 0 && (
              <div className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {suggestions.name.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => handleSuggestionClick('name', suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FieldError error={errors.name} show={!!errors.name} />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Адрес</label>
          <div className="position-relative">
            <input 
              name="address" 
              value={form.address} 
              onChange={handleChange}
              className={getFieldClasses('address', errors)}
              placeholder="Адрес объекта" 
            />
            {suggestions.address && suggestions.address.length > 0 && (
              <div className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {suggestions.address.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => handleSuggestionClick('address', suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FieldError error={errors.address} show={!!errors.address} />
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
            className={getFieldClasses('date_start', errors)}
          />
          <FieldError error={errors.date_start} show={!!errors.date_start} />
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">Дата окончания</label>
          <input 
            name="date_end" 
            value={form.date_end} 
            onChange={handleChange} 
            type="date" 
            className={getFieldClasses('date_end', errors)}
            min={form.date_start || undefined}
          />
          <FieldError error={errors.date_end} show={!!errors.date_end} />
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
            className={getFieldClasses('budget', errors)}
            placeholder="0"
          />
          <FieldError error={errors.budget} show={!!errors.budget} />
        </div>
      </div>
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

