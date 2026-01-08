/**
 * Глобальные типы для Electron API
 * Определяет интерфейс electronAPI, который экспортируется из preload.ts
 */

interface ElectronAPI {
  /**
   * Вызвать IPC метод безопасно
   * @param channel - Канал IPC (например, 'projects:getAll')
   * @param args - Аргументы для передачи
   * @returns Promise с результатом
   */
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;

  /**
   * Отправить сообщение через IPC
   * @param channel - Канал IPC
   * @param args - Аргументы для передачи
   */
  send: (channel: string, ...args: unknown[]) => void;

  /**
   * Подписаться на события IPC
   * @param channel - Канал IPC
   * @param listener - Функция-обработчик события
   */
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;

  /**
   * Отписаться от событий IPC
   * @param channel - Канал IPC
   * @param listener - Функция-обработчик события
   */
  removeListener: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export { };
