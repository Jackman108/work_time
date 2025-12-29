import React, { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject, getProjectStats } from '../../api';
import ProjectForm from '../ProjectForm';
import ProjectList from '../ProjectList';

/**
 * Страница управления строительными объектами
 * Включает форму добавления/редактирования и список всех объектов
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [stats, setStats] = useState({});

  // Загружаем проекты при монтировании компонента
  useEffect(() => {
    loadProjects();
  }, []);

  // Загружаем список проектов
  const loadProjects = async () => {
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
    }
  };

  // Обработчик добавления проекта
  const handleAdd = async (projectData) => {
    try {
      await createProject(projectData);
      await loadProjects();
      setEditingProject(null);
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      throw error;
    }
  };

  // Обработчик обновления проекта
  const handleUpdate = async (id, projectData) => {
    try {
      await updateProject(id, projectData);
      await loadProjects();
      setEditingProject(null);
    } catch (error) {
      console.error('Ошибка обновления проекта:', error);
      throw error;
    }
  };

  // Обработчик удаления проекта
  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
      try {
        await deleteProject(id);
        await loadProjects();
      } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        alert('Ошибка удаления проекта');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">🏗️ Управление строительными объектами</h2>
      <ProjectForm 
        project={editingProject}
        onSave={editingProject ? (data) => handleUpdate(editingProject.id, data) : handleAdd}
        onCancel={() => setEditingProject(null)}
      />
      <ProjectList 
        projects={projects}
        stats={stats}
        onEdit={setEditingProject}
        onDelete={handleDelete}
      />
    </div>
  );
}

