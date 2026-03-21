import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from '@/components/NotificationPanel';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: isOpen ? 'hsl(var(--primary) / 0.1)' : 'transparent',
        }}
      >
        <Bell className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
