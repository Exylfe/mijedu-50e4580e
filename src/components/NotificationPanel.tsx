import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, MessageSquare, Flame, Megaphone, User, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, typeof Flame> = {
  reaction: Flame,
  comment: MessageSquare,
  mention: User,
  follower: User,
  system: Megaphone,
};

const typeColors: Record<string, string> = {
  reaction: 'text-orange-500',
  comment: 'text-primary',
  mention: 'text-blue-500',
  follower: 'text-green-500',
  system: 'text-amber-500',
};

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const navigate = useNavigate();
  const Icon = typeIcons[notification.type] || Bell;
  const color = typeColors[notification.type] || 'text-muted-foreground';

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id);
    if (notification.entity_id && notification.entity_type === 'post') {
      navigate('/feed');
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-muted/50 ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
    >
      {/* Avatar / Icon */}
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {notification.actor_avatar ? (
          <img src={notification.actor_avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon className={`w-4 h-4 ${color}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{notification.actor_nickname}</span>{' '}
          <span className="text-muted-foreground">{notification.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </motion.button>
  );
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '0.5px solid hsl(var(--border) / 0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-7 px-2 text-muted-foreground"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    All read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="max-h-96">
              <div className="p-2">
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
