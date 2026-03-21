import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthCallback] Error:', error);
        navigate('/auth', { replace: true });
        return;
      }

      let activeSession = session;

      if (!activeSession) {
        const { data } = await supabase.auth.refreshSession();
        activeSession = data.session;
      }

      if (!activeSession) {
        console.log('[AuthCallback] No session found, redirecting to /auth');
        navigate('/auth', { replace: true });
        return;
      }

      // Check profile for tribe assignment and verification
      const { data: profile } = await supabase
        .from('profiles')
        .select('tribe_id, is_verified')
        .eq('user_id', activeSession.user.id)
        .maybeSingle();

      if (!profile || !profile.tribe_id || !profile.is_verified) {
        console.log('[AuthCallback] User needs tribe selection or verification, redirecting to /pending');
        navigate('/pending', { replace: true });
      } else {
        console.log('[AuthCallback] Verified user, redirecting to /feed');
        navigate('/feed', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallback;
