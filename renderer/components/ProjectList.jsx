import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Список всех строительных объектов с возможностью редактирования и удаления
 * @param {Array} projects - Массив проектов
 * @param {Object} stats - Статистика по проектам (затраты)
 * @param {Function} onEdit - Обработчик редактирования
 * @param {Function} onDelete - Обработчик удаления
 */
export default function ProjectList({ projects, stats = {}, onEdit, onDelete }) {

  if (projects.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">Нет добавленных объектов. Добавьте первый объект выше.</p>
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
            <th>Адрес</th>
            <th>Сроки</th>
            <th>Бюджет</th>
            <th>Затраты</th>
            <th>Остаток</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => {
            const projectStats = stats[project.id] || { totalCosts: 0 };
            const remaining = (project.budget || 0) - projectStats.totalCosts;
            return (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td><strong>{project.name}</strong></td>
                <td>{project.address || '-'}</td>
                <td>
                  {formatDate(project.date_start)} — {formatDate(project.date_end)}
                </td>
                <td>{formatCurrency(project.budget)}</td>
                <td>{formatCurrency(projectStats.totalCosts)}</td>
                <td className={remaining < 0 ? 'text-danger' : ''}>
                  {formatCurrency(remaining)}
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => onEdit(project)}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(project.id)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

