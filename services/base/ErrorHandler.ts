/**
 * Централизованная обработка ошибок для IPC обработчиков
 * Обеспечивает единообразный формат ответов и логирование ошибок
 * Следует принципам Single Responsibility и Error Handling
 * 
 * @module services/base/ErrorHandler
 */

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

class ErrorHandler {
  /**
   * Обработать ошибку и вернуть стандартизированный ответ
   * @param {Error | string | unknown} error - Объект ошибки
   * @param {string} [channel] - Канал IPC, где произошла ошибка
   * @returns {ErrorResponse} Объект с полями success: false и error
   */
  static handle(error: Error | string | unknown, channel: string = 'unknown'): ErrorResponse {
    // Логируем ошибку для отладки
    console.error(`[ErrorHandler] Ошибка в канале ${channel}:`, error);
    
    // Определяем сообщение об ошибке
    let errorMessage = 'Произошла ошибка';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    }
    
    // Возвращаем стандартизированный формат ошибки
    return {
      success: false,
      error: errorMessage,
      channel: channel
    };
  }

  /**
   * Вернуть успешный ответ в стандартизированном формате
   * @param {T} data - Данные для возврата
   * @returns {SuccessResponse<T>} Объект с полями success: true и data
   */
  static success<T = any>(data: T): SuccessResponse<T> {
    return {
      success: true,
      data: data
    };
  }
}

export { ErrorHandler };


