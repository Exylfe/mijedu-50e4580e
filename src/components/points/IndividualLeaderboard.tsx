import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIndividualLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { getLevel } from '@/utils/pointsSystem';

const RANK_STYLES = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20' },
  { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10 border-amber-700/20' },
];

const IndividualLeaderboard = () => {
  const { entries, loading } = useIndividualLeaderboard(50);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const level = getLevel(entry.points);
        const isCurrentUser = user?.id === entry.user_id;
        const rankStyle = index < 3 ? RANK_STYLES[index] : null;
        const RankIcon = rankStyle?.icon;

        return (
          <motion.button
            key={entry.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => navigate(`/profile/${entry.user_id}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
              isCurrentUser
                ? 'bg-primary/5 border-primary/20'
                : rankStyle
                  ? `${rankStyle.bg}`
                  : 'bg-card border-border hover:border-primary/20'
            }`}
          >
            {/* Rank */}
            <div className="w-8 flex-shrink-0 text-center">
              {RankIcon ? (
                <RankIcon className={`w-5 h-5 mx-auto ${rankStyle!.color}`} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">
                    {entry.nickname?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">
                  {entry.nickname}
                </span>
                {isCurrentUser && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">You</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate block">{entry.tribe}</span>
            </div>

            {/* Points */}
            <div className="flex-shrink-0 text-right">
              <span className="text-sm font-bold text-foreground">{entry.points.toFixed(1)}</span>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-[10px]">{level.badge}</span>
                <span className={`text-[10px] font-medium ${level.color}`}>{level.title}</span>
              </div>
            </div>
          </motion.button>
        );
      })}

      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No leaderboard data yet</p>
      )}
    </div>
  );
};

export default IndividualLeaderboard;
