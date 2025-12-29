import React from 'react';
import { formatCurrency } from '../utils/formatters';

/**
 * Список всех материалов
 */
export default function MaterialList({ materials, onEdit, onDelete }) {

  if (materials.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет добавленных материалов. Добавьте первый материал выше.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-striped align-middle">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Название</th>
            <th>Единица измерения</th>
            <th>Цена за единицу</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(material => (
            <tr key={material.id}>
              <td>{material.id}</td>
              <td><strong>{material.name}</strong></td>
              <td>{material.unit}</td>
              <td>{formatCurrency(material.price_per_unit)}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => onEdit(material)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(material.id)}
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

