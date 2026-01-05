import React, { useState, useEffect } from 'react';
import FormValidator from '../../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from '../common/FormErrors';
import { saveToHistory, getSuggestions } from '../../utils/autocomplete';
import { getTemplates, saveTemplate, applyTemplate, checkDuplicates } from '../../utils/templates';

/**
 * Форма для добавления/редактирования сотрудника
 * С валидацией на клиенте, автозаполнением и шаблонами
 * @param {Object} props - Пропсы компонента
 * @param {Types.Employee|null} [props.employee] - Сотрудник для редактирования (если null - создание нового)
 * @param {Function} props.onSave - Обработчик сохранения
 * @param {Function} props.onCancel - Обработчик отмены
 * @param {Types.Employee[]} [props.existingEmployees=[]] - Существующие сотрудники для проверки дублей
 */
export default function EmployeeForm({ employee, onSave, onCancel, existingEmployees = [] }) {
  const [form, setForm] = useState({ 
    name: '', 
    role: '', 
    wage_per_hour: 0,
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
      loadTemplates();
    }
  }, [employee]);

  const loadTemplates = () => {
    const templatesList = getTemplates('employees');
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
          label: 'ФИО',
          required: true,
          minLength: 2,
          maxLength: 255
        },
        role: {
          type: 'string',
          label: 'Должность',
          required: false,
          maxLength: 255
        },
        wage_per_hour: {
          type: 'number',
          label: 'Ставка за час',
          required: false,
          min: 0,
          allowNegative: false
        },
        phone: {
          type: 'phone',
          label: 'Телефон',
          required: false
        }
      }
    };

    // Валидация формы
    const validation = FormValidator.validateForm(form, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Проверка на дубли (только при создании)
    if (!employee) {
      const duplicateCheck = checkDuplicates(
        'employees',
        form,
        existingEmployees,
        ['name']
      );

      if (duplicateCheck.hasDuplicate) {
        setErrors({ name: duplicateCheck.message });
        return;
      }
    }

    // Сохраняем в историю автозаполнения
    saveToHistory('name', form.name);
    if (form.role) {
      saveToHistory('role', form.role);
    }
    if (form.phone) {
      saveToHistory('phone', form.phone);
    }

    try {
      await onSave(form);
      // Очищаем форму после успешного сохранения
      if (!employee) {
        setForm({ name: '', role: '', wage_per_hour: 0, phone: '' });
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
    saveTemplate('employees', templateName, form);
    setTemplateName('');
    setShowTemplates(false);
    loadTemplates();
    alert('Шаблон сохранён');
  };

  const handleApplyTemplate = (templateName) => {
    const templateData = applyTemplate('employees', templateName);
    if (templateData) {
      setForm({ ...form, ...templateData });
      setShowTemplates(false);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">
          {employee ? '✏️ Редактировать сотрудника' : '➕ Добавить сотрудника'}
        </h3>
        {!employee && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            📋 Шаблоны
          </button>
        )}
      </div>

      {/* Шаблоны */}
      {showTemplates && !employee && (
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
          <label className="form-label">ФИО *</label>
          <div className="position-relative">
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange}
              className={getFieldClasses('name', errors)}
              placeholder="Иванов Иван Иванович" 
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
          <label className="form-label">Должность</label>
          <div className="position-relative">
            <input 
              name="role" 
              value={form.role} 
              onChange={handleChange}
              className={getFieldClasses('role', errors)}
              placeholder="Прораб, Мастер, Рабочий" 
            />
            {suggestions.role && suggestions.role.length > 0 && (
              <div className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {suggestions.role.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => handleSuggestionClick('role', suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FieldError error={errors.role} show={!!errors.role} />
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
            className={getFieldClasses('wage_per_hour', errors)}
            placeholder="0"
          />
          <FieldError error={errors.wage_per_hour} show={!!errors.wage_per_hour} />
        </div>
        <div className="col-md-6 mb-2">
          <label className="form-label">Телефон</label>
          <input 
            name="phone" 
            value={form.phone} 
            onChange={handleChange}
            className={getFieldClasses('phone', errors)}
            placeholder="+7 (999) 123-45-67" 
          />
          <FieldError error={errors.phone} show={!!errors.phone} />
          <small className="form-text text-muted">Формат: +7 (999) 123-45-67 или 89991234567</small>
        </div>
      </div>
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

