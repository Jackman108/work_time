/**
 * Диалог подтверждения с хуком для управления
 */

import React, { useState, useCallback, ReactElement } from 'react';
import type { ConfirmOptions, ConfirmDialogState, ConfirmDialogType } from '@renderer/types';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: ConfirmDialogType;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  show,
  title,
  message,
  confirmText,
  cancelText,
  type,
  onConfirm,
  onCancel
}: ConfirmDialogProps): ReactElement | null {
  if (!show) {
    return null;
  }

  const buttonClasses: Record<ConfirmDialogType, string> = {
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info'
  };

  const icons: Record<ConfirmDialogType, string> = {
    danger: '⚠️',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div 
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      tabIndex={-1}
      role="dialog"
      onClick={onCancel}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {icons[type]} {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Закрыть"
            />
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
              className={`btn ${buttonClasses[type]}`}
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

interface UseConfirmDialogResult {
  showConfirm: (options?: ConfirmOptions) => Promise<boolean>;
  confirmDialog: ReactElement | null;
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    show: false,
    title: 'Подтверждение',
    message: 'Вы уверены?',
    confirmText: 'Да',
    cancelText: 'Отмена',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirm = useCallback((options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setDialogState({
        show: true,
        title: options?.title || 'Подтверждение',
        message: options?.message || 'Вы уверены?',
        confirmText: options?.confirmText || 'Да',
        cancelText: options?.cancelText || 'Отмена',
        type: options?.type || 'warning',
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


