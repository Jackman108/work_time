/**
 * Конфигурационный модуль приложения
 * Централизует все настройки приложения
 * Следует принципу Single Responsibility
 * 
 * @module config/app.config
 */

const path = require('path');

/**
 * Определение режима работы приложения
 */
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Конфигурация приложения
 */
const config = {
  // Режим работы
  env: {
    isDev,
    isProduction,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Настройки Electron
  electron: {
    window: {
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600
    },
    devTools: isDev, // Автоматически открывать DevTools в режиме разработки
    devServerUrl: 'http://localhost:5173'
  },

  // Настройки базы данных
  database: {
    dir: path.join(__dirname, '..', 'db'),
    filename: 'app.db',
    path: path.join(__dirname, '..', 'db', 'app.db')
  },

  // Настройки валидации
  validation: {
    stringMaxLength: 1000,
    phoneMinDigits: 10,
    defaultCurrency: 'RUB',
    defaultLocale: 'ru-RU'
  },

  // Настройки форматирования
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

module.exports = config;

