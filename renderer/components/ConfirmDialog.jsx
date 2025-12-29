/**
 * Компонент диалога подтверждения
 * Заменяет устаревший window.confirm
 * Следует принципам Single Responsibility и лучшим практикам UX
 * 
 * @module renderer/components/ConfirmDialog
 */

import React from 'react';

/**
 * Диалог подтверждения
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.show - Показывать ли диалог
 * @param {string} props.title - Заголовок диалога
 * @param {string} props.message - Сообщение диалога
 * @param {string} props.confirmText - Текст кнопки подтверждения
 * @param {string} props.cancelText - Текст кнопки отмены
 * @param {string} props.type - Тип диалога (danger, warning, info)
 * @param {Function} props.onConfirm - Обработчик подтверждения
 * @param {Function} props.onCancel - Обработчик отмены
 */
export default function ConfirmDialog({
  show = false,
  title = 'Подтверждение',
  message = 'Вы уверены?',
  confirmText = 'Да',
  cancelText = 'Отмена',
  type = 'warning',
  onConfirm,
  onCancel
}) {
  if (!show) {
    return null;
  }

  const getButtonClass = () => {
    const classes = {
      danger: 'btn-danger',
      warning: 'btn-warning',
      info: 'btn-info'
    };
    return classes[type] || classes.warning;
  };

  const getIcon = () => {
    const icons = {
      danger: '⚠️',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.warning;
  };

  return (
    <div 
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      tabIndex="-1"
      role="dialog"
      onClick={onCancel}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {getIcon()} {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Закрыть"
            ></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${getButtonClass()}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Хук для управления диалогом подтверждения
 * @returns {Object} { showConfirm, confirmDialog }
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState({
    show: false,
    title: 'Подтверждение',
    message: 'Вы уверены?',
    confirmText: 'Да',
    cancelText: 'Отмена',
    type: 'warning',
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = React.useCallback((options) => {
    return new Promise((resolve, reject) => {
      setDialogState({
        show: true,
        title: options.title || 'Подтверждение',
        message: options.message || 'Вы уверены?',
        confirmText: options.confirmText || 'Да',
        cancelText: options.cancelText || 'Отмена',
        type: options.type || 'warning',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, show: false }));
          reject(false);
        }
      });
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      show={dialogState.show}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      type={dialogState.type}
      onConfirm={dialogState.onConfirm}
      onCancel={dialogState.onCancel}
    />
  );

  return { showConfirm, confirmDialog };
}

