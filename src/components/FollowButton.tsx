import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntityFollow, EntityType } from '@/hooks/useEntityFollow';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  entityId: string | undefined;
  entityType: EntityType;
  showCount?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

const FollowButton = ({ entityId, entityType, showCount = true, size = 'sm', className }: FollowButtonProps) => {
  const { user } = useAuth();
  const { isFollowing, followerCount, loading, toggleFollow } = useEntityFollow({ entityId, entityType });
  const [isHovered, setIsHovered] = useState(false);

  if (!user) return null;

  const showUnfollow = isFollowing && isHovered;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          size={size}
          variant={isFollowing ? "outline" : "default"}
          onClick={toggleFollow}
          disabled={loading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "transition-all duration-200 gap-1.5",
            isFollowing && !showUnfollow && "border-primary/30 text-primary",
            showUnfollow && "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <AnimatePresence mode="wait">
            {showUnfollow ? (
              <motion.span
                key="unfollow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                Unfollow
              </motion.span>
            ) : isFollowing ? (
              <motion.span
                key="following"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Following
              </motion.span>
            ) : (
              <motion.span
                key="follow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Follow
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {showCount && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" />
          {followerCount.toLocaleString()}
        </span>
      )}
    </div>
  );
};

export default FollowButton;
