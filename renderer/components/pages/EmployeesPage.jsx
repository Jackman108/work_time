import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api';
import EmployeeForm from '../EmployeeForm';
import EmployeeList from '../EmployeeList';

/**
 * Страница управления сотрудниками
 */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  const handleAdd = async (employeeData) => {
    try {
      await createEmployee(employeeData);
      await loadEmployees();
      setEditingEmployee(null);
    } catch (error) {
      console.error('Ошибка создания сотрудника:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, employeeData) => {
    try {
      await updateEmployee(id, employeeData);
      await loadEmployees();
      setEditingEmployee(null);
    } catch (error) {
      console.error('Ошибка обновления сотрудника:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await deleteEmployee(id);
        await loadEmployees();
      } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
        alert('Ошибка удаления сотрудника');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">👷 Управление сотрудниками</h2>
      <EmployeeForm 
        employee={editingEmployee}
        onSave={editingEmployee ? (data) => handleUpdate(editingEmployee.id, data) : handleAdd}
        onCancel={() => setEditingEmployee(null)}
      />
      <EmployeeList 
        employees={employees}
        onEdit={setEditingEmployee}
        onDelete={handleDelete}
      />
    </div>
  );
}

