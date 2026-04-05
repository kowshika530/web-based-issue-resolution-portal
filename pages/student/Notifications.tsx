import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertTriangle, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationsAsRead } from '../../services/storage';
import { Notification, User } from '../../types';

interface Props {
  user: User;
}

export const Notifications: React.FC<Props> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const userId = user.id || user._id;
    if (userId) {
        const notifs = await getNotifications(userId);
        setNotifications(notifs);
    }
  }

  const handleMarkAllRead = async () => {
    const userId = user.id || user._id;
    if (userId) {
      await markNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'info': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center text-sm text-blue-600 font-medium hover:underline transition-colors"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map((notif: any) => (
          <div 
            key={notif._id || notif.id} 
            className={`p-4 rounded-xl border flex items-start space-x-4 transition-all hover:bg-slate-50 ${
                notif.isRead ? 'bg-white border-slate-200 opacity-75' : 'bg-white border-blue-200 shadow-sm'
            }`}
          >
            <div className={`p-2 rounded-full ${notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm border border-slate-100'}`}>
                {getIcon(notif.type)}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className={`font-semibold text-slate-800 ${!notif.isRead && 'text-blue-700'}`}>{notif.title}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
            </div>
            {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
            <div className="text-center py-12">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No new notifications</p>
            </div>
        )}
      </div>
    </div>
  );
};