import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { useTribeLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];

const TribeLeaderboard = () => {
  const { entries, loading } = useTribeLeaderboard(10);
  const { profile } = useAuth();
  const userTribe = profile?.tribe;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const maxPoints = entries[0]?.total_points || 1;

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const isUserTribe = entry.tribe === userTribe;
        const barWidth = (entry.total_points / maxPoints) * 100;

        return (
          <motion.div
            key={entry.tribe}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`relative overflow-hidden rounded-xl border p-4 ${
              isUserTribe ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
            }`}
          >
            {/* Progress bar background */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-500"
              style={{ width: `${barWidth}%` }}
            />

            <div className="relative flex items-center gap-3">
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {index < 3 ? (
                  <Trophy className={`w-5 h-5 mx-auto ${MEDAL_COLORS[index]}`} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{entry.tribe}</span>
                  {isUserTribe && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Your Tribe</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{entry.member_count} members</span>
                </div>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <span className="text-sm font-bold text-foreground">{entry.total_points.toFixed(1)}</span>
                <p className="text-[10px] text-muted-foreground">total pts</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No tribe data yet</p>
      )}
    </div>
  );
};

export default TribeLeaderboard;
