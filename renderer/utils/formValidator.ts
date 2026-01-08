/**
 * Утилита для валидации форм
 */

interface ValidationResult {
  isValid: boolean;
  error?: string | null;
  errors?: Record<string, string>;
}

interface NumberValidationOptions {
  min?: number | null;
  max?: number | null;
  allowZero?: boolean;
  allowNegative?: boolean;
  required?: boolean;
}

interface StringValidationOptions {
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: RegExp | null;
  required?: boolean;
}

interface DateValidationOptions {
  required?: boolean;
  minDate?: string | null;
  maxDate?: string | null;
}

interface FieldRule {
  type: 'number' | 'string' | 'date' | 'phone';
  label?: string;
  min?: number | null;
  max?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: RegExp | null;
  allowZero?: boolean;
  allowNegative?: boolean;
  required?: boolean;
  minDate?: string | null;
  maxDate?: string | null;
}

interface CustomRule {
  field: string;
  validator: (data: Record<string, unknown>) => ValidationResult;
}

interface ValidationRules {
  required?: string[];
  fields?: Record<string, FieldRule>;
  custom?: CustomRule[];
}

class FormValidator {
  static validateRequired(data: Record<string, unknown> | object, requiredFields: string[]): ValidationResult {
    const dataRecord = data as Record<string, unknown>;
    const errors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      const value = dataRecord[field];
      if (value === undefined || value === null || value === '' || 
          (typeof value === 'string' && !value.trim())) {
        errors[field] = 'Это поле обязательно для заполнения';
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateNumber(value: number | string | null | undefined, fieldName: string, options: NumberValidationOptions = {}): ValidationResult {
    const {
      min = null,
      max = null,
      allowZero = true,
      allowNegative = true,
      required = false
    } = options;

    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue === null || numValue === undefined || isNaN(numValue)) {
      return { isValid: false, error: `${fieldName} должно быть числом` };
    }

    if (!allowZero && numValue === 0) {
      return { isValid: false, error: `${fieldName} не может быть равно нулю` };
    }

    if (!allowNegative && numValue < 0) {
      return { isValid: false, error: `${fieldName} не может быть отрицательным` };
    }

    if (min !== null && numValue < min) {
      return { isValid: false, error: `${fieldName} должно быть не менее ${min}` };
    }

    if (max !== null && numValue > max) {
      return { isValid: false, error: `${fieldName} должно быть не более ${max}` };
    }

    return { isValid: true, error: null };
  }

  static validateString(value: string | number | null | undefined, fieldName: string, options: StringValidationOptions = {}): ValidationResult {
    const {
      minLength = null,
      maxLength = null,
      pattern = null,
      required = false
    } = options;

    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    const strValue = String(value).trim();

    if (required && strValue.length === 0) {
      return { isValid: false, error: `${fieldName} обязательно для заполнения` };
    }

    if (minLength !== null && strValue.length < minLength) {
      return { 
        isValid: false, 
        error: `${fieldName} должно содержать не менее ${minLength} символов` 
      };
    }

    if (maxLength !== null && strValue.length > maxLength) {
      return { 
        isValid: false, 
        error: `${fieldName} должно содержать не более ${maxLength} символов` 
      };
    }

    if (pattern && !pattern.test(strValue)) {
      return { isValid: false, error: `${fieldName} имеет неверный формат` };
    }

    return { isValid: true, error: null };
  }

  static validateDate(value: unknown, fieldName: string, options: DateValidationOptions = {}): ValidationResult {
    const { required = false, minDate = null, maxDate = null } = options;

    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    if (!value) {
      return { isValid: false, error: `${fieldName} обязательно для заполнения` };
    }

    const date = new Date(value as string);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: `${fieldName} имеет неверный формат даты` };
    }

    if (minDate) {
      const min = new Date(minDate);
      if (date < min) {
        return { isValid: false, error: `${fieldName} не может быть раньше ${minDate}` };
      }
    }

    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) {
        return { isValid: false, error: `${fieldName} не может быть позже ${maxDate}` };
      }
    }

    return { isValid: true, error: null };
  }

  static validatePhone(value: unknown, fieldName: string, options: { required?: boolean } = {}): ValidationResult {
    const { required = false } = options;

    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    if (!value) {
      return { isValid: false, error: `${fieldName} обязательно для заполнения` };
    }

    const digitsOnly = String(value).replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return { isValid: false, error: `${fieldName} должен содержать не менее 10 цифр` };
    }

    return { isValid: true, error: null };
  }

  static validateDateRange(startDate: string | null, endDate: string | null): ValidationResult {
    if (!startDate || !endDate) {
      return { isValid: true, error: null };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return { 
        isValid: false, 
        error: 'Дата окончания не может быть раньше даты начала' 
      };
    }

    return { isValid: true, error: null };
  }

  static validateForm(data: Record<string, unknown>, rules: ValidationRules): ValidationResult {
    const errors: Record<string, string> = {};

    if (rules.required) {
      const requiredResult = this.validateRequired(data, rules.required);
      Object.assign(errors, requiredResult.errors);
    }

    if (rules.fields) {
      Object.keys(rules.fields).forEach(fieldName => {
        if (errors[fieldName]) return;

        const fieldRules = rules.fields![fieldName];
        const value = data[fieldName];
        let result: ValidationResult | null = null;

        switch (fieldRules.type) {
          case 'number':
            result = this.validateNumber(value as number, fieldRules.label || fieldName, fieldRules);
            break;
          case 'string':
            result = this.validateString(value as string, fieldRules.label || fieldName, fieldRules);
            break;
          case 'date':
            result = this.validateDate(value, fieldRules.label || fieldName, fieldRules);
            break;
          case 'phone':
            result = this.validatePhone(value, fieldRules.label || fieldName, fieldRules);
            break;
        }

        if (result && !result.isValid && result.error) {
          errors[fieldName] = result.error;
        }
      });
    }

    if (rules.custom) {
      rules.custom.forEach(customRule => {
        const result = customRule.validator(data);
        if (!result.isValid && result.error) {
          errors[customRule.field] = result.error;
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default FormValidator;

