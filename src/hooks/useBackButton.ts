import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ROOT_TABS = ['/feed', '/explore', '/tribe-feed', '/market', '/settings'];

export const useBackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const exitPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let listenerHandle: any = null;
    let cancelled = false;

    const setup = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null as any }));
        if (!Capacitor || !Capacitor.isNativePlatform?.()) return;

        const mod = await import('@capacitor/app').catch((e) => {
          console.warn('[backButton] @capacitor/app unavailable:', e);
          return null;
        });
        if (!mod || cancelled) return;

        const { App } = mod;

        listenerHandle = await App.addListener('backButton', () => {
          const path = location.pathname;
          const isRootTab = ROOT_TABS.includes(path);

          if (!isRootTab) {
            window.history.back();
            return;
          }

          if (path !== '/feed') {
            navigate('/feed', { replace: true });
            return;
          }

          if (exitPressedRef.current) {
            App.exitApp().catch(() => {});
            return;
          }

          exitPressedRef.current = true;
          toast('Press back again to exit', { duration: 2000 });

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            exitPressedRef.current = false;
          }, 2000);
        }).catch((e: any) => {
          console.warn('[backButton] addListener failed:', e);
          return null;
        });
      } catch (err) {
        console.warn('[backButton] init failed (non-fatal):', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      try {
        listenerHandle?.remove?.();
      } catch {}
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, navigate]);
};
