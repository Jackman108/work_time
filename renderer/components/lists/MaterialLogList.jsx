import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Список записей учёта списания материалов
 * @param {Array} materialLogs - Массив записей списания материалов
 * @param {Function} onEdit - Обработчик редактирования
 * @param {Function} onDelete - Обработчик удаления
 */
export default function MaterialLogList({ materialLogs, onEdit, onDelete }) {

  if (materialLogs.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет записей списания материалов. Добавьте первую запись выше.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark">
          <tr>
            <th>Дата</th>
            <th>Материал</th>
            <th>Единица</th>
            <th>Проект</th>
            <th>Количество</th>
            <th>Цена за единицу</th>
            <th>Общая стоимость</th>
            <th>Примечание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {materialLogs.map(log => (
            <tr key={log.id}>
              <td>{formatDate(log.date)}</td>
              <td><strong>{log.material_name}</strong></td>
              <td>{log.material_unit || 'шт'}</td>
              <td>{log.project_name}</td>
              <td>{log.amount || 0}</td>
              <td>{formatCurrency(log.material_price || 0)}</td>
              <td><strong>{formatCurrency(log.total_cost || 0)}</strong></td>
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

