import React, { useState, useEffect } from 'react';
import FormValidator from '../utils/formValidator';
import FormErrors, { FieldError, getFieldClasses } from './FormErrors';
import { saveToHistory, getSuggestions } from '../utils/autocomplete';
import { getTemplates, saveTemplate, applyTemplate, checkDuplicates } from '../utils/templates';

/**
 * Форма для добавления/редактирования материала
 * С валидацией на клиенте, автозаполнением и шаблонами
 */
export default function MaterialForm({ material, onSave, onCancel, existingMaterials = [] }) {
  const [form, setForm] = useState({ 
    name: '', 
    unit: 'шт', 
    price_per_unit: 0
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (material) {
      setForm({
        name: material.name || '',
        unit: material.unit || 'шт',
        price_per_unit: material.price_per_unit || 0
      });
    } else {
      setForm({ name: '', unit: 'шт', price_per_unit: 0 });
      loadTemplates();
    }
  }, [material]);

  const loadTemplates = () => {
    const templatesList = getTemplates('materials');
    setTemplates(templatesList);
  };

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const value = e.target.type === 'number' 
      ? (e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
      : e.target.value;
    
    setForm({ ...form, [fieldName]: value });
    
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: null });
    }

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
        price_per_unit: {
          type: 'number',
          label: 'Цена за единицу',
          required: false,
          min: 0,
          allowNegative: false
        }
      }
    };

    const validation = FormValidator.validateForm(form, rules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!material) {
      const duplicateCheck = checkDuplicates(
        'materials',
        form,
        existingMaterials,
        ['name']
      );

      if (duplicateCheck.hasDuplicate) {
        setErrors({ name: duplicateCheck.message });
        return;
      }
    }

    saveToHistory('name', form.name);

    try {
      await onSave(form);
      if (!material) {
        setForm({ name: '', unit: 'шт', price_per_unit: 0 });
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
    saveTemplate('materials', templateName, form);
    setTemplateName('');
    setShowTemplates(false);
    loadTemplates();
    alert('Шаблон сохранён');
  };

  const handleApplyTemplate = (templateName) => {
    const templateData = applyTemplate('materials', templateName);
    if (templateData) {
      setForm({ ...form, ...templateData });
      setShowTemplates(false);
    }
  };

  return (
    <form className="card card-body mb-4 shadow-sm" style={{maxWidth: 800}} onSubmit={handleSubmit}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">
          {material ? '✏️ Редактировать материал' : '➕ Добавить материал'}
        </h3>
        {!material && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            📋 Шаблоны
          </button>
        )}
      </div>

      {showTemplates && !material && (
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
              placeholder="Цемент, Кирпич, Доска" 
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
            className={getFieldClasses('price_per_unit', errors)}
            placeholder="0"
          />
          <FieldError error={errors.price_per_unit} show={!!errors.price_per_unit} />
        </div>
      </div>
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
