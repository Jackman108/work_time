/**
 * Базовый хук для управления данными страницы
 * Устраняет дублирование кода в страницах
 * Следует принципам DRY и Single Responsibility
 * 
 * @module renderer/hooks/usePageData
 * @see {@link types/index.d.ts} для определений типов
 */

import { useState, useEffect, useCallback } from 'react';
import { useNotifications, useConfirmDialog, LoadingSpinner } from '../components/common';
import { useAsyncOperation } from './useAsyncOperation';

/**
 * Хук для управления данными страницы с CRUD операциями
 * 
 * @param {Types.UsePageDataConfig} config - Конфигурация хука
 * @returns {Types.UsePageDataReturn} Результат хука
 */
export function usePageData(config) {
  const {
    loadData: loadDataFn,
    createItem,
    updateItem,
    deleteItem,
    messages = {},
    dependencies = []
  } = config;

  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const {
    execute: executeOperation,
    loading: operationLoading
  } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  /**
   * Загрузить данные
   */
  const loadData = useCallback(async () => {
    if (!loadDataFn) return;

    setLoading(true);
    try {
      const data = await loadDataFn();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      const errorMessage = messages.loadError || 'Ошибка загрузки данных';
      showError(`${errorMessage}: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  }, [loadDataFn, messages.loadError, showError]);

  /**
   * Перезагрузить данные
   */
  const reloadData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Обработчик добавления элемента
   */
  const handleAdd = useCallback(async (itemData) => {
    if (!createItem) {
      throw new Error('createItem function is not provided');
    }

    try {
      await executeOperation(
        () => createItem(itemData),
        {
          successMessage: messages.createSuccess || 'Элемент успешно создан',
          errorMessage: messages.createError || 'Ошибка создания элемента'
        }
      );
      await loadData();
      setEditingItem(null);
    } catch (error) {
      throw error;
    }
  }, [createItem, executeOperation, loadData, messages.createSuccess, messages.createError]);

  /**
   * Обработчик обновления элемента
   */
  const handleUpdate = useCallback(async (id, itemData) => {
    if (!updateItem) {
      throw new Error('updateItem function is not provided');
    }

    try {
      await executeOperation(
        () => updateItem(id, itemData),
        {
          successMessage: messages.updateSuccess || 'Элемент успешно обновлён',
          errorMessage: messages.updateError || 'Ошибка обновления элемента'
        }
      );
      await loadData();
      setEditingItem(null);
    } catch (error) {
      throw error;
    }
  }, [updateItem, executeOperation, loadData, messages.updateSuccess, messages.updateError]);

  /**
   * Обработчик удаления элемента
   */
  const handleDelete = useCallback(async (id) => {
    if (!deleteItem) {
      throw new Error('deleteItem function is not provided');
    }

    try {
      await showConfirm({
        title: messages.deleteConfirmTitle || 'Удаление',
        message: messages.deleteConfirmMessage || 'Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteItem(id),
        {
          successMessage: messages.deleteSuccess || 'Элемент успешно удалён',
          errorMessage: messages.deleteError || 'Ошибка удаления элемента'
        }
      );
      await loadData();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана в executeOperation
      }
    }
  }, [deleteItem, showConfirm, executeOperation, loadData, messages]);

  // Загружаем данные при монтировании и при изменении зависимостей
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return {
    items,
    loading,
    editingItem,
    setEditingItem,
    handleAdd,
    handleUpdate,
    handleDelete,
    reloadData,
    confirmDialog,
    operationLoading
  };
}

/**
 * Компонент индикатора загрузки для использования с usePageData
 * @param {Object} props - Пропсы компонента
 * @param {boolean} props.loading - Состояние загрузки
 * @param {number} [props.itemsCount=0] - Количество элементов
 * @param {string} [props.text='Загрузка данных...'] - Текст загрузки
 * @returns {import('react').ReactElement|null} Компонент спиннера или null
 */
export function PageLoadingSpinner({ loading, itemsCount = 0, text = 'Загрузка данных...' }) {
  if (loading && itemsCount === 0) {
    return <LoadingSpinner fullScreen={true} text={text} size="lg" className="" />;
  }
  return null;
}

