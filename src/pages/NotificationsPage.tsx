import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Notification } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Bell,
  CheckCheck,
  Calendar,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Bookmark
} from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, readStatus: true } : n));
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_approved':
      case 'booking_active':
      case 'booking_returned':
        return <Calendar className="w-4 h-4 text-emerald-700" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'listing_status':
        return <Bookmark className="w-4 h-4 text-lime-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  const handleNotifClick = (n: Notification) => {
    handleMarkRead(n.notificationId);
    if (n.type === 'new_message') {
      onNavigate('/messages', { conversationId: n.relatedId });
    } else if (n.type.startsWith('booking_')) {
      onNavigate('/dashboard', { tab: 'borrows' });
    } else if (n.type === 'listing_status' && n.relatedId) {
      onNavigate(`/equipment/${n.relatedId}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-stone-900">Sign in to view notifications</h2>
        <button onClick={() => onNavigate('/login')} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Booking requests, handover updates, messages, and wishlist availability alerts.
          </p>
        </div>

        {notifications.some(n => !n.readStatus) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-2">
          <Bell className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-xs text-stone-500">No notifications yet. You are all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
          {notifications.map(n => (
            <div
              key={n.notificationId}
              onClick={() => handleNotifClick(n)}
              className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                n.readStatus ? 'hover:bg-stone-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-stone-200 shrink-0 shadow-2xs">
                {getNotifIcon(n.type)}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs ${n.readStatus ? 'font-semibold text-stone-800' : 'font-bold text-stone-900'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-stone-400 tabular-nums">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.readStatus && (
                <div className="w-2 h-2 rounded-full bg-emerald-700 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
