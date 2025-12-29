import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api';
import { useNotifications } from '../../components/NotificationSystem';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmployeeForm from '../EmployeeForm';
import EmployeeList from '../EmployeeList';

/**
 * Страница управления сотрудниками
 * Использует систему уведомлений и обработку ошибок
 */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const { execute: executeOperation, loading: operationLoading } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      showError('Ошибка загрузки сотрудников: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (employeeData) => {
    try {
      await executeOperation(
        () => createEmployee(employeeData),
        {
          successMessage: 'Сотрудник успешно добавлен',
          errorMessage: 'Ошибка создания сотрудника'
        }
      );
      await loadEmployees();
      setEditingEmployee(null);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, employeeData) => {
    try {
      await executeOperation(
        () => updateEmployee(id, employeeData),
        {
          successMessage: 'Сотрудник успешно обновлён',
          errorMessage: 'Ошибка обновления сотрудника'
        }
      );
      await loadEmployees();
      setEditingEmployee(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление сотрудника',
        message: 'Вы уверены, что хотите удалить этого сотрудника? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteEmployee(id),
        {
          successMessage: 'Сотрудник успешно удалён',
          errorMessage: 'Ошибка удаления сотрудника'
        }
      );
      await loadEmployees();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана
      }
    }
  };

  if (loading && employees.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка сотрудников..." />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">👷 Управление сотрудниками</h2>
        {operationLoading && <LoadingSpinner text="Выполнение операции..." />}
        <EmployeeForm 
          employee={editingEmployee}
          onSave={editingEmployee ? (data) => handleUpdate(editingEmployee.id, data) : handleAdd}
          onCancel={() => setEditingEmployee(null)}
          existingEmployees={employees.filter(e => !editingEmployee || e.id !== editingEmployee.id)}
        />
        <EmployeeList 
          employees={employees}
          onEdit={setEditingEmployee}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

