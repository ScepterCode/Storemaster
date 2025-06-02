
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationSettings {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enablePush: true,
    enableEmail: false,
    enableInApp: true,
    soundEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Add some sample notifications for demo
    const hasInitialNotifications = localStorage.getItem('notifications');
    if (!hasInitialNotifications) {
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          title: 'Low Stock Alert',
          message: 'Product "Widget A" is running low on stock (2 remaining)',
          type: 'warning',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false,
          actionUrl: '/inventory'
        },
        {
          id: '2',
          title: 'Daily Sales Report',
          message: 'Your daily sales report is ready for review',
          type: 'info',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: false,
          actionUrl: '/reports'
        },
        {
          id: '3',
          title: 'New Transaction',
          message: 'Cash transaction completed: $125.50',
          type: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          read: true,
          actionUrl: '/transactions'
        }
      ];
      setNotifications(sampleNotifications);
    }
  }, []);

  useEffect(() => {
    // Save notifications to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Play sound if enabled
    if (settings.soundEnabled && settings.enableInApp) {
      // You could add actual sound playing here
      console.log('🔔 Notification sound');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        updateSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
