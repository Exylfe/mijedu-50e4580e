import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  tribe: string;
  points: number;
  avatar_url: string | null;
  academic_level: string | null;
}

export interface TribeLeaderboardEntry {
  tribe: string;
  total_points: number;
  member_count: number;
}

export function useIndividualLeaderboard(limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe, points, avatar_url, academic_level')
      .eq('is_verified', true)
      .order('points', { ascending: false })
      .limit(limit);

    if (data) {
      setEntries(data.map(d => ({ ...d, points: Number(d.points) || 0 })) as LeaderboardEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    // Refresh leaderboard on profile points changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => { fetch(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { entries, loading, refetch: fetch };
}

export function useTribeLeaderboard(limit = 10) {
  const [entries, setEntries] = useState<TribeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Aggregate points by tribe using RPC or manual grouping
      const { data } = await supabase
        .from('profiles')
        .select('tribe, points')
        .eq('is_verified', true)
        .not('tribe', 'is', null);

      if (data) {
        const tribeMap = new Map<string, { total: number; count: number }>();
        data.forEach((p: any) => {
          const tribe = p.tribe as string;
          const pts = Number(p.points) || 0;
          const existing = tribeMap.get(tribe) || { total: 0, count: 0 };
          tribeMap.set(tribe, { total: existing.total + pts, count: existing.count + 1 });
        });

        const sorted = Array.from(tribeMap.entries())
          .map(([tribe, { total, count }]) => ({
            tribe,
            total_points: total,
            member_count: count,
          }))
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, limit);

        setEntries(sorted);
      }
      setLoading(false);
    };

    fetch();
  }, [limit]);

  return { entries, loading };
}
