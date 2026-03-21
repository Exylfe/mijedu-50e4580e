import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ExternalLink, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfileCard } from '@/contexts/ProfileCardContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import RoleBadge from './RoleBadge';
import AcademicLevelBadge from './AcademicLevelBadge';
import DigitalIDCard from './DigitalIDCard';
import { formatDistanceToNow } from 'date-fns';

interface ProfileData {
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_type: string;
  is_verified: boolean;
  avatar_url: string | null;
  bio: string | null;
  academic_level: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_description: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  created_at: string;
  points: number;
}

const ProfileCardOverlay = () => {
  const { state, closeProfileCard } = useProfileCard();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<'super_admin' | 'tribe_admin' | 'vip_brand' | 'user' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.isOpen && state.userId) {
      fetchProfile(state.userId);
    } else {
      setProfile(null);
      setRole(null);
    }
  }, [state.isOpen, state.userId]);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('user_id, nickname, tribe, tribe_type, is_verified, avatar_url, bio, academic_level, brand_name, brand_logo_url, brand_description, whatsapp_number, website_url, created_at, points').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).neq('role', 'user').limit(1).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as ProfileData);
    if (roleRes.data) setRole(roleRes.data.role as 'super_admin' | 'tribe_admin' | 'vip_brand' | 'user');
    else setRole('user');
    setLoading(false);
  };

  const handleViewFullProfile = () => {
    if (state.userId) {
      closeProfileCard();
      navigate(`/profile/${state.userId}`);
    }
  };

  const handleWhatsApp = () => {
    if (profile?.whatsapp_number) {
      const clean = profile.whatsapp_number.replace(/\D/g, '');
      window.open(`https://wa.me/${clean}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfileCard}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-2xl border border-border shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Close button */}
              <button
                onClick={closeProfileCard}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : profile ? (
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.nickname} />}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-lg">
                        {profile.nickname?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">{profile.brand_name || profile.nickname}</h3>
                        <RoleBadge role={role} size="sm" />
                        <AcademicLevelBadge level={profile.academic_level} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.tribe}</p>
                    </div>
                  </div>

                  {/* Points badge */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 border border-accent/30">
                    <Flame className="w-4 h-4 text-accent-foreground" />
                    <span className="text-sm font-semibold text-accent-foreground">
                      {profile.points.toFixed(1)} pts
                    </span>
                    <span className="text-xs text-muted-foreground">Engagement Score</span>
                  </div>

                  {/* Bio */}
                  {(profile.brand_description || profile.bio) && (
                    <p className="text-sm text-foreground/80">{profile.brand_description || profile.bio}</p>
                  )}

                  {/* Digital ID Card */}
                  <DigitalIDCard
                    nickname={profile.nickname}
                    tribe={profile.tribe}
                    isVerified={profile.is_verified}
                    avatarUrl={profile.avatar_url}
                    joinedAt={profile.created_at}
                    academicLevel={profile.academic_level}
                    userId={profile.user_id}
                    role={role}
                  />

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button onClick={handleViewFullProfile} variant="default" size="sm" className="flex-1 gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Full Profile
                    </Button>
                    {profile.whatsapp_number && (
                      <Button onClick={handleWhatsApp} variant="outline" size="sm" className="gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">Profile not found</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileCardOverlay;
