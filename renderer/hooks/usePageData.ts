/**
 * Хук для управления данными страницы с CRUD операциями
 */

import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import { useNotifications, useConfirmDialog, LoadingSpinner } from '@renderer/components/common';
import { useAsyncOperation } from './useAsyncOperation';
import type { UsePageDataConfig, UsePageDataResult } from '@renderer/types';

export function usePageData<T extends { id: number }>(config: UsePageDataConfig<T>): UsePageDataResult<T> {
    const {
        loadData: loadDataFn,
        createItem,
        updateItem,
        deleteItem,
        messages = {},
        dependencies = []
    } = config;

    const [items, setItems] = useState<T[]>([]);
    const [editingItem, setEditingItem] = useState<T | null>(null);
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

    const loadData = useCallback(async () => {
        if (!loadDataFn) return;

        setLoading(true);
        try {
            const data = await loadDataFn();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const errorMessage = messages.loadError || 'Ошибка загрузки данных';
            showError(`${errorMessage}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [loadDataFn, messages.loadError, showError]);

    const reloadData = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const handleAdd = useCallback(async (itemData: Partial<T>) => {
        if (!createItem) {
            throw new Error('createItem function is not provided');
        }

        await executeOperation(
            () => createItem(itemData),
            {
                successMessage: messages.createSuccess || 'Элемент успешно создан',
                errorMessage: messages.createError || 'Ошибка создания элемента'
            }
        );
        await loadData();
        setEditingItem(null);
    }, [createItem, executeOperation, loadData, messages.createSuccess, messages.createError]);

    const handleUpdate = useCallback(async (id: number, itemData: Partial<T>) => {
        if (!updateItem) {
            throw new Error('updateItem function is not provided');
        }

        await executeOperation(
            () => updateItem(id, itemData),
            {
                successMessage: messages.updateSuccess || 'Элемент успешно обновлён',
                errorMessage: messages.updateError || 'Ошибка обновления элемента'
            }
        );
        await loadData();
        setEditingItem(null);
    }, [updateItem, executeOperation, loadData, messages.updateSuccess, messages.updateError]);

    const handleDelete = useCallback(async (id: number) => {
        if (!deleteItem) {
            throw new Error('deleteItem function is not provided');
        }

        try {
            await showConfirm({
                title: messages.deleteConfirmTitle || 'Удаление',
                message: messages.deleteConfirmMessage || 'Вы уверены, что хотите удалить этот элемент?',
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
        } catch {
            // Пользователь отменил удаление
        }
    }, [deleteItem, showConfirm, executeOperation, loadData, messages]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

interface PageLoadingSpinnerProps {
    loading: boolean;
    itemsCount?: number;
    text?: string;
}

export function PageLoadingSpinner({
    loading,
    itemsCount = 0,
    text = 'Загрузка данных...'
}: PageLoadingSpinnerProps): ReactElement | null {
    if (loading && itemsCount === 0) {
        return React.createElement(LoadingSpinner, { fullScreen: true, text, size: 'lg' });
    }
    return null;
}

