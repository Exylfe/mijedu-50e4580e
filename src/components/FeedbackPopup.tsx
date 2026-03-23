import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Bug, Lightbulb, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type FeedbackCategory = 'experience' | 'bug_report' | 'suggestion';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackPopup = ({ isOpen, onClose }: FeedbackPopupProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>('experience');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredStar(0);
      setCategory('experience');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        user_id: user.id,
        rating,
        category,
        context: window.location.pathname,
        message: message.trim() || null,
      });
      if (error) throw error;
      toast.success('Thanks for your feedback! 🎉');
      onClose();
    } catch {
      toast.error('Could not submit feedback. Try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card shadow-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">How was your experience?</p>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2">
              <button
                onClick={() => setCategory('bug_report')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === 'bug_report'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Bug className="w-3 h-3" />
                Report Bug
              </button>
              <button
                onClick={() => setCategory('suggestion')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === 'suggestion'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                Suggestion
              </button>
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-1 justify-center py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform active:scale-90"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Optional Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === 'bug_report'
                  ? 'Describe the bug...'
                  : category === 'suggestion'
                  ? 'Share your idea...'
                  : 'Any thoughts? (optional)'
              }
              className="w-full text-sm rounded-lg border border-border bg-muted/30 p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              rows={2}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackPopup;
