import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        // Dynamically import Capacitor core to detect platform safely
        const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null as any }));
        if (!Capacitor || !Capacitor.isNativePlatform?.()) return;

        // Dynamically import push plugin — if missing/unconfigured, fail silently
        const mod = await import('@capacitor/push-notifications').catch((e) => {
          console.warn('[push] plugin unavailable:', e);
          return null;
        });
        if (!mod || !mounted) return;

        const { PushNotifications } = mod;

        const permResult = await PushNotifications.requestPermissions().catch((e) => {
          console.warn('[push] requestPermissions failed:', e);
          return null;
        });
        if (!permResult || permResult.receive !== 'granted') return;

        await PushNotifications.register().catch((e) => {
          console.warn('[push] register failed (likely missing google-services.json):', e);
        });

        const regListener = await PushNotifications.addListener('registration', async (token) => {
          if (!mounted) return;
          try {
            await supabase
              .from('profiles')
              .update({ push_token: token.value } as any)
              .eq('user_id', user.id);
          } catch (e) {
            console.warn('[push] save token failed:', e);
          }
        }).catch(() => null);

        const recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          if (!mounted) return;
          toast(notification.title || 'New notification', {
            description: notification.body,
          });
        }).catch(() => null);

        const tapListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          if (!mounted) return;
          const data = action.notification.data;
          if (data?.route) navigate(data.route);
        }).catch(() => null);

        cleanup = () => {
          regListener?.remove?.();
          recvListener?.remove?.();
          tapListener?.remove?.();
        };
      } catch (err) {
        console.warn('[push] init failed (non-fatal):', err);
      }
    };

    setup();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [user?.id, navigate]);
};
