import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let mounted = true;

    const setup = async () => {
      try {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        await PushNotifications.register();

        await PushNotifications.addListener('registration', async (token) => {
          if (!mounted) return;
          // Save FCM token to profile
          await supabase
            .from('profiles')
            .update({ push_token: token.value } as any)
            .eq('user_id', user.id);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          if (!mounted) return;
          toast(notification.title || 'New notification', {
            description: notification.body,
          });
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          if (!mounted) return;
          const data = action.notification.data;
          if (data?.route) {
            navigate(data.route);
          }
        });
      } catch (err) {
        console.warn('Push notifications not available:', err);
      }
    };

    setup();

    return () => {
      mounted = false;
      PushNotifications.removeAllListeners();
    };
  }, [user?.id, navigate]);
};
