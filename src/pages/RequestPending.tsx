import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Sparkles, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import WaitingRoomTips from '@/components/WaitingRoomTips';
import AcademicLevelBadge from '@/components/AcademicLevelBadge';

const RequestPending = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect when verified (profile updates in real-time)
  useEffect(() => {
    if (!isLoading && profile?.is_verified) {
      navigate('/feed');
    }
  }, [profile, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <AdaptiveLogo size="w-20 h-20" className="mx-auto mb-4" />
        </div>

        {/* Digital ID Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl mb-6 grayscale-[50%]"
        >
          {/* Card gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/60" />
          
          {/* Verification in Progress watermark */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="border-2 border-amber-400/60 rounded-lg px-4 py-2 transform rotate-[-12deg]"
            >
              <span className="text-amber-300/80 text-sm font-bold uppercase tracking-widest">
                Verification in Progress
              </span>
            </motion.div>
          </div>

          {/* Holographic pattern */}
          <div className="absolute inset-0 opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
          </div>

          <div className="relative p-5">
            {/* Card header */}
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-white/80" />
              <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Mijedu Student ID — Preview</span>
            </div>

            <div className="flex items-start gap-4">
              {/* Avatar placeholder */}
              <div className="w-16 h-20 rounded-lg border-2 border-white/20 bg-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/50">
                  {profile?.nickname?.[0]?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1.5">
                <h3 className="text-lg font-bold text-white/90">{profile?.nickname || 'Student'}</h3>
                <p className="text-white/60 text-xs">{profile?.tribe || 'Tribe'}</p>
                {profile?.academic_level && (
                  <AcademicLevelBadge level={profile.academic_level} size="sm" />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex gap-0.5">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/20 rounded-full"
                    style={{ width: '2px', height: '12px' }}
                  />
                ))}
              </div>
              <span className="text-white/30 text-[9px] font-mono">PENDING</span>
            </div>
          </div>
        </motion.div>

        {/* Status info */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3"
          >
            <Clock className="w-7 h-7 text-amber-500" />
          </motion.div>

          <h1 className="text-xl font-bold text-foreground mb-2">
            Waiting for {profile?.tribe ? <span className="text-primary">{profile.tribe}</span> : 'Tribe'} Approval
          </h1>
          <p className="text-sm text-muted-foreground">
            Your request to join <span className="text-primary font-medium">{profile?.tribe || 'your tribe'}</span> is being reviewed by the Tribe Admin.
          </p>
        </div>

        {/* Status card */}
        <div className="gradient-border rounded-xl overflow-hidden mb-6">
          <div className="bg-card p-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Verification Pending</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-500"
              />
              <span className="text-muted-foreground text-sm">
                Tribe: <span className="text-foreground">{profile?.tribe}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tips Carousel */}
        <WaitingRoomTips />

        {/* Auto-refresh info */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-6">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>This page will auto-refresh when approved</span>
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
      </motion.div>
    </div>
  );
};

export default RequestPending;
