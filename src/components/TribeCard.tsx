import { motion } from 'framer-motion';
import { GraduationCap, Mic, Users } from 'lucide-react';

export interface Tribe {
  id: string;
  name: string;
  type: 'college' | 'media';
  members?: number;
  description?: string;
}

interface TribeCardProps {
  tribe: Tribe;
  index: number;
  onClick: (tribe: Tribe) => void;
}

const TribeCard = ({ tribe, index, onClick }: TribeCardProps) => {
  const isCollege = tribe.type === 'college';
  const Icon = isCollege ? GraduationCap : Mic;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tribe)}
      className="group relative w-full p-4 gradient-border rounded-xl overflow-hidden text-left transition-all duration-300 hover:glow-combined"
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

      {/* Content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon container */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
          ${isCollege 
            ? 'bg-gradient-to-br from-neon-purple/20 to-neon-purple/5' 
            : 'bg-gradient-to-br from-neon-pink/20 to-neon-pink/5'
          }
        `}>
          <Icon className={`w-6 h-6 ${isCollege ? 'text-neon-purple' : 'text-neon-pink'}`} />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base group-hover:gradient-text transition-all duration-300">
            {tribe.name}
          </h3>
          {tribe.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {tribe.description}
            </p>
          )}
          {tribe.members && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{tribe.members.toLocaleString()} members</span>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.div
            initial={{ x: -4 }}
            whileHover={{ x: 0 }}
            className="text-muted-foreground"
          >
            →
          </motion.div>
        </div>
      </div>

      {/* Type badge */}
      <div className={`
        absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider
        ${isCollege 
          ? 'bg-neon-purple/10 text-neon-purple' 
          : 'bg-neon-pink/10 text-neon-pink'
        }
      `}>
        {isCollege ? 'College' : 'Hub'}
      </div>
    </motion.button>
  );
};

export default TribeCard;
