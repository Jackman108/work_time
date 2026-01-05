/**
 * Централизованный экспорт общих/системных компонентов
 * 
 * @module renderer/components/common
 */

export { NotificationProvider, useNotifications, NotificationType } from './NotificationSystem';
export { default as LoadingSpinner, InlineSpinner } from './LoadingSpinner';
export { default as ConfirmDialog, useConfirmDialog } from './ConfirmDialog';
export { default as FormErrors, FieldError, getFieldClasses } from './FormErrors';
export { default as Navigation } from './Navigation';

