import React, { useState, useEffect } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api';
import MaterialForm from '../MaterialForm';
import MaterialList from '../MaterialList';

/**
 * Страница управления материалами
 */
export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const handleAdd = async (materialData) => {
    try {
      await createMaterial(materialData);
      await loadMaterials();
      setEditingMaterial(null);
    } catch (error) {
      console.error('Ошибка создания материала:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, materialData) => {
    try {
      await updateMaterial(id, materialData);
      await loadMaterials();
      setEditingMaterial(null);
    } catch (error) {
      console.error('Ошибка обновления материала:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        await deleteMaterial(id);
        await loadMaterials();
      } catch (error) {
        console.error('Ошибка удаления материала:', error);
        alert('Ошибка удаления материала');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">📦 Управление материалами</h2>
      <MaterialForm 
        material={editingMaterial}
        onSave={editingMaterial ? (data) => handleUpdate(editingMaterial.id, data) : handleAdd}
        onCancel={() => setEditingMaterial(null)}
      />
      <MaterialList 
        materials={materials}
        onEdit={setEditingMaterial}
        onDelete={handleDelete}
      />
    </div>
  );
}

