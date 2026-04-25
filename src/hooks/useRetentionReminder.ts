import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/notifications';

/**
 * Schedules a "We miss you!" local notification 48h after each
 * app foreground / login. Cancelled when the user signs out.
 */
export const useRetentionReminder = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      notify.cancelRetention();
      return;
    }

    notify.scheduleRetention();

    let removeListener: (() => void) | null = null;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null as any }));
        if (!Capacitor || !Capacitor.isNativePlatform?.()) return;
        const mod = await import('@capacitor/app').catch(() => null);
        if (!mod) return;
        const handle = await mod.App.addListener('appStateChange', (state: any) => {
          if (state.isActive) notify.scheduleRetention();
        });
        removeListener = () => handle?.remove?.();
      } catch (e) {
        console.warn('[retention] resume listener failed:', e);
      }
    })();

    return () => {
      removeListener?.();
    };
  }, [user?.id]);
};
