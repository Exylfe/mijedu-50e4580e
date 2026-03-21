import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Sparkles, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import { Button } from '@/components/ui/button';

interface Tribe {
  id: string;
  name: string;
  type: string;
}

const TribePending = () => {
  const { user, profile, isLoading, isSuperAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingTribes, setLoadingTribes] = useState(true);

  const needsTribeSelection = profile && !profile.tribe_id;
  const awaitingVerification = profile && profile.tribe_id && !profile.is_verified;

  // Redirect verified users to feed
  useEffect(() => {
    if (!isLoading && profile?.is_verified) {
      console.log('[TribePending] User verified, redirecting to /feed');
      navigate('/feed', { replace: true });
    }
    if (!isLoading && isSuperAdmin) {
      navigate('/gatekeeper', { replace: true });
    }
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [profile, isLoading, isSuperAdmin, user, navigate]);

  // Fetch available tribes
  useEffect(() => {
    const fetchTribes = async () => {
      const { data, error } = await supabase
        .from('tribes')
        .select('id, name, type')
        .eq('is_visible', true)
        .order('name');

      if (!error && data) {
        setTribes(data);
      }
      setLoadingTribes(false);
    };
    fetchTribes();
  }, []);

  const handleSelectTribe = async () => {
    if (!selectedTribe || !user) return;
    setSaving(true);

    const tribe = tribes.find(t => t.id === selectedTribe);

    const { error } = await supabase
      .from('profiles')
      .update({
        tribe_id: selectedTribe,
        tribe: tribe?.name || null,
        tribe_type: tribe?.type || 'college',
        is_verified: false,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('[TribePending] Failed to save tribe:', error);
    } else {
      console.log('[TribePending] Tribe selected:', tribe?.name);
      await refreshProfile();
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        <AdaptiveLogo size="w-16 h-16" className="mx-auto mb-6" />

        {/* === TRIBE SELECTION STATE === */}
        {needsTribeSelection && (
          <>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5"
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              Select Your Tribe
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Choose the tribe you belong to. A tribe admin will verify your membership.
            </p>

            {loadingTribes ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {tribes.map((tribe) => (
                  <button
                    key={tribe.id}
                    onClick={() => setSelectedTribe(tribe.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      selectedTribe === tribe.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium block">{tribe.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{tribe.type}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-colors ${
                      selectedTribe === tribe.id ? 'text-primary' : 'text-muted-foreground/40'
                    }`} />
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleSelectTribe}
              disabled={!selectedTribe || saving}
              className="w-full mb-4"
            >
              {saving ? 'Saving...' : 'Join Tribe'}
            </Button>
          </>
        )}

        {/* === AWAITING VERIFICATION STATE === */}
        {awaitingVerification && (
          <>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5"
            >
              <Clock className="w-8 h-8 text-amber-500" />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              Waiting for Approval
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your request to join{' '}
              <span className="text-primary font-semibold">
                {profile?.tribe || 'your tribe'}
              </span>{' '}
              is being reviewed by the Tribe Admin.
            </p>

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
                  Tribe: <span className="text-foreground font-medium">{profile?.tribe || '—'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-6">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>This page updates automatically when approved</span>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
          </>
        )}

        <Button
          variant="ghost"
          onClick={signOut}
          className="text-muted-foreground hover:text-destructive text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default TribePending;
