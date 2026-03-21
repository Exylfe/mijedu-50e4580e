import { motion } from 'framer-motion';
import { Clock, Shield, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const PendingVerificationOverlay = () => {
  const { profile, isSuperAdmin, signOut } = useAuth();

  // Don't show for super admins or verified users
  if (isSuperAdmin || !profile || profile.is_verified) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5"
        >
          <Clock className="w-8 h-8 text-amber-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pending Verification
        </h1>

        <p className="text-muted-foreground text-sm mb-6">
          Your request to join{' '}
          <span className="text-primary font-semibold">
            {profile.tribe || 'your tribe'}
          </span>{' '}
          is being reviewed by the Tribe Admin.
        </p>

        {/* Status card */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium text-sm">Verification Pending</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-amber-500"
            />
            <span className="text-muted-foreground text-xs">
              Tribe: <span className="text-foreground font-medium">{profile.tribe || '—'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>This updates automatically when approved</span>
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>

        <Button
          variant="ghost"
          onClick={signOut}
          className="text-muted-foreground hover:text-destructive text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PendingVerificationOverlay;
