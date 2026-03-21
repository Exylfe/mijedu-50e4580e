import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  text_overlay: string | null;
  link_url: string | null;
  created_at: string;
  expires_at: string;
  tribe: string | null;
  profile?: {
    nickname: string;
    tribe: string;
  };
}

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const StoryViewer = ({ story, onClose, onNext, onPrev, hasNext, hasPrev }: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
  }, [story.id]);

  useEffect(() => {
    if (isPaused || story.media_type === 'video') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, story.id, story.media_type, onNext]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      onPrev();
    } else if (clickX > (width * 2) / 3) {
      onNext();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-sm font-bold text-primary">
                {story.profile?.nickname?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{story.profile?.nickname || 'User'}</p>
              <p className="text-white/60 text-xs">{formatTimeAgo(story.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Content */}
        <motion.div
          key={story.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full h-full max-w-md mx-auto"
          onClick={handleClick}
        >
          {story.media_type === 'video' ? (
            <video
              src={story.media_url}
              autoPlay
              muted
              playsInline
              loop={false}
              preload="auto"
              onEnded={onNext}
              onLoadedData={(e) => {
                const video = e.target as HTMLVideoElement;
                video.play().catch(console.error);
              }}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={story.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {/* Text Overlay */}
          {story.text_overlay && (
            <div className="absolute inset-x-0 bottom-32 px-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-center">
                {story.text_overlay}
              </div>
            </div>
          )}

          {/* Link Button */}
          {story.link_url && (
            <div className="absolute inset-x-0 bottom-16 px-4">
              <a
                href={story.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                See More
              </a>
            </div>
          )}
        </motion.div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
