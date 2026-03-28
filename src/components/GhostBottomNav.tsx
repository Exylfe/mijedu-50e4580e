import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, MessageCircle, Store } from 'lucide-react';

export type NavItem = 'home' | 'discover' | 'chat' | 'market';

interface GhostBottomNavProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
  isVisible: boolean;
}

const navItems: { id: NavItem; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Feed' },
  { id: 'discover', icon: Compass, label: 'Explore' },
  { id: 'chat', icon: MessageCircle, label: 'Tribe' },
  { id: 'market', icon: Store, label: 'Bwalo' },
];

const GhostBottomNav = ({ activeItem, onItemClick, isVisible }: GhostBottomNavProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
        >
          {/* Subtle gradient fade for content readability */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          {/* Ghost nav content - floating icons */}
          <div className="relative flex items-center justify-around px-4 py-4 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = activeItem === item.id;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] min-w-[44px]"
                >
                  {/* Ghost glow effect for active item */}
                  {isActive && (
                    <motion.div
                      layoutId="ghostNavGlow"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--secondary) / 0.15))',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Icon with scale animation */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}
                  >
                    <Icon
                      className="w-6 h-6 transition-all duration-200"
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                  </motion.div>

                  {/* Label - only show for active */}
                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0.5,
                      y: isActive ? 0 : 2,
                    }}
                    className={`relative z-10 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                  >
                    {item.label}
                  </motion.span>

                  {/* Market notification dot */}
                  {item.id === 'market' && (
                    <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default GhostBottomNav;
