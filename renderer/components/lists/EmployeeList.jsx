import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Список всех сотрудников
 */
export default function EmployeeList({ employees, onEdit, onDelete }) {

  if (employees.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет добавленных сотрудников. Добавьте первого сотрудника выше.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>ФИО</th>
            <th>Должность</th>
            <th>Ставка/час</th>
            <th>Телефон</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td><strong>{employee.name}</strong></td>
              <td>{employee.role || '-'}</td>
              <td>{formatCurrency(employee.wage_per_hour)}</td>
              <td>{employee.phone || '-'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => onEdit(employee)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(employee.id)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

