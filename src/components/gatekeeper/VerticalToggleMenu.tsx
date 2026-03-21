import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleMenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface VerticalToggleMenuProps {
  items: ToggleMenuItem[];
  triggerIcon: React.ComponentType<{ className?: string }>;
  className?: string;
}

const VerticalToggleMenu = ({
  items,
  triggerIcon: TriggerIcon,
  className,
}: VerticalToggleMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <TriggerIcon className={cn(
          'w-5 h-5 transition-transform duration-300',
          isOpen ? 'rotate-90 text-primary' : 'text-muted-foreground'
        )} />
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-0 flex flex-col gap-2 p-2 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-primary/20 group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                  title={item.label}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-colors',
                    item.color || 'text-muted-foreground group-hover:text-primary'
                  )} />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerticalToggleMenu;
