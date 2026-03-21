import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Activity, Clock, BarChart3, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GlassCard from './GlassCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RoomStats {
  total_rooms: number;
  active_rooms: number;
  expired_rooms: number;
  average_room_lifespan_hours: number;
  average_messages_per_room: number;
}

const RoomLifecycleCard = () => {
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc('get_room_lifecycle_stats');

      if (!error && data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        setStats({
          total_rooms: parsed.total_rooms ?? 0,
          active_rooms: parsed.active_rooms ?? 0,
          expired_rooms: parsed.expired_rooms ?? 0,
          average_room_lifespan_hours: Math.round(parsed.average_room_lifespan_hours ?? 0),
          average_messages_per_room: Math.round(parsed.average_messages_per_room ?? 0),
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!stats) return null;

  const activePercent = stats.total_rooms > 0
    ? Math.round((stats.active_rooms / stats.total_rooms) * 100)
    : 0;

  const items = [
    { label: 'Total Rooms', value: stats.total_rooms, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active', value: stats.active_rooms, icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Expired', value: stats.expired_rooms, icon: WifiOff, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Avg Lifespan', value: `${stats.average_room_lifespan_hours}h`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Room Lifecycle</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{activePercent}% active</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`${item.bg} rounded-xl p-3 flex flex-col gap-1`}
            >
              <Icon className={`w-4 h-4 ${item.color}`} />
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Avg messages bar */}
      <div className="flex items-center gap-3 px-1">
        <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Avg messages / room</span>
            <span className="font-medium text-foreground">{stats.average_messages_per_room}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Number(stats.average_messages_per_room) * 2, 100)}%` }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary/60 to-secondary/60 rounded-full"
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default RoomLifecycleCard;
