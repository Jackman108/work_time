/**
 * Preload-скрипт для организации безопасного взаимодействия между Renderer и Main процессами
 * Реализует безопасный мост между процессами с валидацией каналов
 * Следует принципам безопасности Electron и Separation of Concerns
 * 
 * @module preload
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Логирование только в режиме разработки
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
if (isDev) {
  console.log('[PRELOAD] Preload script загружен');
}

/**
 * Список разрешённых каналов IPC для безопасности
 */
const ALLOWED_CHANNELS: Record<string, string[]> = {
  projects: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  employees: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  materials: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  workLog: ['getAll', 'create', 'update', 'delete'],
  materialLog: ['getAll', 'create', 'update', 'delete'],
  projectPayments: ['getAll', 'create', 'update', 'delete', 'getTotalByProject'],
  reports: ['getAllProjects', 'getAllEmployees', 'getAllMaterials', 'getOverallStats'],
  backup: [
    'export',
    'exportToExeDir',
    'import',
    'importFromFile',
    'createAutoBackup',
    'getBackupList',
    'deleteBackup',
    'getExeDirectory',
    'cleanupOldFiles'
  ],
  dialog: ['showOpenDialog', 'showSaveDialog']
};

/**
 * Проверить, разрешён ли канал IPC
 * @param channel - Имя канала
 * @returns true, если канал разрешён
 */
function isChannelAllowed(channel: string): boolean {
  if (!channel || typeof channel !== 'string') {
    return false;
  }
  
  const [module, action] = channel.split(':');
  
  if (!module || !action) {
    return false;
  }

  const allowedActions = ALLOWED_CHANNELS[module];
  if (!allowedActions) {
    console.warn(`Модуль ${module} не найден в разрешенных каналах`);
    return false;
  }
  
  const isAllowed = allowedActions.includes(action);
  if (!isAllowed) {
    console.warn(`Действие ${action} не разрешено для модуля ${module}. Разрешенные:`, allowedActions);
  }
  
  return isAllowed;
}

/**
 * Безопасная обёртка для ipcRenderer.invoke с валидацией канала
 */
function safeInvoke(channel: string, ...args: any[]): Promise<any> {
  if (!isChannelAllowed(channel)) {
    return Promise.reject(new Error(`Канал ${channel} не разрешён`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * Безопасная обёртка для ipcRenderer.send с валидацией канала
 */
function safeSend(channel: string, data: any): void {
  if (!isChannelAllowed(channel)) {
    console.error(`Попытка отправить данные в неразрешённый канал: ${channel}`);
    return;
  }
  ipcRenderer.send(channel, data);
}

/**
 * Безопасная обёртка для ipcRenderer.on с валидацией канала
 */
function safeOn(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void {
  if (!isChannelAllowed(channel)) {
    console.error(`Попытка подписаться на неразрешённый канал: ${channel}`);
    return;
  }
  ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
}

/**
 * Типы для API, экспортируемого в window
 */
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, data: any) => void;
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
}

// Тип electronAPI уже объявлен в types/global.d.ts

// Экспортируем безопасный API в renderer process
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    invoke: safeInvoke,
    send: safeSend,
    on: safeOn,
    removeListener: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      if (isChannelAllowed(channel)) {
        ipcRenderer.removeListener(channel, (event, ...args) => listener(event, ...args));
      }
    }
  });
  console.log('[PRELOAD] electronAPI успешно экспортирован в window');
} catch (error) {
  console.error('[PRELOAD] Ошибка экспорта electronAPI:', error);
}

