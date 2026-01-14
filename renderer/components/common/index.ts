/**
 * Централизованный экспорт common компонентов
 */

export { default as LoadingSpinner } from '@renderer/components/LoadingSpinner';
export { default as FormErrors, FieldError, getFieldClasses } from '@renderer/components/FormErrors';
export { default as ConfirmDialog, useConfirmDialog } from '@renderer/components/ConfirmDialog';
export { default as Navigation } from '@renderer/components/Navigation';
export { useNotifications, NotificationProvider, NotificationType } from '@renderer/components/NotificationSystem';

// Chart components (tsx)
export { default as ProjectsBarChart } from './ProjectsBarChart';
export { default as CostsPieChart } from './CostsPieChart';
export { default as EmployeesBarChart } from './EmployeesBarChart';
export { default as MaterialsPieChart } from './MaterialsPieChart';
export { default as OverallStatsChart } from './OverallStatsChart';

