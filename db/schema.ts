/**
 * Drizzle ORM схема базы данных
 * Определяет структуру всех таблиц с полной типизацией TypeScript
 */

import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ============ Проекты (строительные объекты) ============

export const projects = sqliteTable('projects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    address: text('address'),
    date_start: text('date_start'), // SQLite хранит даты как TEXT
    date_end: text('date_end'),
    budget: real('budget').default(0).notNull(),
    description: text('description'),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
    updated_at: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    createdAtIndex: index('idx_projects_created_at').on(table.created_at),
}));

// ============ Сотрудники ============

export const employees = sqliteTable('employees', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    role: text('role'), // Должность/роль
    wage_per_hour: real('wage_per_hour').default(0).notNull(),
    phone: text('phone'),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
    updated_at: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    nameIndex: index('idx_employees_name').on(table.name),
}));

// ============ Материалы ============

export const materials = sqliteTable('materials', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    unit: text('unit').default('шт').notNull(),
    price_per_unit: real('price_per_unit').default(0).notNull(),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
    updated_at: text('updated_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    nameIndex: index('idx_materials_name').on(table.name),
}));

// ============ Учёт рабочего времени и заработной платы ============

export const workLog = sqliteTable('work_log', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employee_id: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    project_id: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    salary_per_day: real('salary_per_day').default(0).notNull(),
    notes: text('notes'),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    employeeIndex: index('idx_work_log_employee').on(table.employee_id),
    projectIndex: index('idx_work_log_project').on(table.project_id),
    dateIndex: index('idx_work_log_date').on(table.date),
    projectDateIndex: index('idx_work_log_project_date').on(table.project_id, table.date),
    employeeDateIndex: index('idx_work_log_employee_date').on(table.employee_id, table.date),
    uniqueIndex: uniqueIndex('idx_work_log_unique').on(table.employee_id, table.project_id, table.date),
}));

// ============ Учёт списания материалов ============

export const materialLog = sqliteTable('material_log', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    material_id: integer('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
    project_id: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    amount: real('amount').default(0).notNull(),
    notes: text('notes'),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    materialIndex: index('idx_material_log_material').on(table.material_id),
    projectIndex: index('idx_material_log_project').on(table.project_id),
    dateIndex: index('idx_material_log_date').on(table.date),
    projectDateIndex: index('idx_material_log_project_date').on(table.project_id, table.date),
    materialProjectIndex: index('idx_material_log_material_project').on(table.material_id, table.project_id),
}));

// ============ Поступления денег на проекты ============

export const projectPayments = sqliteTable('project_payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    project_id: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    amount: real('amount').default(0).notNull(),
    notes: text('notes'),
    created_at: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
}, (table) => ({
    projectIndex: index('idx_project_payments_project').on(table.project_id),
    dateIndex: index('idx_project_payments_date').on(table.date),
    projectDateIndex: index('idx_project_payments_project_date').on(table.project_id, table.date),
}));

// Типы для экспорта (инферированы из схемы)
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;

export type WorkLog = typeof workLog.$inferSelect;
export type NewWorkLog = typeof workLog.$inferInsert;

export type MaterialLog = typeof materialLog.$inferSelect;
export type NewMaterialLog = typeof materialLog.$inferInsert;

export type ProjectPayment = typeof projectPayments.$inferSelect;
export type NewProjectPayment = typeof projectPayments.$inferInsert;

