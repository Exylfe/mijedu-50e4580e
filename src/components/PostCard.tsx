import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
 import { Flag, AlertTriangle, MessageSquarePlus, Lock, MessageCircle, Radio, Share2, MoreHorizontal, EyeOff, Eye, Pin, PinOff, LockKeyhole, Unlock, Minimize2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CommentSection from './CommentSection';
import MediaDisplay from './MediaDisplay';
import RoleBadge from './RoleBadge';
import PostTypeBadge from './PostTypeBadge';
import ClickableProfile from './ClickableProfile';
import AcademicLevelBadge from './AcademicLevelBadge';
import { useUserRole } from '@/hooks/useUserRole';
import VibeButton from './VibeButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostData {
  id: string;
  content: string;
  fire_count: number;
  report_count: number;
  is_hidden: boolean;
  is_pinned?: boolean;
  created_at: string;
  visibility?: string;
  target_tribe?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  post_tag?: string | null;
  user_id?: string;
  profiles: {
    nickname: string;
    tribe: string;
    academic_level?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface PostCardProps {
  post: PostData;
  index: number;
  userReactions: string[];
  onReactionChange: () => void;
  showModeration?: boolean;
}

interface ActiveRoom {
  id: string;
  title: string;
}

const ENGAGEMENT_THRESHOLD = 10;

const PostCard = ({ post, index, userReactions, onReactionChange, showModeration }: PostCardProps) => {
  const { user } = useAuth();
  // Use simulated auth for UI display
  const { profile, isAdmin, isSuperAdmin, isVipBrand } = useSimulatedAuth();
  const navigate = useNavigate();
  const [isReacting, setIsReacting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  
  // Get poster's role for badge
  const { role: posterRole } = useUserRole(post.user_id);
  
  // Determine display name - NEVER show Anonymous (anonymous posting removed)
  const getDisplayName = () => {
    // If we have a profile nickname, use it
    if (post.profiles?.nickname && post.profiles.nickname.trim()) {
      return post.profiles.nickname;
    }
    
    // Role-based fallback - never anonymous
    if (posterRole === 'super_admin') return 'System Admin';
    if (posterRole === 'tribe_admin') return 'Tribe Admin';
    if (posterRole === 'vip_brand') return 'Brand Partner';
    
    // For regular users, show tribe-based identity
    if (post.profiles?.tribe) return `${post.profiles.tribe} Member`;
    
    // Legacy post recovery: missing profile = Community Member
    return 'Community Member';
  };

  const displayName = getDisplayName();
  
  const hasFired = userReactions.includes(post.id);
  const isPrivatePost = post.visibility === 'private';
  // Admins can create rooms on high-engagement posts; for private posts only if they're in that tribe
  const canCreateRoom = (isAdmin || isSuperAdmin || isVipBrand)
    && post.fire_count >= ENGAGEMENT_THRESHOLD
    && (!isPrivatePost || !post.target_tribe || post.target_tribe === profile?.tribe);
  const [viewTracked, setViewTracked] = useState(false);

  // Track post view (only once per session per post)
  useEffect(() => {
    if (viewTracked || !post.id) return;
    
    const trackView = async () => {
      try {
        await supabase
          .from('post_views')
          .insert({
            post_id: post.id,
            user_id: user?.id,
            viewer_tribe: profile?.tribe || null
          });
      } catch (err) {
        console.error('View tracking failed:', err);
      }
      setViewTracked(true);
    };
    
    // Small delay to ensure post is actually viewed
    const timer = setTimeout(trackView, 1000);
    return () => clearTimeout(timer);
  }, [post.id, viewTracked, profile?.tribe]);

  // Check for active room on this post
  useEffect(() => {
    const checkActiveRoom = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, title')
        .eq('post_id', post.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setActiveRoom(data);
      }
    };

    checkActiveRoom();
  }, [post.id]);

  // Get comment count
  useEffect(() => {
    const getCommentCount = async () => {
      const { count } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      setCommentCount(count || 0);
    };

    getCommentCount();

    // Subscribe to comment changes
    const channel = supabase
      .channel(`comment-count-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${post.id}`
        },
        () => {
          getCommentCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const handleFire = async () => {
    if (!user || isReacting) return;
    setIsReacting(true);

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    if (hasFired) {
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to remove reaction');
      }
    } else {
      const { error } = await supabase
        .from('post_reactions')
        .insert({
          post_id: post.id,
          user_id: user.id,
          reaction_type: 'fire'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already reacted');
        } else {
          toast.error('Failed to add reaction');
        }
      }
    }

    onReactionChange();
    setIsReacting(false);
  };

  const handleReport = async () => {
    if (!user || isReporting) return;
    setIsReporting(true);

    const { error } = await supabase
      .from('post_reports')
      .insert({
        post_id: post.id,
        user_id: user.id
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('You already reported this post');
      } else {
        toast.error('Failed to report post');
      }
    } else {
      toast.success('Post reported. Thank you for keeping the community safe.');
    }

    setIsReporting(false);
  };

   const handleShare = async () => {
     const shareUrl = `${window.location.origin}/post/${post.id}`;
     
     if (navigator.share) {
       try {
         await navigator.share({
           title: 'Check out this post on Mijedu',
           text: post.content.slice(0, 100) + '...',
           url: shareUrl
         });
       } catch (err) {
         // User cancelled or error
       }
     } else {
       navigator.clipboard.writeText(shareUrl);
       toast.success('Link copied to clipboard!');
     }
   };
 
  const handleCreateRoom = async () => {
    if (!user || !roomTitle.trim()) return;
    setIsCreatingRoom(true);

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        post_id: post.id,
        title: roomTitle.trim(),
        created_by: user.id,
        tribe: post.profiles?.tribe
      })
      .select('id')
      .single();

    if (error) {
      toast.error(`Failed to create room: ${error.message}`);
    } else {
      toast.success('Discussion room created!');
      setRoomTitle('');
      setRoomDialogOpen(false);
      if (data?.id) {
        navigate(`/room/${data.id}`);
      }
    }

    setIsCreatingRoom(false);
  };

  const handleJoinRoom = () => {
    if (!activeRoom) return;

    // Check access for private posts
    if (isPrivatePost && post.target_tribe && profile?.tribe !== post.target_tribe) {
      toast.error('This room is private to a specific tribe');
      return;
    }

    navigate(`/room/${activeRoom.id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
 
   // Check if poster is admin for gold border
   const isAdminPoster = posterRole === 'tribe_admin' || posterRole === 'super_admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
       className={`rounded-xl overflow-hidden bg-card border-2 card-shadow ${
         post.is_hidden ? 'opacity-50' : ''
       } ${
         isAdminPoster 
           ? 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)]' 
           : 'border-border'
       }`}
    >
       {/* Admin gold badge on post */}
       {isAdminPoster && (
         <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3 py-1.5 flex items-center gap-2 border-b border-amber-400/20">
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
           <span className="text-xs font-medium text-amber-600">Official Update</span>
         </div>
       )}
 
      {/* Media First - Full Width */}
      {post.media_url && post.media_type && (
        <div className="relative">
          <MediaDisplay mediaUrl={post.media_url} mediaType={post.media_type} fullWidth />
          
          {/* Overlay header on media */}
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <ClickableProfile userId={post.user_id} className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  {post.profiles?.avatar_url && <AvatarImage src={post.profiles.avatar_url} alt={displayName} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-xs">
                    {displayName[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-primary-foreground font-medium text-sm">{displayName}</h3>
                    <RoleBadge role={posterRole} size="sm" />
                    <AcademicLevelBadge level={post.profiles?.academic_level} size="sm" />
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground font-medium">
                    {post.profiles?.tribe || 'Unknown'}
                  </span>
                </div>
              </ClickableProfile>
              
              {/* Live Room indicator */}
              {activeRoom && (
                <button
                  onClick={handleJoinRoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-xs font-medium hover:bg-accent/40 transition-colors animate-pulse"
                  title={`Join: ${activeRoom.title}`}
                >
                  <Radio className="w-3 h-3" />
                  Live
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header - only show if no media */}
        {!post.media_url && (
          <div className="flex items-center gap-3 mb-3">
            <ClickableProfile userId={post.user_id}>
              <Avatar className="w-10 h-10">
                {post.profiles?.avatar_url && <AvatarImage src={post.profiles.avatar_url} alt={displayName} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm">
                  {displayName[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </ClickableProfile>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ClickableProfile userId={post.user_id}>
                  <h3 className="text-foreground font-medium">{displayName}</h3>
                </ClickableProfile>
                <RoleBadge role={posterRole} size="sm" />
                <AcademicLevelBadge level={post.profiles?.academic_level} size="sm" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {post.profiles?.tribe || 'Unknown'}
                </span>
                <PostTypeBadge visibility={post.visibility || 'public'} targetTribe={post.target_tribe} />
                <span className="text-muted-foreground text-xs">• {timeAgo}</span>
              </div>
            </div>
            
            {/* Live Room indicator */}
            {activeRoom && (
              <button
                onClick={handleJoinRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors animate-pulse"
                title={`Join: ${activeRoom.title}`}
              >
                <Radio className="w-3 h-3" />
                Live
              </button>
            )}
            
            {/* Visibility indicator */}
            {isPrivatePost && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                <Lock className="w-3 h-3" />
                Private
              </div>
            )}
            
            {/* Hidden indicator for admins */}
            {showModeration && post.is_hidden && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">
                <AlertTriangle className="w-3 h-3" />
                Hidden
              </div>
            )}
          </div>
        )}

        {/* Post content/caption */}
        <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Timestamp and indicators for media posts */}
        {post.media_url && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
            {isPrivatePost && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                <Lock className="w-3 h-3" />
                Private
              </div>
            )}
            {showModeration && post.is_hidden && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs">
                <AlertTriangle className="w-3 h-3" />
                Hidden
              </div>
            )}
          </div>
        )}

        {/* Post actions */}
         <div className="flex items-center gap-3 pt-3 border-t border-border/50">
           {/* Vibe button with animation */}
           <VibeButton
             hasVibed={hasFired}
             vibeCount={post.fire_count}
             onVibe={handleFire}
             disabled={isReacting}
           />

          {/* Comment button */}
          <button
            onClick={() => setShowComments(!showComments)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              showComments 
                 ? 'bg-primary/15 text-primary' 
                 : 'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
             <span className="text-sm font-semibold">{commentCount}</span>
           </button>
 
           {/* Share button */}
           <button
             onClick={handleShare}
             className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-all"
           >
             <Share2 className="w-5 h-5" />
          </button>

          {/* Create Room button for admins on high-engagement posts */}
          {canCreateRoom && !activeRoom && (
            <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                  title="Create discussion room"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Room</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Create Discussion Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Room title (e.g., 'Hot Takes on This Tea')"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    maxLength={100}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRoomDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={!roomTitle.trim() || isCreatingRoom}
                      className="bg-gradient-to-r from-primary to-secondary text-white"
                    >
                      {isCreatingRoom ? 'Creating...' : 'Create Room'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Report button (for non-admins) */}
          {!showModeration && (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors ml-auto"
              title="Report this post"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}

          {/* Admin moderation dropdown */}
          {showModeration && (
            <div className="ml-auto flex items-center gap-2">
              {post.report_count > 0 && (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {post.report_count}
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
                  <DropdownMenuItem onClick={async () => {
                    await supabase.from('posts').update({ is_hidden: !post.is_hidden }).eq('id', post.id);
                    toast.success(post.is_hidden ? 'Post unhidden' : 'Post hidden');
                    onReactionChange();
                  }}>
                    {post.is_hidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    {post.is_hidden ? 'Unhide Post' : 'Hide Post'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    await supabase.from('posts').update({ is_pinned: !post.is_pinned }).eq('id', post.id);
                    toast.success(post.is_pinned ? 'Post unpinned' : 'Post pinned');
                    onReactionChange();
                  }}>
                    {post.is_pinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                    {post.is_pinned ? 'Unpin Post' : 'Pin Post'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    const { data } = await supabase.from('posts').select('comments_locked').eq('id', post.id).single();
                    const locked = data?.comments_locked ?? false;
                    await supabase.from('posts').update({ comments_locked: !locked }).eq('id', post.id);
                    toast.success(!locked ? 'Comments locked' : 'Comments unlocked');
                    onReactionChange();
                  }}>
                    <LockKeyhole className="w-4 h-4 mr-2" />
                    Lock/Unlock Comments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    const { data } = await supabase.from('posts').select('reach_limited').eq('id', post.id).single();
                    const limited = data?.reach_limited ?? false;
                    await supabase.from('posts').update({ reach_limited: !limited }).eq('id', post.id);
                    toast.success(!limited ? 'Reach limited' : 'Reach restored');
                    onReactionChange();
                  }}>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Contain Reach
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="w-4 h-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.from('posts').delete().eq('id', post.id);
                      toast.success('Post deleted');
                      onReactionChange();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Comments section */}
        {showComments && <CommentSection postId={post.id} />}
      </div>
    </motion.div>
  );
};

export default PostCard;
