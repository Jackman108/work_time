/**
 * Централизованная система валидации данных
 * Реализует единые правила валидации для всех сущностей
 * Следует принципу Single Responsibility и DRY
 * 
 * @module services/base/Validator
 */

const { ValidationError } = require('./ErrorHandler');

/**
 * Класс для валидации данных
 * Предоставляет методы для проверки различных типов данных
 */
class Validator {
  /**
   * Валидировать обязательные поля
   * @param {Object} data - Данные для валидации
   * @param {Array<string>} requiredFields - Список обязательных полей
   * @throws {ValidationError} Если обязательное поле отсутствует
   */
  static validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw new ValidationError(
        `Отсутствуют обязательные поля: ${missing.join(', ')}`,
        { missingFields: missing }
      );
    }
  }

  /**
   * Валидировать числовое значение
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля (для сообщения об ошибке)
   * @param {Object} options - Опции валидации
   * @param {number} options.min - Минимальное значение
   * @param {number} options.max - Максимальное значение
   * @param {boolean} options.allowZero - Разрешить ноль
   * @param {boolean} options.allowNegative - Разрешить отрицательные значения
   * @returns {number} Валидированное числовое значение
   * @throws {ValidationError} Если значение невалидно
   */
  static validateNumber(value, fieldName, options = {}) {
    const {
      min = null,
      max = null,
      allowZero = true,
      allowNegative = true
    } = options;

    // Преобразование строки в число, если необходимо
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      throw new ValidationError(`${fieldName} должно быть числом`);
    }

    if (!allowZero && numValue === 0) {
      throw new ValidationError(`${fieldName} не может быть равно нулю`);
    }

    if (!allowNegative && numValue < 0) {
      throw new ValidationError(`${fieldName} не может быть отрицательным`);
    }

    if (min !== null && numValue < min) {
      throw new ValidationError(`${fieldName} должно быть не менее ${min}`);
    }

    if (max !== null && numValue > max) {
      throw new ValidationError(`${fieldName} должно быть не более ${max}`);
    }

    return numValue;
  }

  /**
   * Валидировать строку
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @param {Object} options - Опции валидации
   * @param {number} options.minLength - Минимальная длина
   * @param {number} options.maxLength - Максимальная длина
   * @param {RegExp} options.pattern - Регулярное выражение для проверки
   * @returns {string} Валидированная строка
   * @throws {ValidationError} Если значение невалидно
   */
  static validateString(value, fieldName, options = {}) {
    const {
      minLength = null,
      maxLength = null,
      pattern = null
    } = options;

    if (value === null || value === undefined) {
      return null;
    }

    const strValue = String(value).trim();

    if (minLength !== null && strValue.length < minLength) {
      throw new ValidationError(
        `${fieldName} должно содержать не менее ${minLength} символов`
      );
    }

    if (maxLength !== null && strValue.length > maxLength) {
      throw new ValidationError(
        `${fieldName} должно содержать не более ${maxLength} символов`
      );
    }

    if (pattern && !pattern.test(strValue)) {
      throw new ValidationError(`${fieldName} имеет неверный формат`);
    }

    return strValue || null;
  }

  /**
   * Валидировать дату
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @returns {string} Валидированная дата в формате YYYY-MM-DD
   * @throws {ValidationError} Если значение невалидно
   */
  static validateDate(value, fieldName) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${fieldName} имеет неверный формат даты`);
    }

    // Возвращаем дату в формате YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  /**
   * Валидировать ID (должен быть положительным целым числом)
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @returns {number} Валидированный ID
   * @throws {ValidationError} Если значение невалидно
   */
  static validateId(value, fieldName = 'ID') {
    return this.validateNumber(value, fieldName, {
      min: 1,
      allowZero: false,
      allowNegative: false
    });
  }

  /**
   * Валидировать email (базовая проверка)
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @returns {string} Валидированный email
   * @throws {ValidationError} Если значение невалидно
   */
  static validateEmail(value, fieldName = 'Email') {
    if (!value) {
      return null;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateString(value, fieldName, {
      pattern: emailPattern,
      minLength: 5,
      maxLength: 255
    });
  }

  /**
   * Валидировать телефон (базовая проверка)
   * @param {*} value - Значение для проверки
   * @param {string} fieldName - Имя поля
   * @returns {string} Валидированный телефон
   * @throws {ValidationError} Если значение невалидно
   */
  static validatePhone(value, fieldName = 'Телефон') {
    if (!value) {
      return null;
    }

    // Удаляем все нецифровые символы для проверки
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      throw new ValidationError(`${fieldName} должен содержать не менее 10 цифр`);
    }

    return value.trim();
  }
}

module.exports = Validator;

