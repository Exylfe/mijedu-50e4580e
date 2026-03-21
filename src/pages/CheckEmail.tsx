import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AdaptiveLogo from '@/components/AdaptiveLogo';

const CheckEmail = () => {
  const navigate = useNavigate();
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    // If already confirmed, redirect
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        navigate('/feed', { replace: true });
      }
    };
    checkSession();

    // Poll every 5 seconds for email confirmation
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval);
        setIsPolling(false);
        navigate('/feed', { replace: true });
        return;
      }

      // Try refreshing session to pick up confirmation
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.user?.email_confirmed_at) {
        clearInterval(interval);
        setIsPolling(false);
        navigate('/feed', { replace: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <AdaptiveLogo size="w-16 h-16" className="mx-auto mb-6" />

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <Mail className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
        <p className="text-muted-foreground mb-2">
          We've sent a verification link to your email address.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          Click the link in the email to activate your account. This page will redirect automatically once verified.
        </p>

        {isPolling && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Waiting for verification…</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckEmail;
