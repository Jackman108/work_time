/**
 * Страница настроек
 */

import React, { useState, useEffect } from 'react';
import { 
  exportDatabaseToFile,
  importDatabaseFromFile, 
  getExeDirectory,
  getCurrentDatabaseInfo,
  getBackupList,
  deleteBackup,
  showOpenDialog,
  showSaveDialog
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

interface DatabaseInfo {
  name: string;
  path: string;
}

interface BackupItem {
  path: string;
  createdAt: string;
  hash: string;
}

export default function SettingsPage() {
  const [exeDirectory, setExeDirectory] = useState('');
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ show: false });
  const { showError, showSuccess } = useNotifications();

  useEffect(() => {
    loadExeDirectory();
    loadDatabaseInfo();
    loadBackups();
  }, []);

  const loadExeDirectory = async () => {
    try {
      const dir = await getExeDirectory();
      setExeDirectory(dir || '');
    } catch (error) {
      console.error('Ошибка загрузки директории exe:', error);
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const info = await getCurrentDatabaseInfo();
      setDatabaseInfo(info);
    } catch (error) {
      console.error('Ошибка загрузки информации о БД:', error);
    }
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const result = await getBackupList();
      if (result.success && result.backups) {
        setBackups(result.backups);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка бэкапов:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleExport = async () => {
    try {
      // Получаем путь к папке backups по умолчанию
      let backupDir = 'backups';
      try {
        const exeDir = await getExeDirectory();
        // Используем строковую конкатенацию вместо path.join
        backupDir = exeDir ? `${exeDir}${exeDir.endsWith('/') || exeDir.endsWith('\\') ? '' : '/'}backups` : 'backups';
      } catch (e) {
        // Используем значение по умолчанию
      }

      const defaultFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      // Используем строковую конкатенацию вместо path.join
      const separator = backupDir.includes('\\') ? '\\' : '/';
      const defaultPath = `${backupDir}${backupDir.endsWith(separator) ? '' : separator}${defaultFileName}`;

      const savePath = await showSaveDialog({
        title: 'Сохранить базу данных',
        defaultPath: defaultPath,
        filters: [
          { name: 'База данных', extensions: ['db'] },
          { name: 'Все файлы', extensions: ['*'] }
        ]
      });

      if (!savePath) {
        return; // Пользователь отменил
      }

      setLoading(true);
      try {
        const result = await exportDatabaseToFile(savePath);
        if (result.success) {
          showSuccess(`База данных успешно экспортирована в: ${result.path}`);
          // Обновляем список бэкапов, если файл сохранен в папку backups
          loadBackups();
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
    } catch (error) {
      const err = error as Error;
      console.error('Ошибка выбора места сохранения:', error);
      showError('Ошибка выбора места сохранения: ' + (err.message || 'Неизвестная ошибка'));
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
              showSuccess('База данных успешно импортирована.');
              // Обновляем данные без перезагрузки страницы
              await loadDatabaseInfo();
              await loadBackups();
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


  const handleLoadBackup = async (backupPath: string) => {
    const backupName = backupPath.split(/[/\\]/).pop() || 'бэкап';
    setConfirmDialog({
      show: true,
      title: 'Подтверждение загрузки',
      message: `Вы уверены, что хотите загрузить бэкап?\n\n${backupName}\n\nВнимание: Текущая база данных будет заменена!`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ show: false });
        setLoading(true);
        try {
          const result = await importDatabaseFromFile(backupPath);
          if (result.success) {
            showSuccess('База данных успешно загружена из бэкапа.');
            // Обновляем данные без перезагрузки страницы
            await loadDatabaseInfo();
            await loadBackups();
          } else {
            showError(result.message || 'Ошибка загрузки бэкапа');
          }
        } catch (error) {
          const err = error as Error;
          console.error('Ошибка загрузки бэкапа:', error);
          showError('Ошибка загрузки бэкапа: ' + (err.message || 'Неизвестная ошибка'));
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setConfirmDialog({ show: false })
    });
  };

  const handleDeleteBackup = async (backupPath: string) => {
    const backupName = backupPath.split(/[/\\]/).pop() || 'бэкап';
    setConfirmDialog({
      show: true,
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить бэкап?\n\n${backupName}`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ show: false });
        setLoading(true);
        try {
          const result = await deleteBackup(backupPath);
          if (result.success) {
            showSuccess('Бэкап успешно удален');
            loadBackups();
          } else {
            showError(result.message || 'Ошибка удаления бэкапа');
          }
        } catch (error) {
          const err = error as Error;
          console.error('Ошибка удаления бэкапа:', error);
          showError('Ошибка удаления бэкапа: ' + (err.message || 'Неизвестная ошибка'));
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setConfirmDialog({ show: false })
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getBackupName = (backupPath: string) => {
    return backupPath.split(/[/\\]/).pop() || backupPath;
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">⚙️ Настройки</h2>

      {/* Информация о текущей БД */}
      {databaseInfo && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">💾 Текущая база данных</h5>
          </div>
          <div className="card-body">
            <div className="mb-2">
              <strong>Название:</strong> <code>{databaseInfo.name}</code>
            </div>
            <div className="mb-0">
              <strong>Путь:</strong> <code className="small">{databaseInfo.path}</code>
            </div>
          </div>
        </div>
      )}

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


          <div className="alert alert-info mt-4">
            <strong>💡 Совет:</strong> Регулярно делайте резервные копии базы данных и очищайте временные файлы.
          </div>
        </div>
      </div>

      {/* Список доступных бэкапов */}
      <div className="card mt-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📋 Доступные бэкапы</h5>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={loadBackups}
            disabled={loadingBackups}
          >
            {loadingBackups ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Обновление...
              </>
            ) : (
              '🔄 Обновить'
            )}
          </button>
        </div>
        <div className="card-body">
          {loadingBackups ? (
            <div className="text-center py-3">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Загрузка бэкапов...
            </div>
          ) : backups.length === 0 ? (
            <div className="alert alert-info mb-0">
              Нет доступных бэкапов. Создайте бэкап, используя функцию экспорта.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Дата создания</th>
                    <th>Путь</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup, index) => (
                    <tr key={index}>
                      <td>
                        <code>{getBackupName(backup.path)}</code>
                      </td>
                      <td>{formatDate(backup.createdAt)}</td>
                      <td>
                        <code className="small text-muted" style={{ fontSize: '0.85em' }}>
                          {backup.path}
                        </code>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleLoadBackup(backup.path)}
                          disabled={loading}
                          title="Загрузить этот бэкап"
                        >
                          📥 Загрузить
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteBackup(backup.path)}
                          disabled={loading}
                          title="Удалить этот бэкап"
                        >
                          🗑️ Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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


