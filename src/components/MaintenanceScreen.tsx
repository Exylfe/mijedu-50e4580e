import { motion } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import AdaptiveLogo from '@/components/AdaptiveLogo';

interface MaintenanceScreenProps {
  message?: string;
}

const MaintenanceScreen = ({ message = 'Mijedu is sleeping - Back soon' }: MaintenanceScreenProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        {/* Logo with sleeping animation */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [-2, 2, -2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative inline-block mb-8"
        >
          <AdaptiveLogo size="w-24 h-24" className="mx-auto opacity-70 grayscale" />
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <Moon className="w-8 h-8 text-neon-purple" />
          </motion.div>
          
          {/* Sleeping Z's */}
          <motion.div
            animate={{ 
              opacity: [0, 1, 0],
              y: [0, -20, -40],
              x: [0, 10, 20]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            className="absolute -top-4 right-0 text-neon-purple text-xl font-bold"
          >
            z
          </motion.div>
          <motion.div
            animate={{ 
              opacity: [0, 1, 0],
              y: [0, -25, -50],
              x: [0, 15, 30]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3
            }}
            className="absolute -top-8 right-4 text-neon-pink text-lg font-bold"
          >
            z
          </motion.div>
          <motion.div
            animate={{ 
              opacity: [0, 1, 0],
              y: [0, -30, -60],
              x: [0, 20, 40]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.6
            }}
            className="absolute -top-12 right-8 text-neon-purple/60 text-sm font-bold"
          >
            z
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold gradient-text mb-4">
            {message}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-neon-purple animate-pulse" />
            <p className="text-sm">We're making things better for you</p>
            <Sparkles className="w-4 h-4 text-neon-pink animate-pulse" />
          </div>
        </motion.div>

        {/* Progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MaintenanceScreen;