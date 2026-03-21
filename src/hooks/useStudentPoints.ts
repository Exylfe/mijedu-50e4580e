import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getLevel, getLevelProgress, getUnlockedPerks, getNextPerk } from '@/utils/pointsSystem';

export function useStudentPoints(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;

    const fetchPoints = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('user_id', targetId)
        .single();
      if (data) setPoints(Number(data.points) || 0);
      setLoading(false);
    };

    fetchPoints();

    // Real-time subscription on profiles table for this user
    const channel = supabase
      .channel(`points-${targetId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${targetId}`,
      }, (payload) => {
        const newPoints = Number((payload.new as any).points) || 0;
        setPoints(newPoints);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [targetId]);

  const level = getLevel(points);
  const progress = getLevelProgress(points);
  const unlockedPerks = getUnlockedPerks(points);
  const nextPerk = getNextPerk(points);

  return { points, level, progress, unlockedPerks, nextPerk, loading };
}
