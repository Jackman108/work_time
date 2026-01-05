/**
 * Хук для обработки асинхронных операций с загрузкой и ошибками
 * Реализует единый подход к обработке async операций
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/hooks/useAsyncOperation
 * @see {@link types/index.d.ts} для определений типов
 */

import { useState, useCallback } from 'react';
import { useNotifications } from '../components/common';

/**
 * Хук для обработки асинхронных операций
 * Автоматически управляет состоянием загрузки и ошибок
 * Показывает уведомления об успехе/ошибке
 * 
 * @param {Types.UseAsyncOperationOptions} [options={}] - Опции хука
 * @returns {Types.UseAsyncOperationReturn} Результат хука
 */
export function useAsyncOperation(options = {}) {
  const {
    onSuccess = null,
    onError = null,
    showSuccessNotification = true,
    showErrorNotification = true,
    successMessage = 'Операция выполнена успешно',
    errorMessage = 'Произошла ошибка при выполнении операции'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotifications();

  /**
   * Выполнить асинхронную операцию
   * @param {Function} asyncFn - Асинхронная функция для выполнения
   * @param {Object} [operationOptions={}] - Опции для конкретной операции
   * @param {boolean} [operationOptions.showSuccessNotification] - Показывать уведомление об успехе
   * @param {boolean} [operationOptions.showErrorNotification] - Показывать уведомление об ошибке
   * @param {string|Function} [operationOptions.successMessage] - Сообщение об успехе или функция для получения сообщения
   * @param {string|Function} [operationOptions.errorMessage] - Сообщение об ошибке или функция для получения сообщения
   * @returns {Promise<*>} Результат выполнения
   */
  const execute = useCallback(async (asyncFn, operationOptions = {}) => {
    if (!asyncFn || typeof asyncFn !== 'function') {
      throw new Error('asyncFn must be a function');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      
      // Вызываем обработчик успеха, если он есть
      if (onSuccess) {
        onSuccess(result);
      }

      // Показываем уведомление об успехе
      const shouldShowSuccess = operationOptions.showSuccessNotification !== undefined 
        ? operationOptions.showSuccessNotification 
        : showSuccessNotification;
      
      if (shouldShowSuccess) {
        const message = operationOptions.successMessage || successMessage;
        showSuccess(message);
      }

      return result;
    } catch (err) {
      // Определяем сообщение об ошибке
      let errorMessageToShow;
      if (typeof operationOptions.errorMessage === 'function') {
        errorMessageToShow = operationOptions.errorMessage(err) || err.message || errorMessage;
      } else {
        errorMessageToShow = err.message || operationOptions.errorMessage || errorMessage;
      }
      
      setError(err);

      // Вызываем обработчик ошибки, если он есть
      if (onError) {
        onError(err);
      } else {
        // Показываем уведомление об ошибке
        const shouldShowError = operationOptions.showErrorNotification !== undefined 
          ? operationOptions.showErrorNotification 
          : showErrorNotification;
        
        if (shouldShowError) {
          showError(errorMessageToShow);
        }
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError, showSuccessNotification, showErrorNotification, successMessage, errorMessage, showSuccess, showError]);

  return {
    execute,
    loading,
    error
  };
}

