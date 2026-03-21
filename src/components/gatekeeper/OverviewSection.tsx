import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Users, TrendingUp, Flag, Shield } from 'lucide-react';
import GlassCard from './GlassCard';
import BrandPerformanceSection from './BrandPerformanceSection';
import RoomLifecycleCard from './RoomLifecycleCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface OverviewSectionProps {
  pendingCount: number;
  verifiedCount: number;
  totalUsers: number;
  flaggedCount: number;
  tribesCount?: number;
  showBrandPerformance?: boolean;
  onPendingClick?: () => void;
  isLive?: boolean;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const OverviewSection = ({ 
  pendingCount, 
  verifiedCount, 
  totalUsers, 
  flaggedCount,
  tribesCount = 0,
  showBrandPerformance = false,
  onPendingClick,
  isLive = true
}: OverviewSectionProps) => {
  const [growthData, setGrowthData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const fetchGrowth = async () => {
      // Get signups from the last 7 days grouped by day of week
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!error && data) {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        data.forEach(row => {
          const day = new Date(row.created_at).getDay();
          counts[day]++;
        });
        // Reorder to start from today - 6 days
        const today = new Date().getDay();
        const reordered = [];
        for (let i = 6; i >= 0; i--) {
          reordered.push(counts[(today - i + 7) % 7]);
        }
        setGrowthData(reordered);
      }
    };
    fetchGrowth();
  }, []);

  const maxGrowth = Math.max(...growthData, 1);
  const todayIndex = new Date().getDay();
  const orderedLabels = [];
  for (let i = 6; i >= 0; i--) {
    orderedLabels.push(DAY_LABELS[(todayIndex - i + 7) % 7]);
  }

  const stats = [
    { 
      label: 'Pending', value: pendingCount, icon: Clock, 
      color: 'text-amber-500', bgColor: 'bg-amber-500/10',
      trend: pendingCount > 0 ? 'Needs attention' : 'All clear'
    },
    { 
      label: 'Verified', value: verifiedCount, icon: CheckCircle2, 
      color: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
      trend: `${Math.round((verifiedCount / totalUsers) * 100) || 0}% approval rate`
    },
    { 
      label: 'Total Users', value: totalUsers, icon: Users, 
      color: 'text-primary', bgColor: 'bg-primary/10',
      trend: 'Community size'
    },
    { 
      label: 'Flagged', value: flaggedCount, icon: Flag, 
      color: 'text-destructive', bgColor: 'bg-destructive/10',
      trend: flaggedCount > 0 ? 'Review needed' : 'No issues'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
              <p className="text-sm text-muted-foreground">Monitor your community at a glance</p>
            </div>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 mt-4 text-xs text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live data from database</span>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.value > 0 && stat.label === 'Pending' && onPendingClick && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-medium animate-pulse">
                      Action needed
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{stat.trend}</span>
                </div>
                {stat.label === 'Pending' && onPendingClick && stat.value > 0 && (
                  <Button size="sm" variant="outline" onClick={onPendingClick} className="mt-2 w-full text-xs h-7">
                    View Queue
                  </Button>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Real Growth Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Community Growth (Last 7 Days)</h3>
          <div className="h-24 flex items-end justify-around gap-2">
            {growthData.map((count, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {count > 0 ? count : ''}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((count / maxGrowth) * 100, 4)}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-primary/60 to-secondary/60 rounded-t-lg min-h-[3px]"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            {orderedLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Room Lifecycle Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <RoomLifecycleCard />
      </motion.div>

      {/* Brand Performance Summary - Super Admin only */}
      {showBrandPerformance && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <BrandPerformanceSection />
        </motion.div>
      )}
    </div>
  );
};

export default OverviewSection;
