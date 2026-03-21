import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const ONBOARDING_KEY = 'mijedu_onboarding_dismissed';
const WELCOME_KEY = 'mijedu_welcome_shown';

const OnboardingNotification = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [notificationType, setNotificationType] = useState<'onboarding' | 'welcome'>('onboarding');

  useEffect(() => {
    if (!user || !profile) return;

    // Check for fresh verification welcome
    const welcomeShown = localStorage.getItem(`${WELCOME_KEY}_${user.id}`);
    if (profile.is_verified && !welcomeShown) {
      // Check if the profile was created recently (within last 7 days) to avoid showing to old users
      const profileAge = Date.now() - new Date(profile.created_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (profileAge < sevenDays) {
        const timer = setTimeout(() => {
          setNotificationType('welcome');
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        // Mark as shown for old users so they don't see it
        localStorage.setItem(`${WELCOME_KEY}_${user.id}`, 'true');
      }
    }

    // Existing onboarding notification
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (dismissed) return;

    const isNewUser = !profile.bio && !profile.avatar_url && !profile.brand_description;

    if (isNewUser && profile.is_verified) {
      const timer = setTimeout(() => {
        setNotificationType('onboarding');
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleDismiss = () => {
    if (notificationType === 'welcome' && user) {
      localStorage.setItem(`${WELCOME_KEY}_${user.id}`, 'true');
    } else {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    setIsVisible(false);
  };

  const handleGoToSettings = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    if (user) localStorage.setItem(`${WELCOME_KEY}_${user.id}`, 'true');
    setIsVisible(false);
    navigate('/settings');
  };

  const handleGoToFeed = () => {
    if (user) localStorage.setItem(`${WELCOME_KEY}_${user.id}`, 'true');
    setIsVisible(false);
    navigate('/feed');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
        >
          <div className={`${
            notificationType === 'welcome'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-primary to-secondary'
          } p-[2px] rounded-2xl shadow-2xl shadow-primary/30`}>
            <div className="bg-background rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notificationType === 'welcome'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-primary to-secondary'
                }`}>
                  {notificationType === 'welcome' ? (
                    <PartyPopper className="w-5 h-5 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground">
                      {notificationType === 'welcome'
                        ? `Welcome to ${profile?.tribe}! 🎉`
                        : 'Welcome to Mijedu! 🎉'}
                    </h3>
                    <button
                      onClick={handleDismiss}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    {notificationType === 'welcome'
                      ? `Your Student ID has been verified! You now have full access to the Tribe Feed, Chat Rooms, and Marketplace.`
                      : 'Complete your profile to get started. Add your bio, photo, and update your password.'}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {notificationType === 'welcome' ? (
                      <>
                        <Button
                          onClick={handleGoToFeed}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
                        >
                          Explore Tribe Feed
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          onClick={handleGoToSettings}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" />
                          Set Up Profile
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleGoToSettings}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Complete Profile
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          onClick={handleDismiss}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          Later
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingNotification;
