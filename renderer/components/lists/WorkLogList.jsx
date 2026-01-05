import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Список записей учёта заработанных денег работниками
 */
export default function WorkLogList({ workLogs, onEdit, onDelete }) {

  if (workLogs.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет записей учёта. Добавьте первую запись выше.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark">
          <tr>
            <th>Дата</th>
            <th>Сотрудник</th>
            <th>Должность</th>
            <th>Проект</th>
            <th>Зарплата за день</th>
            <th>Примечание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {workLogs.map(log => (
            <tr key={log.id}>
              <td>{formatDate(log.date)}</td>
              <td><strong>{log.employee_name}</strong></td>
              <td>{log.employee_role || '-'}</td>
              <td>{log.project_name}</td>
              <td><strong>{formatCurrency(log.salary_per_day || log.salary || 0)}</strong></td>
              <td>{log.notes || '-'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => onEdit(log)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(log.id)}
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

