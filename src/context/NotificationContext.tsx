"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export type NotificationType =
  | 'NEW_DRIVE'
  | 'DEADLINE_URGENT'
  | 'HIGH_MATCH'
  | 'STATUS_CHANGE'
  | 'SHARED_ACCESS'
  | 'SYSTEM';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  placementId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: (onlyRead?: boolean) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      const res = await fetch('/api/notifications?limit=30');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [status]);

  // Initial fetch and poll every 60 seconds when user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));

      const interval = setInterval(() => {
        fetchNotifications();
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [status, fetchNotifications]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        toast.success('All notifications marked as read');
      } else {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n._id === id);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        fetchNotifications();
      } else {
        toast.success('Notification removed');
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  };

  const clearAllNotifications = async (onlyRead: boolean = true) => {
    setNotifications((prev) => (onlyRead ? prev.filter((n) => !n.read) : []));
    if (!onlyRead) setUnreadCount(0);

    try {
      const res = await fetch(`/api/notifications?all=${!onlyRead}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(onlyRead ? 'Cleared read notifications' : 'All notifications cleared');
      } else {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

