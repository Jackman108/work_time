/**
 * Конфигурационный модуль приложения
 * Централизует все настройки приложения
 * Следует принципу Single Responsibility
 * 
 * @module config/app.config
 */

import * as path from 'path';
import type { AppConfig } from 'types/config';

/**
 * Определение режима работы приложения
 */
let isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
if (!isPortable && typeof process !== 'undefined' && process.execPath) {
  try {
    const execName = path.basename(process.execPath, '.exe');
    isPortable = execName.includes('portable') || execName.includes('Portable');
  } catch (e) {
    // Игнорируем ошибки при определении
  }
}

const appDir = isPortable 
  ? (process.env.PORTABLE_EXECUTABLE_DIR || (typeof process !== 'undefined' && process.execPath ? path.dirname(process.execPath) : __dirname))
  : __dirname;

const isPackaged = process.env.APP_IS_PACKAGED === 'true' || process.env.NODE_ENV === 'production';
const isDev = !isPackaged && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);
const isProduction = isPackaged || process.env.NODE_ENV === 'production';

/**
 * Конфигурация приложения
 */
const config: AppConfig = {
  env: {
    isDev,
    isProduction,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  electron: {
    window: {
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600
    },
    devTools: isDev,
    devServerUrl: 'http://localhost:5173'
  },

  database: {
    dir: isPortable 
      ? path.join(appDir, 'db')
      : path.join(__dirname, '..', 'db'),
    filename: 'app.db',
    path: isPortable
      ? path.join(appDir, 'db', 'app.db')
      : path.join(__dirname, '..', 'db', 'app.db')
  },

  validation: {
    stringMaxLength: 1000,
    phoneMinDigits: 10,
    defaultCurrency: 'RUB',
    defaultLocale: 'ru-RU'
  },

  formatting: {
    currency: {
      locale: 'ru-RU',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    date: {
      locale: 'ru-RU',
      options: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    }
  }
};

export default config;


