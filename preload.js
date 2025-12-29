/**
 * Preload-скрипт для организации безопасного взаимодействия между Renderer и Main процессами
 * Реализует безопасный мост между процессами с валидацией каналов
 * Следует принципам безопасности Electron и Separation of Concerns
 * 
 * @module preload
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Список разрешённых каналов IPC для безопасности
 * Предотвращает случайные или злонамеренные вызовы IPC
 */
const ALLOWED_CHANNELS = {
  // Каналы для проектов
  projects: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  // Каналы для сотрудников
  employees: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  // Каналы для материалов
  materials: ['getAll', 'getById', 'create', 'update', 'delete', 'getStats'],
  // Каналы для учёта рабочего времени
  workLog: ['getAll', 'create', 'update', 'delete'],
  // Каналы для учёта списания материалов
  materialLog: ['getAll', 'create', 'update', 'delete'],
  // Каналы для платежей по проектам
  projectPayments: ['getAll', 'create', 'update', 'delete', 'getTotalByProject'],
  // Каналы для отчётов
  reports: ['getAllProjects', 'getAllEmployees', 'getAllMaterials', 'getOverallStats']
};

/**
 * Проверить, разрешён ли канал IPC
 * @param {string} channel - Имя канала
 * @returns {boolean} true, если канал разрешён
 */
function isChannelAllowed(channel) {
  // Формат канала: 'module:action' (например, 'projects:getAll')
  const [module, action] = channel.split(':');
  
  if (!module || !action) {
    return false;
  }

  const allowedActions = ALLOWED_CHANNELS[module];
  return allowedActions && allowedActions.includes(action);
}

/**
 * Безопасная обёртка для ipcRenderer.invoke с валидацией канала
 * @param {string} channel - Имя канала
 * @param {...any} args - Аргументы для передачи
 * @returns {Promise} Результат вызова IPC
 */
function safeInvoke(channel, ...args) {
  if (!isChannelAllowed(channel)) {
    return Promise.reject(new Error(`Канал ${channel} не разрешён`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * Безопасная обёртка для ipcRenderer.send с валидацией канала
 * @param {string} channel - Имя канала
 * @param {any} data - Данные для передачи
 */
function safeSend(channel, data) {
  if (!isChannelAllowed(channel)) {
    console.error(`Попытка отправить данные в неразрешённый канал: ${channel}`);
    return;
  }
  ipcRenderer.send(channel, data);
}

/**
 * Безопасная обёртка для ipcRenderer.on с валидацией канала
 * @param {string} channel - Имя канала
 * @param {Function} listener - Обработчик события
 */
function safeOn(channel, listener) {
  if (!isChannelAllowed(channel)) {
    console.error(`Попытка подписаться на неразрешённый канал: ${channel}`);
    return;
  }
  ipcRenderer.on(channel, listener);
}

// Экспортируем безопасный API в renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Вызвать метод в main process
   * @param {string} channel - Имя канала
   * @param {...any} args - Аргументы
   * @returns {Promise} Результат с полем success и data/error
   */
  invoke: safeInvoke,

  /**
   * Отправить сообщение в main process (без ответа)
   * @param {string} channel - Имя канала
   * @param {any} data - Данные
   */
  send: safeSend,

  /**
   * Подписаться на события из main process
   * @param {string} channel - Имя канала
   * @param {Function} listener - Обработчик события
   */
  on: safeOn,

  /**
   * Отписаться от событий
   * @param {string} channel - Имя канала
   * @param {Function} listener - Обработчик события
   */
  removeListener: (channel, listener) => {
    if (isChannelAllowed(channel)) {
      ipcRenderer.removeListener(channel, listener);
    }
  }
});

