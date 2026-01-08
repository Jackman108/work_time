/**
 * Хук для обработки асинхронных операций с загрузкой и ошибками
 */

import { useState, useCallback } from 'react';
import { useNotifications } from '../components/common';

interface UseAsyncOperationOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ExecuteOptions {
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  errorMessage?: string | ((error: Error) => string);
}

interface UseAsyncOperationReturn {
  execute: <T>(asyncFn: () => Promise<T>, operationOptions?: ExecuteOptions) => Promise<T>;
  loading: boolean;
  error: Error | null;
}

export function useAsyncOperation(options: UseAsyncOperationOptions = {}): UseAsyncOperationReturn {
  const {
    onSuccess = null,
    onError = null,
    showSuccessNotification = true,
    showErrorNotification = true,
    successMessage = 'Операция выполнена успешно',
    errorMessage = 'Произошла ошибка при выполнении операции'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotifications();

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>, operationOptions: ExecuteOptions = {}): Promise<T> => {
    if (!asyncFn || typeof asyncFn !== 'function') {
      throw new Error('asyncFn must be a function');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }

      const shouldShowSuccess = operationOptions.showSuccessNotification !== undefined 
        ? operationOptions.showSuccessNotification 
        : showSuccessNotification;
      
      if (shouldShowSuccess) {
        const message = operationOptions.successMessage || successMessage;
        showSuccess(message);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      let errorMessageToShow: string;
      if (typeof operationOptions.errorMessage === 'function') {
        errorMessageToShow = operationOptions.errorMessage(error) || error.message || errorMessage;
      } else {
        errorMessageToShow = error.message || operationOptions.errorMessage || errorMessage;
      }
      
      setError(error);

      if (onError) {
        onError(error);
      } else {
        const shouldShowError = operationOptions.showErrorNotification !== undefined 
          ? operationOptions.showErrorNotification 
          : showErrorNotification;
        
        if (shouldShowError) {
          showError(errorMessageToShow);
        }
      }

      throw error;
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


