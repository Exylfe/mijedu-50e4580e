import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type EntityType = 'tribe' | 'hub' | 'brand' | 'vendor';

interface UseEntityFollowOptions {
  entityId: string | undefined;
  entityType: EntityType;
}

export function useEntityFollow({ entityId, entityType }: UseEntityFollowOptions) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!entityId) return;

    // Fetch follower count
    const { count } = await supabase
      .from('entity_follows')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    setFollowerCount(count ?? 0);

    // Check if current user follows
    if (user) {
      const { data } = await supabase
        .from('entity_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();

      setIsFollowing(!!data);
    }
  }, [entityId, entityType, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Real-time updates for follower count
  useEffect(() => {
    if (!entityId) return;

    const channel = supabase
      .channel(`follows-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entity_follows',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, fetchStatus]);

  const follow = useCallback(async () => {
    if (!user || !entityId || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('entity_follows')
        .insert({ user_id: user.id, entity_id: entityId, entity_type: entityType });

      if (!error) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [user, entityId, entityType, loading]);

  const unfollow = useCallback(async () => {
    if (!user || !entityId || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('entity_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  }, [user, entityId, entityType, loading]);

  const toggleFollow = useCallback(() => {
    return isFollowing ? unfollow() : follow();
  }, [isFollowing, follow, unfollow]);

  return {
    isFollowing,
    followerCount,
    loading,
    follow,
    unfollow,
    toggleFollow,
  };
}
