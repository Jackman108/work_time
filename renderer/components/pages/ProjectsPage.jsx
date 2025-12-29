import React, { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject, getProjectStats } from '../../api';
import { useNotifications } from '../../components/NotificationSystem';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProjectForm from '../ProjectForm';
import ProjectList from '../ProjectList';

/**
 * Страница управления строительными объектами
 * Включает форму добавления/редактирования и список всех объектов
 * Использует систему уведомлений и обработку ошибок
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const { showConfirm, confirmDialog } = useConfirmDialog();

  // Хук для обработки операций с уведомлениями
  const { execute: executeOperation, loading: operationLoading } = useAsyncOperation({
    showSuccessNotification: true,
    showErrorNotification: true
  });

  // Загружаем проекты при монтировании компонента
  useEffect(() => {
    loadProjects();
  }, []);

  // Загружаем список проектов
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
      // Загружаем статистику для каждого проекта
      const statsPromises = data.map(p => getProjectStats(p.id));
      const statsData = await Promise.all(statsPromises);
      const statsMap = {};
      data.forEach((p, i) => {
        statsMap[p.id] = statsData[i];
      });
      setStats(statsMap);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      showError('Ошибка загрузки проектов: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  // Обработчик добавления проекта
  const handleAdd = async (projectData) => {
    try {
      await executeOperation(
        () => createProject(projectData),
        {
          successMessage: 'Проект успешно создан',
          errorMessage: 'Ошибка создания проекта'
        }
      );
      await loadProjects();
      setEditingProject(null);
    } catch (error) {
      // Ошибка уже обработана в executeOperation
      throw error;
    }
  };

  // Обработчик обновления проекта
  const handleUpdate = async (id, projectData) => {
    try {
      await executeOperation(
        () => updateProject(id, projectData),
        {
          successMessage: 'Проект успешно обновлён',
          errorMessage: 'Ошибка обновления проекта'
        }
      );
      await loadProjects();
      setEditingProject(null);
    } catch (error) {
      throw error;
    }
  };

  // Обработчик удаления проекта
  const handleDelete = async (id) => {
    try {
      await showConfirm({
        title: 'Удаление проекта',
        message: 'Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'danger'
      });

      await executeOperation(
        () => deleteProject(id),
        {
          successMessage: 'Проект успешно удалён',
          errorMessage: 'Ошибка удаления проекта'
        }
      );
      await loadProjects();
    } catch (error) {
      // Пользователь отменил операцию или произошла ошибка
      if (error !== false) {
        // Ошибка уже обработана в executeOperation
      }
    }
  };

  if (loading && projects.length === 0) {
    return <LoadingSpinner fullScreen text="Загрузка проектов..." />;
  }

  return (
    <>
      {confirmDialog}
      <div>
        <h2 className="mb-4">🏗️ Управление строительными объектами</h2>
        {operationLoading && <LoadingSpinner text="Выполнение операции..." />}
        <ProjectForm 
          project={editingProject}
          onSave={editingProject ? (data) => handleUpdate(editingProject.id, data) : handleAdd}
          onCancel={() => setEditingProject(null)}
          existingProjects={projects.filter(p => !editingProject || p.id !== editingProject.id)}
        />
        <ProjectList 
          projects={projects}
          stats={stats}
          onEdit={setEditingProject}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

