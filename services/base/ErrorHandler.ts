/**
 * Централизованная обработка ошибок для IPC обработчиков
 * Обеспечивает единообразный формат ответов и структурированное логирование ошибок
 * Следует принципам Single Responsibility и Error Handling
 * 
 * @module services/base/ErrorHandler
 */

/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Структурированная запись лога
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  channel?: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: string;
  channel: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type IpcResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Класс для обработки ошибок и логирования
 * Реализует структурированное логирование для лучшей отладки
 */
class ErrorHandler {
  /**
   * Флаг для включения детального логирования (только в dev режиме)
   */
  private static readonly isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  /**
   * Записать структурированный лог
   */
  private static log(entry: LogEntry): void {
    const logMessage = this.isDev
      ? `[${entry.level}] ${entry.timestamp} ${entry.channel ? `[${entry.channel}]` : ''} ${entry.message}`
      : `[${entry.level}] ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDev) {
          console.debug(logMessage, entry.context || '');
        }
        break;
      case LogLevel.INFO:
        console.log(logMessage, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.error || entry.context || '');
        if (entry.error?.stack && this.isDev) {
          console.error('Stack trace:', entry.error.stack);
        }
        break;
    }
  }

  /**
   * Обработать ошибку и вернуть стандартизированный ответ
   * @param {Error | string | unknown} error - Объект ошибки
   * @param {string} [channel] - Канал IPC, где произошла ошибка
   * @param {Record<string, unknown>} [context] - Дополнительный контекст для логирования
   * @returns {ErrorResponse} Объект с полями success: false и error
   */
  static handle(
    error: Error | string | unknown,
    channel: string = 'unknown',
    context?: Record<string, unknown>
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    let errorMessage = 'An error occurred';
    let errorDetails: { name: string; message: string; stack?: string } | undefined;

    // Определяем сообщение об ошибке и детали
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    }

    // Логируем структурированную ошибку
    this.log({
      timestamp,
      level: LogLevel.ERROR,
      channel,
      message: `Error: ${errorMessage}`,
      error: errorDetails,
      context
    });

    // В production не возвращаем детали ошибки для безопасности
    const safeErrorMessage = this.isDev
      ? errorMessage
      : 'An internal error occurred. Please contact the administrator.';

    // Возвращаем стандартизированный формат ошибки
    return {
      success: false,
      error: safeErrorMessage,
      channel: channel
    };
  }

  /**
   * Вернуть успешный ответ в стандартизированном формате
   * @param {T} data - Данные для возврата
   * @param {string} [channel] - Канал IPC (для логирования)
   * @returns {SuccessResponse<T>} Объект с полями success: true и data
   */
  static success<T = any>(data: T, channel?: string): SuccessResponse<T> {
    // Логируем успешные операции только в dev режиме
    if (this.isDev && channel) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        channel,
        message: 'Operation completed successfully'
      });
    }

    return {
      success: true,
      data: data
    };
  }

  /**
   * Логировать информационное сообщение
   */
  static info(message: string, channel?: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      channel,
      message,
      context
    });
  }

  /**
   * Логировать предупреждение
   */
  static warn(message: string, channel?: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      channel,
      message,
      context
    });
  }
}

export { ErrorHandler };


