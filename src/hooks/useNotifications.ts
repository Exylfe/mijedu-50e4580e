import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/notifications';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  entity_type: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor_nickname?: string;
  actor_avatar?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        // Fetch actor profiles in batch
        const actorIds = [...new Set(data.filter(n => n.actor_id).map(n => n.actor_id!))];
        let profileMap: Record<string, { nickname: string; avatar_url: string | null }> = {};

        if (actorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', actorIds);

          if (profiles) {
            profileMap = Object.fromEntries(
              profiles.map(p => [p.user_id, { nickname: p.nickname || 'User', avatar_url: p.avatar_url }])
            );
          }
        }

        const enriched: Notification[] = data.map(n => ({
          ...n,
          actor_nickname: n.actor_id ? profileMap[n.actor_id]?.nickname || 'Someone' : 'System',
          actor_avatar: n.actor_id ? profileMap[n.actor_id]?.avatar_url || undefined : undefined,
        }));

        setNotifications(enriched);
        setUnreadCount(enriched.filter(n => !n.is_read).length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channelName = `user-notifications-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;

          // Enrich with actor profile
          if (newNotif.actor_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('user_id', newNotif.actor_id)
              .maybeSingle();

            if (profile) {
              newNotif.actor_nickname = profile.nickname || 'Someone';
              newNotif.actor_avatar = profile.avatar_url || undefined;
            }
          } else {
            newNotif.actor_nickname = 'System';
          }

          // Mirror to a native local notification (no-op on web / missing plugin)
          try {
            const actor = newNotif.actor_nickname || 'Someone';
            switch (newNotif.type) {
              case 'comment':
              case 'reply':
                notify.newComment(actor);
                break;
              case 'follow':
              case 'follower':
                notify.newFollower(actor);
                break;
              case 'verification_approved':
              case 'verified':
                notify.verified();
                break;
            }
          } catch (e) {
            console.warn('[notify] mirror failed:', e);
          }

          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
