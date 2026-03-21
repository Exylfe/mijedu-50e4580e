import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '@/components/SplashScreen';
import TribeCard, { Tribe } from '@/components/TribeCard';
import BottomNav from '@/components/BottomNav';
import VerificationGate from '@/components/VerificationGate';
import { useAuth } from '@/contexts/AuthContext';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import { LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const colleges: Tribe[] = [
  { id: 'university-a', name: 'University Tribe A', type: 'college', members: 2340, description: 'Premier academic institution community' },
  { id: 'university-b', name: 'University Tribe B', type: 'college', members: 4520, description: 'Leading research university network' },
  { id: 'university-c', name: 'University Tribe C', type: 'college', members: 1890, description: 'Innovation and technology campus' },
  { id: 'university-d', name: 'University Tribe D', type: 'college', members: 1650, description: 'Agricultural sciences community' },
  { id: 'university-e', name: 'University Tribe E', type: 'college', members: 2100, description: 'Northern campus collective' },
];

const mediaHubs: Tribe[] = [
  { id: 'media-alpha', name: 'Media Hub Alpha', type: 'media', members: 890, description: 'Premium content creators collective' },
  { id: 'media-beta', name: 'Media Hub Beta', type: 'media', members: 560, description: 'Exclusive influencer network' },
  { id: 'media-gamma', name: 'Media Hub Gamma', type: 'media', members: 720, description: 'Elite media professionals hub' },
];

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('home');
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const { user, profile, isLoading, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect verified users or super admins to feed
  useEffect(() => {
    if (!isLoading && (isSuperAdmin || profile?.is_verified)) {
      navigate('/feed', { replace: true });
    }
  }, [profile, isLoading, isSuperAdmin, navigate]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Show loading while checking auth - prevents flash of tribe page
  if (isLoading || isSuperAdmin || profile?.is_verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleTribeClick = (tribe: Tribe) => {
    setSelectedTribe(tribe);
  };

  const handleCloseGate = () => {
    setSelectedTribe(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pb-24"
      >
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <AdaptiveLogo size="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold gradient-text">Mijedu</h1>
                <p className="text-xs text-muted-foreground">Tribe Directory</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/gatekeeper')}
                  className="text-neon-purple"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              )}
              {!user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-neon-purple"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 py-6">
          {/* Welcome section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Find Your Tribe
            </h2>
            <p className="text-muted-foreground text-sm">
              Join exclusive communities. Connect with your people.
            </p>
          </motion.section>

          {/* Colleges section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-neon-purple to-neon-purple/30 rounded-full" />
              <h3 className="text-lg font-semibold text-foreground">Colleges</h3>
              <span className="ml-auto text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                {colleges.length} tribes
              </span>
            </div>
            <div className="grid gap-3">
              {colleges.map((tribe, index) => (
                <TribeCard
                  key={tribe.id}
                  tribe={tribe}
                  index={index}
                  onClick={handleTribeClick}
                />
              ))}
            </div>
          </motion.section>

          {/* Media Hubs section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-pink/30 rounded-full" />
              <h3 className="text-lg font-semibold text-foreground">Media & Influencer Hubs</h3>
              <span className="ml-auto text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                {mediaHubs.length} hubs
              </span>
            </div>
            <div className="grid gap-3">
              {mediaHubs.map((tribe, index) => (
                <TribeCard
                  key={tribe.id}
                  tribe={tribe}
                  index={index + colleges.length}
                  onClick={handleTribeClick}
                />
              ))}
            </div>
          </motion.section>
        </div>
      </motion.main>

      {/* Bottom Navigation */}
      {!showSplash && (
        <BottomNav activeItem={activeNav} onItemClick={setActiveNav} />
      )}

      {/* Verification Gate Modal */}
      {selectedTribe && (
        <VerificationGate tribe={selectedTribe} onClose={handleCloseGate} />
      )}
    </div>
  );
};

export default Index;
