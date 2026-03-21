import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import ClickableProfile from './ClickableProfile';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  nickname?: string;
  tribe?: string;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          const newComment = payload.new as Comment;
          
          // Fetch profile info for the new comment
          const { data } = await supabase
            .from('profiles')
            .select('nickname, tribe')
            .eq('user_id', newComment.user_id)
            .single();
          
          newComment.nickname = data?.nickname;
          newComment.tribe = data?.tribe;
          
          setComments(prev => [newComment, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching comments:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles for all commenters
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, tribe')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }]));

      setComments(data.map(c => ({
        ...c,
        nickname: profileMap.get(c.user_id)?.nickname,
        tribe: profileMap.get(c.user_id)?.tribe
      })));
    }

    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user || !profile) return;

    setIsSending(true);

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: profile.user_id,
        content: newComment.trim()
      });

    if (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
    }

    setIsSending(false);
  };

  const displayedComments = showAll ? comments : comments.slice(0, 5);
  const hasMoreComments = comments.length > 5;

  return (
    <div className="border-t border-border/50 pt-3 mt-3">
      {/* Comment input */}
      <div className="flex gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/50 to-neon-pink/50 flex items-center justify-center flex-shrink-0">
          <span className="text-foreground font-bold text-xs">
            {profile?.nickname?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 h-8 text-sm bg-muted/50"
            disabled={isSending || !profile}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSending || !profile}
            className="h-8 px-3 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length > 0 ? (
        <>
          <AnimatePresence initial={false}>
            {displayedComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mb-2"
              >
                <ClickableProfile userId={comment.user_id}>
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-foreground font-bold text-[10px]">
                      {comment.nickname?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </ClickableProfile>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ClickableProfile userId={comment.user_id}>
                      <span className="text-foreground text-sm font-medium">{comment.nickname || 'Unknown'}</span>
                    </ClickableProfile>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      {comment.tribe || 'Unknown'}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-foreground text-sm mt-0.5">{comment.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMoreComments && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-primary text-sm hover:opacity-80 transition-opacity mt-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View all {comments.length} comments
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-2">No comments yet. Be the first!</p>
      )}
    </div>
  );
};

export default CommentSection;
