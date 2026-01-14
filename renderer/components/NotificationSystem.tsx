/**
 * Система уведомлений (Toast) для приложения
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Notification, NotificationTypeValue, NotificationContextValue } from '@renderer/types';

export const NotificationType = {
  SUCCESS: 'success' as NotificationTypeValue,
  ERROR: 'error' as NotificationTypeValue,
  WARNING: 'warning' as NotificationTypeValue,
  INFO: 'info' as NotificationTypeValue
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationTypeValue = NotificationType.INFO, duration: number = 5000): number => {
    const id = Date.now() + Math.random();
    const notification: Notification = { id, message, type, duration };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: number): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback((): void => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((message: string, duration: number = 5000): number => {
    return showNotification(message, NotificationType.SUCCESS, duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration: number = 7000): number => {
    return showNotification(message, NotificationType.ERROR, duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration: number = 6000): number => {
    return showNotification(message, NotificationType.WARNING, duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration: number = 5000): number => {
    return showNotification(message, NotificationType.INFO, duration);
  }, [showNotification]);

  const value: NotificationContextValue = {
    notifications,
    showNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="notification-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999, maxWidth: '400px', pointerEvents: 'none' }}
    >
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { message, type } = notification;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const typeClasses: Record<NotificationTypeValue, string> = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  const icons: Record<NotificationTypeValue, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div
      className={`alert alert-dismissible fade show shadow-sm mb-2 ${typeClasses[type]}`}
      style={{
        pointerEvents: 'auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease-in-out',
        minWidth: '300px'
      }}
      role="alert"
    >
      <strong>{icons[type]} </strong>
      {message}
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
        aria-label="Закрыть"
      />
    </div>
  );
}


