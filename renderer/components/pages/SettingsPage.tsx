/**
 * Страница настроек
 */

import React, { useState, useEffect } from 'react';
import { 
  exportDatabaseToExeDir, 
  importDatabaseFromFile, 
  getExeDirectory,
  showOpenDialog,
  cleanupOldBackupFiles
} from '../../api';
import { useNotifications, ConfirmDialog } from '../common';
import type { ConfirmDialogType } from '../../types';

interface ConfirmDialogState {
  show: boolean;
  title?: string;
  message?: string;
  type?: ConfirmDialogType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function SettingsPage() {
  const [exeDirectory, setExeDirectory] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ show: false });
  const { showError, showSuccess } = useNotifications();

  useEffect(() => {
    loadExeDirectory();
  }, []);

  const loadExeDirectory = async () => {
    try {
      const dir = await getExeDirectory();
      setExeDirectory(dir || '');
    } catch (error) {
      console.error('Ошибка загрузки директории exe:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportDatabaseToExeDir();
      if (result.success) {
        showSuccess(`База данных успешно экспортирована в: ${result.path}`);
      } else {
        showError(result.message || 'Ошибка экспорта базы данных');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка экспорта:', error);
      showError('Ошибка экспорта: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'База данных', extensions: ['db'] },
          { name: 'Все файлы', extensions: ['*'] }
        ],
        title: 'Выберите файл базы данных для импорта'
      });

      if (!result || result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      const filePath = result.filePaths[0];

      setConfirmDialog({
        show: true,
        title: 'Подтверждение импорта',
        message: `Вы уверены, что хотите импортировать базу данных из файла?\n\n${filePath}\n\nВнимание: Текущая база данных будет заменена!`,
        type: 'danger',
        onConfirm: async () => {
          setConfirmDialog({ show: false });
          setLoading(true);
          try {
            const result = await importDatabaseFromFile(filePath);
            if (result.success) {
              showSuccess('База данных успешно импортирована. Приложение будет перезагружено.');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              showError(result.message || 'Ошибка импорта базы данных');
            }
          } catch (error) {
            const err = error as Error;
            console.error('Ошибка импорта:', error);
            showError('Ошибка импорта: ' + (err.message || 'Неизвестная ошибка'));
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => setConfirmDialog({ show: false })
      });
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка выбора файла:', error);
      showError('Ошибка выбора файла: ' + (err.message || 'Неизвестная ошибка'));
    }
  };

  const handleCleanup = async () => {
    setConfirmDialog({
      show: true,
      title: 'Подтверждение очистки',
      message: 'Удалить все временные файлы базы данных старше 24 часов?',
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ show: false });
        setLoading(true);
        try {
          const result = await cleanupOldBackupFiles();
          if (result.deletedCount > 0) {
            showSuccess(result.message);
          } else {
            showSuccess('Нет файлов для удаления');
          }
        } catch (error) {
          const err = error as Error;
          console.error('Ошибка очистки:', error);
          showError('Ошибка очистки: ' + (err.message || 'Неизвестная ошибка'));
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setConfirmDialog({ show: false })
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">⚙️ Настройки</h2>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📦 Управление базой данных</h5>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h6>Экспорт базы данных</h6>
            <p className="text-muted">
              Экспортирует текущую базу данных в файл <code>app_backup.db</code> в директории программы.
            </p>
            {exeDirectory && (
              <p className="text-info small mb-3">
                <strong>Директория программы:</strong> {exeDirectory}
              </p>
            )}
            <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Экспорт...
                </>
              ) : (
                '📤 Экспортировать базу данных'
              )}
            </button>
          </div>

          <hr />

          <div className="mb-4">
            <h6>Импорт базы данных</h6>
            <p className="text-muted">
              Импортирует базу данных из выбранного файла. Текущая база данных будет заменена.
            </p>
            <button className="btn btn-warning" onClick={handleImport} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Импорт...
                </>
              ) : (
                '📥 Импортировать базу данных'
              )}
            </button>
          </div>

          <hr />

          <div className="mb-4">
            <h6>Очистка временных файлов</h6>
            <p className="text-muted">
              Удаляет временные и устаревшие файлы базы данных (app_temp_*, app_corrupted_*, *.backup.*) старше 24 часов.
            </p>
            <button className="btn btn-secondary" onClick={handleCleanup} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Очистка...
                </>
              ) : (
                '🧹 Очистить временные файлы'
              )}
            </button>
          </div>

          <div className="alert alert-info mt-4">
            <strong>💡 Совет:</strong> Регулярно делайте резервные копии базы данных и очищайте временные файлы.
          </div>
        </div>
      </div>

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title || 'Подтверждение'}
        message={confirmDialog.message || ''}
        type={confirmDialog.type || 'warning'}
        confirmText="Импортировать"
        cancelText="Отмена"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onCancel={confirmDialog.onCancel || (() => {})}
      />
    </div>
  );
}


