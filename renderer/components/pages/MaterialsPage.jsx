import React, { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api';
import { useNotifications, useConfirmDialog, LoadingSpinner } from '../common';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { MaterialForm } from '../forms';
import { MaterialList } from '../lists';

/**
 * Страница управления материалами
 * Использует систему уведомлений и обработку ошибок
 */
export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const { execute: executeOperation, loading: operationLoading } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      showError('Ошибка загрузки материалов: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (materialData) => {
    try {
      await executeOperation(
        () => createMaterial(materialData),
        {
          successMessage: 'Материал успешно добавлен',
          errorMessage: 'Ошибка создания материала'
        }
      );
      await loadMaterials();
      setEditingMaterial(null);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, materialData) => {
    try {
      await executeOperation(
        () => updateMaterial(id, materialData),
        {
          successMessage: 'Материал успешно обновлён',
          errorMessage: 'Ошибка обновления материала'
        }
      );
      await loadMaterials();
      setEditingMaterial(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление материала',
        message: 'Вы уверены, что хотите удалить этот материал? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteMaterial(id),
        {
          successMessage: 'Материал успешно удалён',
          errorMessage: (error) => {
            // Используем сообщение об ошибке от сервера, если оно есть
            return error?.message || 'Ошибка удаления материала';
          }
        }
      );
      await loadMaterials();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана в executeOperation
        // Но можем показать дополнительное сообщение, если нужно
        if (error?.message && !error.message.includes('уже обработана')) {
          showError(error.message);
        }
      }
    }
  };

  if (loading && materials.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка материалов..." />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">📦 Управление материалами</h2>
        {operationLoading && <LoadingSpinner text="Выполнение операции..." />}
        <MaterialForm 
          material={editingMaterial}
          onSave={editingMaterial ? (data) => handleUpdate(editingMaterial.id, data) : handleAdd}
          onCancel={() => setEditingMaterial(null)}
          existingMaterials={materials.filter(m => !editingMaterial || m.id !== editingMaterial.id)}
        />
        <MaterialList 
          materials={materials}
          onEdit={setEditingMaterial}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

