import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, GraduationCap, BadgeCheck, Calendar, Download, QrCode, Crown, Building2, Store, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import AcademicLevelBadge from './AcademicLevelBadge';

interface DigitalIDCardProps {
  nickname: string;
  tribe: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  joinedAt: string;
  academicLevel?: string | null;
  userId: string;
  role?: string | null;
  points?: number;
}

const getRoleTheme = (role: string | null | undefined, academicLevel: string | null | undefined) => {
  // Tribe Admin - Royal Purple
  if (role === 'tribe_admin' || role === 'super_admin') {
    return {
      gradient: 'from-purple-700 via-purple-600 to-indigo-700',
      accent: 'purple',
      ribbon: 'bg-purple-500',
      borderGlow: 'shadow-[0_0_30px_rgba(147,51,234,0.3)]',
      label: role === 'super_admin' ? 'Executive' : 'Tribe Admin',
      labelIcon: Crown,
    };
  }
  // Brand - Business Black/Silver
  if (role === 'vip_brand') {
    return {
      gradient: 'from-gray-900 via-gray-800 to-gray-700',
      accent: 'silver',
      ribbon: 'bg-gray-500',
      borderGlow: 'shadow-[0_0_30px_rgba(156,163,175,0.3)]',
      label: 'Brand Partner',
      labelIcon: Store,
    };
  }
  // Finalists (Year 4/5) - Gold/Platinum
  if (academicLevel === 'Year 4' || academicLevel === 'Year 5') {
    return {
      gradient: 'from-amber-600 via-yellow-500 to-amber-600',
      accent: 'gold',
      ribbon: 'bg-amber-500',
      borderGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      label: 'Finalist',
      labelIcon: GraduationCap,
    };
  }
  // Default student
  return {
    gradient: 'from-primary via-primary/90 to-secondary',
    accent: 'default',
    ribbon: 'bg-primary',
    borderGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    label: 'Student',
    labelIcon: GraduationCap,
  };
};

const DigitalIDCard = ({ nickname, tribe, isVerified, avatarUrl, joinedAt, academicLevel, userId, role, points: propPoints }: DigitalIDCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const theme = getRoleTheme(role, academicLevel);
  const isPending = !isVerified;
  const profileUrl = `${window.location.origin}/profile/${userId}`;
  const [points, setPoints] = useState<number>(propPoints ?? 0);

  useEffect(() => {
    if (propPoints !== undefined) {
      setPoints(propPoints);
      return;
    }
    // Fetch points from DB if not provided
    const fetchPoints = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('profiles').select('points').eq('user_id', userId).single();
      if (data) setPoints((data as any).points ?? 0);
    };
    fetchPoints();
  }, [userId, propPoints]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname}'s Mijedu ID`,
          text: `Check out ${nickname}'s Digital Student ID on Mijedu!`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      // Toast handled externally
    }
  };

  return (
    <div className="space-y-3">
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${theme.borderGlow} ${isPending ? 'grayscale' : ''}`}
      >
        {/* Card background with gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />

        {/* Holographic watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              backgroundPosition: ['0% 0%', '200% 200%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 30px,
                rgba(255,255,255,0.3) 30px,
                rgba(255,255,255,0.3) 32px
              )`,
              backgroundSize: '200% 200%',
            }}
          />
          {/* Exylfe Corp watermark */}
          <div className="absolute inset-0 flex items-center justify-center rotate-[-15deg]">
            <motion.span
              animate={{ opacity: [0.03, 0.08, 0.03] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-white text-[40px] font-bold tracking-[0.3em] select-none whitespace-nowrap"
            >
              EXYLFE CORP
            </motion.span>
          </div>
        </div>

        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Verified ribbon */}
        {isVerified && (
          <div className="absolute top-0 right-0 z-10">
            <div className={`${theme.ribbon} text-white text-[9px] font-bold uppercase tracking-wider px-8 py-1 transform rotate-45 translate-x-6 translate-y-3 shadow-lg`}>
              Verified
            </div>
          </div>
        )}

        {/* Processing stamp for pending */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="border-4 border-red-500/60 rounded-lg px-6 py-3 transform rotate-[-15deg]"
            >
              <span className="text-red-500/70 text-2xl font-black uppercase tracking-widest">Processing</span>
            </motion.div>
          </div>
        )}

        {/* Card content */}
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-white" />
              <span className="text-white/90 text-xs font-medium uppercase tracking-wider">Mijedu Student ID</span>
            </div>
            {isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-xs font-medium text-emerald-200">Verified</span>
              </motion.div>
            )}
          </div>

          {/* Main content */}
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="relative">
              <div className="w-20 h-24 rounded-lg border-2 border-white/30 overflow-hidden bg-white/10 shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white/70">
                      {nickname?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              {isVerified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <BadgeCheck className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{nickname}</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60 uppercase tracking-wider">College</span>
                </div>
                <p className="text-white/90 font-medium text-sm">{tribe}</p>
              </div>
              {academicLevel && (
                <div className="space-y-1">
                  <span className="text-xs text-white/60 uppercase tracking-wider">Level</span>
                  <p className="text-white/90 font-medium text-sm">{academicLevel}</p>
                </div>
              )}
              {/* Points display */}
              <div className="flex items-center gap-1.5 pt-1">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-white/90 text-xs font-semibold">{points.toFixed(1)} pts</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs pt-1">
                <Calendar className="w-3 h-3" />
                <span>Member since {formatDistanceToNow(new Date(joinedAt), { addSuffix: false })}</span>
              </div>
            </div>
          </div>

          {/* Footer with QR code placeholder and barcode */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              {/* QR Code placeholder */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white/40" />
                </div>
                <div className="text-[9px] text-white/40 leading-tight">
                  <p>Scan to view</p>
                  <p>public profile</p>
                </div>
              </div>
              {/* Barcode */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-0.5">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/30 rounded-full"
                      style={{
                        width: Math.random() > 0.5 ? '2px' : '3px',
                        height: '14px',
                      }}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-[9px] font-mono tracking-wider">
                  MJDU-{userId.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share/Download Button */}
      {isVerified && (
        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Download className="w-4 h-4" />
          Share Digital ID
        </Button>
      )}
    </div>
  );
};

export default DigitalIDCard;
