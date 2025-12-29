/**
 * Централизованная система обработки ошибок
 * Реализует единый подход к обработке и логированию ошибок
 * Следует принципу Single Responsibility
 * 
 * @module services/base/ErrorHandler
 */

/**
 * Класс для обработки ошибок приложения
 * Предоставляет структурированную обработку различных типов ошибок
 */
class ErrorHandler {
  /**
   * Обработать ошибку и вернуть структурированный ответ
   * @param {Error} error - Объект ошибки
   * @param {string} context - Контекст, в котором произошла ошибка
   * @returns {Object} Структурированная информация об ошибке
   */
  static handle(error, context = 'Unknown') {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    // Логирование ошибки в консоль (только в режиме разработки)
    if (isDev) {
      console.error(`[ErrorHandler] ${context}:`, error);
    }

    // Определение типа ошибки
    let statusCode = 500;
    let message = 'Внутренняя ошибка сервера';
    let details = null;

    // Обработка различных типов ошибок
    if (error instanceof ValidationError) {
      statusCode = 400;
      message = error.message;
      details = error.details;
    } else if (error instanceof NotFoundError) {
      statusCode = 404;
      message = error.message;
    } else if (error instanceof DatabaseError) {
      statusCode = 500;
      message = 'Ошибка базы данных';
      details = isDev ? error.message : null;
    } else if (error.message) {
      message = error.message;
      details = isDev ? error.stack : null;
    }

    return {
      success: false,
      error: {
        message,
        code: statusCode,
        context,
        ...(details && { details })
      }
    };
  }

  /**
   * Обернуть асинхронную функцию для автоматической обработки ошибок
   * @param {Function} fn - Асинхронная функция
   * @param {string} context - Контекст выполнения
   * @returns {Function} Обёрнутая функция
   */
  static wrap(fn, context = 'Unknown') {
    return async (...args) => {
      try {
        const result = await fn(...args);
        return { success: true, data: result };
      } catch (error) {
        return this.handle(error, context);
      }
    };
  }

  /**
   * Создать успешный ответ
   * @param {*} data - Данные для возврата
   * @returns {Object} Структурированный успешный ответ
   */
  static success(data) {
    return {
      success: true,
      data
    };
  }
}

/**
 * Класс ошибки валидации
 * Используется для ошибок, связанных с некорректными входными данными
 */
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Класс ошибки "не найдено"
 * Используется когда запрашиваемый ресурс не существует
 */
class NotFoundError extends Error {
  constructor(message = 'Ресурс не найден') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Класс ошибки базы данных
 * Используется для ошибок, связанных с операциями БД
 */
class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

module.exports = {
  ErrorHandler,
  ValidationError,
  NotFoundError,
  DatabaseError
};

