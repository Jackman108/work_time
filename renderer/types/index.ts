/**
 * Централизованные типы для renderer
 * 
 * Структура:
 * - Реэкспорт базовых сущностей из types/index.d.ts
 * - Renderer-специфичные типы (формы, хуки, UI компоненты)
 */

import { ReactNode, Dispatch, SetStateAction, FormEvent, ChangeEvent, MouseEvent } from 'react';

// ============ Базовые сущности ============
// Используем собственные определения для frontend, 
// так как они могут отличаться от backend (joined fields, optional timestamps)

export interface Employee {
    id: number;
    name: string;
    phone: string | null;
    position: string | null;
    hire_date: string | null;
    salary_per_day: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Project {
    id: number;
    name: string;
    address: string | null;
    description: string | null;
    budget: number;
    start_date: string | null;
    end_date: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Material {
    id: number;
    name: string;
    unit: string;
    price_per_unit: number;
    created_at?: string;
    updated_at?: string;
}

export interface WorkLog {
    id: number;
    employee_id: number;
    project_id: number;
    date: string;
    salary_per_day: number;
    notes: string | null;
    created_at?: string;
    // Joined fields from related tables
    employee_name?: string;
    project_name?: string;
}

export interface MaterialLog {
    id: number;
    material_id: number;
    project_id: number;
    date: string;
    amount: number;
    notes: string | null;
    created_at?: string;
    // Joined fields
    material_name?: string;
    project_name?: string;
    unit?: string;
    price_per_unit?: number;
}

export interface ProjectPayment {
    id: number;
    project_id: number;
    date: string;
    amount: number;
    notes: string | null;
    created_at?: string;
    // Joined fields
    project_name?: string;
}

// ============ Form Data Types ============
// Все поля формы - строки, так как input.value всегда string

export interface EmployeeFormData {
    name: string;
    phone: string;
    position: string;
    hire_date: string;
    salary_per_day: string;
}

export interface ProjectFormData {
    name: string;
    address: string;
    budget: string;
    start_date: string;
    end_date: string;
    description: string;
}

export interface MaterialFormData {
    name: string;
    unit: string;
    price_per_unit: string;
}

export interface WorkLogFormData {
    employee_id: string;
    project_id: string;
    date: string;
    salary_per_day: string;
    notes: string;
}

export interface MaterialLogFormData {
    material_id: string;
    project_id: string;
    date: string;
    amount: string;
    notes: string;
}

export interface PaymentFormData {
    project_id: string;
    date: string;
    amount: string;
    notes: string;
}

// ============ Report Types ============

export interface ProjectReport {
    id: number;
    name: string;
    address: string | null;
    date_start: string | null;
    date_end: string | null;
    budget: number;
    salary_costs: number;
    material_costs: number;
    payments_received: number;
    total_costs: number;
    balance: number;
    budget_remaining: number;
}

export interface EmployeeReport {
    id: number;
    name: string;
    role: string | null;
    days_worked: number;
    total_salary: number;
    total_received: number;
    projects_count: number;
}

export interface MaterialReport {
    id: number;
    name: string;
    unit: string;
    price_per_unit: number;
    total_amount: number;
    total_cost: number;
    projects_count: number;
}

export interface OverallStats {
    projectsCount: number;
    employeesCount: number;
    materialsCount: number;
    totalBudget: number;
    totalCosts: number;
    totalSalaryCosts: number;
    totalMaterialCosts: number;
    totalPaymentsReceived: number;
    totalBalance: number;
}

// ============ Notification Types ============

export type NotificationTypeValue = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: number;
    message: string;
    type: NotificationTypeValue;
    duration: number;
}

export interface NotificationContextValue {
    notifications: Notification[];
    showNotification: (message: string, type?: NotificationTypeValue, duration?: number) => number;
    removeNotification: (id: number) => void;
    clearAll: () => void;
    showSuccess: (message: string, duration?: number) => number;
    showError: (message: string, duration?: number) => number;
    showWarning: (message: string, duration?: number) => number;
    showInfo: (message: string, duration?: number) => number;
}

// ============ Dialog Types ============

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmDialogType;
}

export interface ConfirmDialogState {
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: ConfirmDialogType;
    onConfirm: () => void;
    onCancel: () => void;
}

// ============ Hook Types ============

export interface UsePageDataConfig<T> {
    loadData: () => Promise<T[]>;
    createItem?: (data: Partial<T>) => Promise<T>;
    updateItem?: (id: number, data: Partial<T>) => Promise<T>;
    deleteItem?: (id: number) => Promise<void | boolean>;
    messages?: {
        loadError?: string;
        createSuccess?: string;
        createError?: string;
        updateSuccess?: string;
        updateError?: string;
        deleteSuccess?: string;
        deleteError?: string;
        deleteConfirmTitle?: string;
        deleteConfirmMessage?: string;
    };
    dependencies?: unknown[];
}

export interface UsePageDataResult<T> {
    items: T[];
    loading: boolean;
    editingItem: T | null;
    setEditingItem: Dispatch<SetStateAction<T | null>>;
    handleAdd: (itemData: Partial<T>) => Promise<void>;
    handleUpdate: (id: number, itemData: Partial<T>) => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
    reloadData: () => Promise<void>;
    confirmDialog: ReactNode;
    operationLoading: boolean;
}

// ============ Router Types ============

export interface RouteConfig {
    component: React.ComponentType;
    title: string;
    icon: string;
}

// ============ Validation Types ============

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    errors?: Record<string, string>;
}

// ============ API Types ============

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface BackupResult {
    success: boolean;
    message: string;
    path?: string;
    backupPath?: string;
}

// ============ Event Types ============

export type FormSubmitEvent = FormEvent<HTMLFormElement>;
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
export type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
export type ButtonClickEvent = MouseEvent<HTMLButtonElement>;
export type DivClickEvent = MouseEvent<HTMLDivElement>;

// ============ Filters Types ============

export interface DateRangeFilter {
    dateFrom?: string;
    dateTo?: string;
}

export interface ProjectFilter extends DateRangeFilter {
    project_id?: number | string;
}

export interface EmployeeFilter extends DateRangeFilter {
    employee_id?: number | string;
}

export interface MaterialFilter extends DateRangeFilter {
    material_id?: number | string;
}
