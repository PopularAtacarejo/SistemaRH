import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, User, Calendar, Check, X, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MentionService, MentionNotification } from '../services/mentionService';
import { AuditService } from '../services/auditService';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateClick?: (candidateId: string) => void;
}

interface SystemNotification {
  id: string;
  type: 'system' | 'mention' | 'reminder' | 'status_change';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onCandidateClick
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [mentions, setMentions] = useState<MentionNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'system'>('all');

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carregar menções
      const userMentions = await MentionService.getMentionNotifications(user.id);
      setMentions(userMentions);

      // Simular notificações do sistema (em produção, vir de um serviço real)
      const systemNotifications: SystemNotification[] = [
        {
          id: '1',
          type: 'system',
          title: 'Sistema atualizado',
          message: 'O sistema foi atualizado com novas funcionalidades de segurança.',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'reminder',
          title: 'Lembrete pendente',
          message: 'Você tem lembretes pendentes para hoje.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        }
      ];

      setNotifications(systemNotifications);
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMentionAsRead = async (notificationId: string) => {
    try {
      await MentionService.markNotificationAsRead(notificationId);
      setMentions(prev => prev.map(m => 
        m.id === notificationId ? { ...m, read: true } : m
      ));
    } catch (error) {
      console.error('❌ Erro ao marcar menção como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Marcar todas as menções como lidas
      const unreadMentions = mentions.filter(m => !m.read);
      for (const mention of unreadMentions) {
        await MentionService.markNotificationAsRead(mention.id);
      }
      
      setMentions(prev => prev.map(m => ({ ...m, read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
    }
  };

  const handleCandidateClick = (candidateId: string) => {
    if (onCandidateClick) {
      onCandidateClick(candidateId);
      onClose();
    }
  };

  const getAllNotifications = (): Array<SystemNotification | MentionNotification> => {
    const allNotifications: Array<SystemNotification | MentionNotification> = [];
    
    if (activeTab === 'all' || activeTab === 'mentions') {
      allNotifications.push(...mentions);
    }
    
    if (activeTab === 'all' || activeTab === 'system') {
      allNotifications.push(...notifications);
    }
    
    return allNotifications.sort((a, b) => {
      const dateA = 'createdAt' in a ? a.createdAt : a.timestamp;
      const dateB = 'createdAt' in b ? b.createdAt : b.timestamp;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const getNotificationIcon = (notification: SystemNotification | MentionNotification) => {
    if ('type' in notification && notification.type === 'mention') {
      return <MessageSquare className="w-4 h-4" />;
    }
    
    const systemNotification = notification as SystemNotification;
    switch (systemNotification.type) {
      case 'reminder':
        return <Bell className="w-4 h-4" />;
      case 'status_change':
        return <User className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (notification: SystemNotification | MentionNotification) => {
    if ('type' in notification && notification.type === 'mention') {
      return 'text-blue-600 dark:text-blue-400';
    }
    
    const systemNotification = notification as SystemNotification;
    switch (systemNotification.type) {
      case 'reminder':
        return 'text-orange-600 dark:text-orange-400';
      case 'status_change':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const allNotifications = getAllNotifications();
  const unreadCount = allNotifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden mt-16 mr-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificações
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                title="Marcar todas como lidas"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Todas ({allNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('mentions')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'mentions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Menções ({mentions.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'system'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Sistema ({notifications.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando...</span>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma notificação encontrada
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {allNotifications.map((notification) => {
                const isMention = 'candidateId' in notification;
                const timestamp = isMention ? notification.createdAt : notification.timestamp;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification)} bg-current bg-opacity-10`}>
                        {getNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        
                        {isMention && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleCandidateClick(notification.candidateId)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                            >
                              Ver candidato
                            </button>
                            {!notification.read && (
                              <button
                                onClick={() => markMentionAsRead(notification.id)}
                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 underline"
                              >
                                Marcar como lida
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;