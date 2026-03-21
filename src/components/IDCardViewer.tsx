import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DigitalIDCard from './DigitalIDCard';
import { toast } from 'sonner';

interface IDCardViewerProps {
  open: boolean;
  onClose: () => void;
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

const IDCardViewer = ({ open, onClose, nickname, tribe, isVerified, avatarUrl, joinedAt, academicLevel, userId, role, points }: IDCardViewerProps) => {
  const profileUrl = `${window.location.origin}/profile/${userId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname}'s Mijedu ID`,
          text: `Check out ${nickname}'s Digital Student ID on Mijedu!`,
          url: profileUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied!');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <DigitalIDCard
              nickname={nickname}
              tribe={tribe}
              isVerified={isVerified}
              avatarUrl={avatarUrl}
              joinedAt={joinedAt}
              academicLevel={academicLevel}
              userId={userId}
              role={role}
              points={points}
            />

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleShare}
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Share2 className="w-4 h-4" />
                Share ID Card
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="icon"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IDCardViewer;
