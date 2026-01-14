/**
 * Централизованная система валидации входных данных на стороне main process
 * Защищает от некорректных данных и потенциальных уязвимостей
 * Следует принципам Single Responsibility и Defense in Depth
 * 
 * @module services/validation/InputValidator
 */

/**
 * Результат валидации
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Правила валидации для поля
 */
interface FieldValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'email' | 'phone';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

/**
 * Схема валидации для объекта
 */
type ValidationSchema = Record<string, FieldValidationRule>;

/**
 * Класс для валидации входных данных
 * Обеспечивает защиту от SQL инъекций через типизацию и валидацию типов
 */
export class InputValidator {
  /**
   * Валидировать строку
   */
  private static validateString(
    value: unknown,
    fieldName: string,
    rules: FieldValidationRule
  ): string | null {
    // Проверка обязательности
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} обязательно для заполнения`;
    }

    // Если поле не обязательное и пустое, пропускаем
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Проверка типа
    if (typeof value !== 'string') {
      return `${fieldName} должно быть строкой`;
    }

    const strValue = value.trim();

    // Проверка длины
    if (rules.minLength !== undefined && strValue.length < rules.minLength) {
      return `${fieldName} должно содержать не менее ${rules.minLength} символов`;
    }

    if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
      return `${fieldName} должно содержать не более ${rules.maxLength} символов`;
    }

    // Проверка паттерна
    if (rules.pattern && !rules.pattern.test(strValue)) {
      return `${fieldName} имеет неверный формат`;
    }

    // Кастомная валидация
    if (rules.custom) {
      const customError = rules.custom(strValue);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Валидировать число
   */
  private static validateNumber(
    value: unknown,
    fieldName: string,
    rules: FieldValidationRule
  ): string | null {
    // Проверка обязательности
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} обязательно для заполнения`;
    }

    // Если поле не обязательное и пустое, пропускаем
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Преобразование в число
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

    // Проверка, что это валидное число
    if (isNaN(numValue) || !isFinite(numValue)) {
      return `${fieldName} должно быть числом`;
    }

    // Проверка диапазона
    if (rules.min !== undefined && numValue < rules.min) {
      return `${fieldName} должно быть не менее ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return `${fieldName} должно быть не более ${rules.max}`;
    }

    // Кастомная валидация
    if (rules.custom) {
      const customError = rules.custom(numValue);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Валидировать дату
   */
  private static validateDate(
    value: unknown,
    fieldName: string,
    rules: FieldValidationRule
  ): string | null {
    // Проверка обязательности
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} обязательно для заполнения`;
    }

    // Если поле не обязательное и пустое, пропускаем
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Проверка формата даты (ISO 8601 или YYYY-MM-DD)
    const dateStr = String(value);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(dateStr)) {
      return `${fieldName} должно быть в формате YYYY-MM-DD`;
    }

    // Проверка, что дата валидна
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return `${fieldName} содержит невалидную дату`;
    }

    return null;
  }

  /**
   * Валидировать объект по схеме
   */
  static validate<T extends Record<string, unknown>>(
    data: T,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];
      let error: string | null = null;

      // Определяем тип и валидируем
      if (rules.type === 'string' || (!rules.type && typeof value === 'string')) {
        error = this.validateString(value, fieldName, rules);
      } else if (rules.type === 'number' || (!rules.type && typeof value === 'number')) {
        error = this.validateNumber(value, fieldName, rules);
      } else if (rules.type === 'date') {
        error = this.validateDate(value, fieldName, rules);
      } else if (rules.custom) {
        error = rules.custom(value);
      }

      if (error) {
        errors[fieldName] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Валидировать ID (защита от SQL инъекций через проверку типа)
   */
  static validateId(id: unknown, fieldName: string = 'id'): number {
    if (typeof id !== 'number' && typeof id !== 'string') {
      throw new Error(`${fieldName} должен быть числом или строкой`);
    }

    const numId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(numId) || !isFinite(numId) || numId <= 0 || !Number.isInteger(numId)) {
      throw new Error(`${fieldName} должен быть положительным целым числом`);
    }

    return numId;
  }

  /**
   * Санитизировать строку (удаление потенциально опасных символов)
   */
  static sanitizeString(value: unknown, maxLength: number = 1000): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value)
      .trim()
      .slice(0, maxLength)
      // Удаляем потенциально опасные символы для SQL (хотя Drizzle защищает, но лучше перестраховаться)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Удаляем управляющие символы

    return str;
  }
}

/**
 * Предопределенные схемы валидации для различных сущностей
 */
export const ValidationSchemas = {
  /**
   * Схема валидации для проекта
   */
  project: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    address: {
      required: false,
      type: 'string' as const,
      maxLength: 500
    },
    budget: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    start_date: {
      required: false,
      type: 'date' as const
    },
    end_date: {
      required: false,
      type: 'date' as const
    },
    description: {
      required: false,
      type: 'string' as const,
      maxLength: 2000
    }
  } as ValidationSchema,

  /**
   * Схема валидации для сотрудника
   */
  employee: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    phone: {
      required: false,
      type: 'string' as const,
      maxLength: 20,
      pattern: /^[\d\s\-\+\(\)]+$/
    },
    role: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    },
    wage_per_hour: {
      required: false,
      type: 'number' as const,
      min: 0
    }
  } as ValidationSchema,

  /**
   * Схема валидации для материала
   */
  material: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    unit: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50
    },
    price_per_unit: {
      required: true,
      type: 'number' as const,
      min: 0
    }
  } as ValidationSchema,

  /**
   * Схема валидации для записи рабочего времени
   */
  workLog: {
    employee_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    project_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    date: {
      required: true,
      type: 'date' as const
    },
    salary_per_day: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    notes: {
      required: false,
      type: 'string' as const,
      maxLength: 1000
    }
  } as ValidationSchema,

  /**
   * Схема валидации для записи списания материала
   */
  materialLog: {
    material_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    project_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    date: {
      required: true,
      type: 'date' as const
    },
    amount: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    notes: {
      required: false,
      type: 'string' as const,
      maxLength: 1000
    }
  } as ValidationSchema,

  /**
   * Схема валидации для платежа по проекту
   */
  projectPayment: {
    project_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    date: {
      required: true,
      type: 'date' as const
    },
    amount: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    notes: {
      required: false,
      type: 'string' as const,
      maxLength: 1000
    }
  } as ValidationSchema
};
