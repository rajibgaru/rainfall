'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Clock,
  DollarSign,
  Heart,
  Award,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({ total: 0, unread: 0, byType: {} });
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (filter === 'unread') {
        params.append('unreadOnly', 'true');
      } else if (filter !== 'all') {
        params.append('type', filter);
      }
      
      const response = await fetch(`/api/dashboard/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const markAsRead = async (notificationIds: string[] | 'all') => {
    try {
      const response = await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: notificationIds === 'all' ? undefined : notificationIds,
          markAllAsRead: notificationIds === 'all',
        }),
      });

      if (!response.ok) throw new Error('Failed to mark notifications as read');

      fetchNotifications();
      setSelectedNotifications(new Set());
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const deleteNotifications = async (notificationId?: string) => {
    try {
      const url = notificationId 
        ? `/api/dashboard/notifications?id=${notificationId}`
        : '/api/dashboard/notifications?deleteAll=true';
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('Failed to delete notifications');

      fetchNotifications();
      setSelectedNotifications(new Set());
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  const toggleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_PLACED':
      case 'BID_OUTBID':
        return <Clock className="text-blue-500" size={20} />;
      case 'AUCTION_WON':
        return <Award className="text-green-500" size={20} />;
      case 'AUCTION_ENDING':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'WATCHLIST_UPDATE':
        return <Heart className="text-red-500" size={20} />;
      case 'PAYMENT_DUE':
        return <DollarSign className="text-orange-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-600">
            {summary.unread > 0 ? `${summary.unread} unread` : 'All caught up!'} • {summary.total} total
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => markAsRead('all')}
            disabled={summary.unread === 0}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            <CheckCheck size={16} className="mr-1" />
            Mark All Read
          </button>
          
          <button
            onClick={() => deleteNotifications()}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            <Trash2 size={16} className="mr-1" />
            Clear All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { key: 'all', label: 'All', count: summary.total },
          { key: 'unread', label: 'Unread', count: summary.unread },
          { key: 'BID_PLACED', label: 'Bids', count: summary.byType.BID_PLACED || 0 },
          { key: 'AUCTION_WON', label: 'Won', count: summary.byType.AUCTION_WON || 0 },
          { key: 'WATCHLIST_UPDATE', label: 'Watchlist', count: summary.byType.WATCHLIST_UPDATE || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg mb-4">
          <span className="text-sm text-blue-700">
            {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => markAsRead(Array.from(selectedNotifications))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark as Read
            </button>
            <button
              onClick={() => {
                Array.from(selectedNotifications).forEach(id => deleteNotifications(id));
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here when you have activity.'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
                notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
              } hover:shadow-md`}
            >
              <input
                type="checkbox"
                checked={selectedNotifications.has(notification.id)}
                onChange={() => toggleSelectNotification(notification.id)}
                className="mt-1"
              />
              
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead([notification.id])}
                        className="text-blue-600 hover:text-blue-800"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotifications(notification.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}