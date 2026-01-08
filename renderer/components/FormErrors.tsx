import React, { MouseEventHandler, ReactElement } from 'react';

/**
 * Пропсы для компонента FormErrors
 */
export interface FormErrorsProps {
  /** Объект с ошибками { fieldName: 'error message' } */
  errors?: Record<string, string>;
  /** Общая ошибка формы */
  generalError?: string | null;
  /** Обработчик закрытия ошибки */
  onDismiss?: (() => void) | null;
}

/**
 * Компонент для отображения ошибок валидации формы
 * Визуальная индикация ошибок с поддержкой полей и общих ошибок
 */
export default function FormErrors({ 
  errors = {}, 
  generalError = null, 
  onDismiss = null 
}: FormErrorsProps): ReactElement | null {
  const hasErrors = Object.keys(errors).length > 0 || generalError;

  if (!hasErrors) {
    return null;
  }

  const handleDismiss: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (onDismiss) {
      onDismiss();
    }
  };

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
              onClick={handleDismiss}
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
 * Пропсы для компонента FieldError
 */
export interface FieldErrorProps {
  /** Текст ошибки */
  error?: string | null;
  /** Показывать ли ошибку */
  show?: boolean;
}

/**
 * Компонент для отображения ошибки конкретного поля
 */
export function FieldError({ error, show = false }: FieldErrorProps): ReactElement | null {
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
 * @param fieldName - Имя поля
 * @param errors - Объект с ошибками
 * @returns Классы для input
 */
export function getFieldClasses(fieldName: string, errors: Record<string, string>): string {
  const baseClasses = 'form-control';
  return errors[fieldName] ? `${baseClasses} is-invalid` : baseClasses;
}


