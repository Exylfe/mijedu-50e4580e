import { motion } from 'framer-motion';
import { Home, Compass, MessageCircle, Store } from 'lucide-react';

export type NavItem = 'home' | 'discover' | 'chat' | 'market';

interface BottomNavProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
}

const navItems: { id: NavItem; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Feed' },
  { id: 'discover', icon: Compass, label: 'Explore' },
  { id: 'chat', icon: MessageCircle, label: 'Tribe' },
  { id: 'market', icon: Store, label: 'Bwalo' },
];

const BottomNav = ({ activeItem, onItemClick }: BottomNavProps) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
    >
      {/* Clean background with subtle border */}
      <div className="absolute inset-0 bg-background border-t border-border" />

      {/* Nav content */}
      <div className="relative flex items-center justify-around px-2 py-3 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className={`relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>

              {/* Market badge */}
              {item.id === 'market' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
