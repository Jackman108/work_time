/**
 * Сервис для работы с материалами
 * Использует Drizzle ORM
 * @module services/materials
 */

import { eq, desc, sum, count, sql } from 'drizzle-orm';
import { db, materials, materialLog } from '../db';
import type { Types } from 'types';

/**
 * Получить все материалы
 * @returns {Types.Material[]} Список всех материалов
 */
export function getAllMaterials(): Types.Material[] {
  return db.select().from(materials).orderBy(desc(materials.created_at)).all();
}

/**
 * Получить материал по ID
 * @param {number} id - ID материала
 * @returns {Types.Material | null} Материал или null
 */
export function getMaterialById(id: number): Types.Material | null {
  const result = db.select().from(materials).where(eq(materials.id, id)).limit(1).get();
  return result || null;
}

/**
 * Создать новый материал
 * @param {Types.MaterialCreateData} data - Данные материала
 * @returns {Types.Material} Созданный материал
 */
export function createMaterial(data: Types.MaterialCreateData): Types.Material {
  const result = db.insert(materials).values({
    name: data.name,
    unit: data.unit || 'шт',
    price_per_unit: data.price_per_unit,
  }).returning().get();

  if (!result) {
    throw new Error('Failed to create material');
  }

  console.log(`[DB] Создан материал: ID=${result.id}, название="${data.name}"`);

  // Обновляем время модификации БД для обновления соединения
  const dbModule = require('../db');
  if (dbModule.updateLastDbModTime) {
    dbModule.updateLastDbModTime();
  }

  return result;
}

/**
 * Обновить материал
 * @param {number} id - ID материала
 * @param {Types.MaterialUpdateData} data - Новые данные материала
 * @returns {Types.Material} Обновлённый материал
 */
export function updateMaterial(id: number, data: Types.MaterialUpdateData): Types.Material {
  const updateData: Partial<typeof materials.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.price_per_unit !== undefined) updateData.price_per_unit = data.price_per_unit;

  const result = db.update(materials)
    .set(updateData)
    .where(eq(materials.id, id))
    .returning()
    .get();

  if (!result) {
    throw new Error('Material not found');
  }

  console.log(`[DB] Обновлен материал: ID=${id}, название="${result.name}"`);
  return result;
}

/**
 * Удалить материал
 * @param {number} id - ID материала
 * @returns {boolean} true, если материал удалён
 */
export function deleteMaterial(id: number): boolean {
  const material = getMaterialById(id);
  const result = db.delete(materials).where(eq(materials.id, id)).returning().get();
  const deleted = !!result;

  if (deleted && material) {
    console.log(`[DB] Удален материал: ID=${id}, название="${material.name}"`);
  }

  return deleted;
}

/**
 * Получить статистику по материалу
 * @param {number} materialId - ID материала
 * @returns {Types.MaterialStats} Статистика материала
 */
export function getMaterialStats(materialId: number): Types.MaterialStats {
  const material = getMaterialById(materialId);
  if (!material) {
    throw new Error('Material not found');
  }

  // Статистика по использованию материала
  const stats = db.select({
    total_amount: sum(materialLog.amount),
    usage_count: count(materialLog.id),
  })
    .from(materialLog)
    .where(eq(materialLog.material_id, materialId))
    .get();

  const totalAmount = stats?.total_amount ? Number(stats.total_amount) : 0;
  const usageCount = stats?.usage_count ? Number(stats.usage_count) : 0;
  const totalCost = totalAmount * material.price_per_unit;

  return {
    material,
    totalAmount,
    usageCount,
    totalCost,
  };
}
