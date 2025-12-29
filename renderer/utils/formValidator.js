/**
 * Утилита для валидации форм на клиенте
 * Предоставляет методы для проверки различных типов данных
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/utils/formValidator
 */

/**
 * Класс для валидации данных форм
 */
class FormValidator {
  /**
   * Валидировать обязательные поля
   * @param {Object} data - Данные для валидации
   * @param {Array<string>} requiredFields - Список обязательных полей
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  static validateRequired(data, requiredFields) {
    const errors = {};
    
    requiredFields.forEach(field => {
      const value = data[field];
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

  /**
   * Валидировать число
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @param {Object} options - Опции валидации
   * @returns {Object} { isValid: boolean, error: string }
   */
  static validateNumber(value, fieldName, options = {}) {
    const {
      min = null,
      max = null,
      allowZero = true,
      allowNegative = true,
      required = false
    } = options;

    // Если поле необязательное и пустое
    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
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

  /**
   * Валидировать строку
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @param {Object} options - Опции валидации
   * @returns {Object} { isValid: boolean, error: string }
   */
  static validateString(value, fieldName, options = {}) {
    const {
      minLength = null,
      maxLength = null,
      pattern = null,
      required = false
    } = options;

    // Если поле необязательное и пустое
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

  /**
   * Валидировать дату
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @param {Object} options - Опции валидации
   * @returns {Object} { isValid: boolean, error: string }
   */
  static validateDate(value, fieldName, options = {}) {
    const { required = false, minDate = null, maxDate = null } = options;

    // Если поле необязательное и пустое
    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    if (!value) {
      return { isValid: false, error: `${fieldName} обязательно для заполнения` };
    }

    const date = new Date(value);
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

  /**
   * Валидировать телефон
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @param {Object} options - Опции валидации
   * @returns {Object} { isValid: boolean, error: string }
   */
  static validatePhone(value, fieldName, options = {}) {
    const { required = false } = options;

    if (!required && (value === '' || value === null || value === undefined)) {
      return { isValid: true, error: null };
    }

    if (!value) {
      return { isValid: false, error: `${fieldName} обязательно для заполнения` };
    }

    // Удаляем все нецифровые символы для проверки
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return { isValid: false, error: `${fieldName} должен содержать не менее 10 цифр` };
    }

    return { isValid: true, error: null };
  }

  /**
   * Валидировать логику дат (дата окончания >= дата начала)
   * @param {string} startDate - Дата начала
   * @param {string} endDate - Дата окончания
   * @returns {Object} { isValid: boolean, error: string }
   */
  static validateDateRange(startDate, endDate) {
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

  /**
   * Валидировать форму по правилам
   * @param {Object} data - Данные формы
   * @param {Object} rules - Правила валидации
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  static validateForm(data, rules) {
    const errors = {};

    // Валидация обязательных полей
    if (rules.required) {
      const requiredResult = this.validateRequired(data, rules.required);
      Object.assign(errors, requiredResult.errors);
    }

    // Валидация полей по типам
    if (rules.fields) {
      Object.keys(rules.fields).forEach(fieldName => {
        if (errors[fieldName]) return; // Уже есть ошибка из required

        const fieldRules = rules.fields[fieldName];
        const value = data[fieldName];
        let result = null;

        switch (fieldRules.type) {
          case 'number':
            result = this.validateNumber(value, fieldRules.label || fieldName, fieldRules);
            break;
          case 'string':
            result = this.validateString(value, fieldRules.label || fieldName, fieldRules);
            break;
          case 'date':
            result = this.validateDate(value, fieldRules.label || fieldName, fieldRules);
            break;
          case 'phone':
            result = this.validatePhone(value, fieldRules.label || fieldName, fieldRules);
            break;
        }

        if (result && !result.isValid) {
          errors[fieldName] = result.error;
        }
      });
    }

    // Валидация логики (например, дата окончания >= дата начала)
    if (rules.custom) {
      rules.custom.forEach(customRule => {
        const result = customRule.validator(data);
        if (!result.isValid) {
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

