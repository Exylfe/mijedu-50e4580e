import { motion } from 'framer-motion';
import { Flame, ChevronRight, Lock, Unlock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useStudentPoints } from '@/hooks/useStudentPoints';
import { PERKS } from '@/utils/pointsSystem';

interface StudentPointsCardProps {
  userId?: string;
  compact?: boolean;
}

const StudentPointsCard = ({ userId, compact = false }: StudentPointsCardProps) => {
  const { points, level, progress, unlockedPerks, nextPerk, loading } = useStudentPoints(userId);

  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-1/2 mb-2" />
        <div className="h-2 bg-muted rounded w-full" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
        <span className="text-lg">{level.badge}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${level.color}`}>{level.title}</span>
            <span className="text-xs text-muted-foreground">{points.toFixed(1)} pts</span>
          </div>
          <Progress value={progress} className="h-1.5 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Engagement Score</h3>
          </div>
          <span className="text-lg">{level.badge}</span>
        </div>

        <div className="flex items-end gap-2 mb-1">
          <span className="text-3xl font-bold text-foreground">{points.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground pb-1">points</span>
        </div>

        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className={`font-semibold ${level.color}`}>Lv.{level.level} {level.title}</span>
          {level.maxPoints !== Infinity && (
            <span className="text-muted-foreground">
              {level.maxPoints - points > 0 ? `${(level.maxPoints - points).toFixed(1)} to next` : 'Max!'}
            </span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Perks */}
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Perks & Rewards</p>
        <div className="grid grid-cols-3 gap-2">
          {PERKS.map((perk) => {
            const unlocked = points >= perk.threshold;
            return (
              <div
                key={perk.threshold}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-colors ${
                  unlocked
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50 border border-border opacity-50'
                }`}
              >
                <span className="text-base">{perk.icon}</span>
                <span className="text-[10px] font-medium text-foreground leading-tight">{perk.label}</span>
                {unlocked ? (
                  <Unlock className="w-3 h-3 text-primary" />
                ) : (
                  <span className="text-[9px] text-muted-foreground">{perk.threshold} pts</span>
                )}
              </div>
            );
          })}
        </div>
        {nextPerk && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Next: <span className="font-medium text-foreground">{nextPerk.icon} {nextPerk.label}</span> at {nextPerk.threshold} pts
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StudentPointsCard;
