import React from 'react';

/**
 * Компонент для отображения ошибок валидации формы
 * Визуальная индикация ошибок с поддержкой полей и общих ошибок
 * 
 * @module renderer/components/common/FormErrors
 * @param {Object} props - Пропсы компонента
 * @param {Object} [props.errors={}] - Объект с ошибками { fieldName: 'error message' }
 * @param {string|null} [props.generalError=null] - Общая ошибка формы
 * @param {Function|null} [props.onDismiss=null] - Обработчик закрытия ошибки
 */
export default function FormErrors({ errors = {}, generalError = null, onDismiss = null }) {
  const hasErrors = Object.keys(errors).length > 0 || generalError;

  if (!hasErrors) {
    return null;
  }

  return (
    <div className="form-errors">
      {/* Общая ошибка */}
      {generalError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Ошибка:</strong> {generalError}
          {onDismiss && (
            <button
              type="button"
              className="btn-close"
              onClick={onDismiss}
              aria-label="Close"
            ></button>
          )}
        </div>
      )}

      {/* Ошибки по полям */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-danger" role="alert">
          <strong>Исправьте следующие ошибки:</strong>
          <ul className="mb-0 mt-2">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Компонент для отображения ошибки конкретного поля
 * 
 * @param {Object} props - Пропсы компонента
 * @param {string|null} props.error - Текст ошибки
 * @param {boolean} [props.show=false] - Показывать ли ошибку
 * @returns {React.ReactElement|null} Элемент ошибки или null
 */
export function FieldError({ error, show = false }) {
  if (!show || !error) {
    return null;
  }

  return (
    <div className="invalid-feedback d-block">
      {error}
    </div>
  );
}

/**
 * Хук для получения классов поля с ошибкой
 * 
 * @param {string} fieldName - Имя поля
 * @param {Object} errors - Объект с ошибками
 * @returns {string} Классы для input
 */
export function getFieldClasses(fieldName, errors) {
  const baseClasses = 'form-control';
  return errors[fieldName] ? `${baseClasses} is-invalid` : baseClasses;
}

