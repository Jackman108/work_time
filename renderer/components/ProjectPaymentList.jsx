import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Список записей поступлений денег на проекты
 */
export default function ProjectPaymentList({ payments, onEdit, onDelete }) {

  if (payments.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет записей поступлений денег. Добавьте первую запись выше.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark">
          <tr>
            <th>Дата</th>
            <th>Проект</th>
            <th>Адрес</th>
            <th>Сумма</th>
            <th>Примечание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>{formatDate(payment.date)}</td>
              <td><strong>{payment.project_name}</strong></td>
              <td>{payment.project_address || '-'}</td>
              <td><strong>{formatCurrency(payment.amount)}</strong></td>
              <td>{payment.notes || '-'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => onEdit(payment)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(payment.id)}
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

