import React, { useState, useEffect } from 'react';
import { getMaterialLogs, createMaterialLog, updateMaterialLog, deleteMaterialLog, getProjects, getMaterials } from '../../api';
import { useNotifications } from '../../components/NotificationSystem';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import MaterialLogForm from '../MaterialLogForm';
import MaterialLogList from '../MaterialLogList';

/**
 * Страница учёта списания материалов на проекты
 * Использует систему уведомлений и обработку ошибок
 */
export default function MaterialLogPage() {
  const [materialLogs, setMaterialLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  const { execute: executeOperation, loading: operationLoading } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, projectsData, materialsData] = await Promise.all([
        getMaterialLogs(filters),
        getProjects(),
        getMaterials()
      ]);
      setMaterialLogs(logsData);
      setProjects(projectsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      showError('Ошибка загрузки данных: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (logData) => {
    try {
      await executeOperation(
        () => createMaterialLog(logData),
        {
          successMessage: 'Запись списания успешно добавлена',
          errorMessage: 'Ошибка создания записи списания'
        }
      );
      await loadData();
      setEditingLog(null);
    } catch (error) {
      throw error;
    }
  };

  const handleUpdate = async (id, logData) => {
    try {
      await executeOperation(
        () => updateMaterialLog(id, logData),
        {
          successMessage: 'Запись списания успешно обновлена',
          errorMessage: 'Ошибка обновления записи списания'
        }
      );
      await loadData();
      setEditingLog(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление записи',
        message: 'Вы уверены, что хотите удалить эту запись списания? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteMaterialLog(id),
        {
          successMessage: 'Запись списания успешно удалена',
          errorMessage: 'Ошибка удаления записи списания'
        }
      );
      await loadData();
    } catch (error) {
      if (error !== false) {
        // Ошибка уже обработана
      }
    }
  };

  if (loading && materialLogs.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка данных..." />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">📦 Учёт списания материалов</h2>
        
        {operationLoading && <LoadingSpinner text="Выполнение операции..." />}

        {/* Фильтры */}
        <div className="card card-body mb-4">
          <h5 className="mb-3">Фильтры</h5>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Проект</label>
              <select 
                className="form-select"
                value={filters.projectId || ''}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value || null })}
              >
                <option value="">Все проекты</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Материал</label>
              <select 
                className="form-select"
                value={filters.materialId || ''}
                onChange={(e) => setFilters({ ...filters, materialId: e.target.value || null })}
              >
                <option value="">Все материалы</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">С</label>
              <input 
                type="date"
                className="form-control"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">По</label>
              <input 
                type="date"
                className="form-control"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
              />
            </div>
          </div>
          <button 
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() => setFilters({})}
          >
            Сбросить фильтры
          </button>
        </div>

        <MaterialLogForm 
          log={editingLog}
          projects={projects}
          materials={materials}
          onSave={editingLog ? (data) => handleUpdate(editingLog.id, data) : handleAdd}
          onCancel={() => setEditingLog(null)}
        />
        <MaterialLogList 
          materialLogs={materialLogs}
          onEdit={setEditingLog}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

