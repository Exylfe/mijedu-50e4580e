import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

const ROOT_TABS = ['/feed', '/explore', '/tribe-feed', '/market', '/settings'];

export const useBackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const exitPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      const path = location.pathname;
      const isRootTab = ROOT_TABS.includes(path);

      if (!isRootTab) {
        window.history.back();
        return;
      }

      // On a root tab but not /feed → go to feed
      if (path !== '/feed') {
        navigate('/feed', { replace: true });
        return;
      }

      // On /feed → double-tap to exit
      if (exitPressedRef.current) {
        App.exitApp();
        return;
      }

      exitPressedRef.current = true;
      toast('Press back again to exit', { duration: 2000 });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        exitPressedRef.current = false;
      }, 2000);
    });

    return () => {
      listener.then((l) => l.remove());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, navigate]);
};
