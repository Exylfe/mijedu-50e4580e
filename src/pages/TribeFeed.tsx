import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { FeedSkeleton } from '@/components/FeedSkeleton';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import ImmersiveHeader from '@/components/ImmersiveHeader';
import BillboardCard from '@/components/BillboardCard';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostWithProfile {
  id: string;
  content: string;
  fire_count: number;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
  user_id: string;
  visibility?: string;
  target_tribe?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  profiles: {
    nickname: string;
    tribe: string;
    academic_level?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface Tribe {
  id: string;
  name: string;
}

interface Billboard {
  id: string;
  image_url: string;
  link_url: string | null;
}

const TribeFeed = () => {
  const { user, isSuperAdmin: realIsSuperAdmin } = useAuth();
  const { profile, isAdmin, isSuperAdmin, adminTribe } = useSimulatedAuth();
  const navigate = useNavigate();
  const { isVisible, forceShow } = useScrollVisibility({ threshold: 80 });
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('chat');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<string>('');
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);
  const PAGE_SIZE = 20;

  const userTribe = profile?.tribe || '';
  
  // Super admins can select any tribe to view; admins see their assigned tribe; users see their own tribe
  const effectiveTribe = (realIsSuperAdmin && selectedTribe) ? selectedTribe : userTribe;

  // Fetch tribes for super admin tribe selector
  useEffect(() => {
    if (realIsSuperAdmin) {
      const fetchTribes = async () => {
        const { data } = await supabase
          .from('tribes')
          .select('id, name')
          .eq('is_visible', true)
          .order('name');
        if (data) {
          setTribes(data);
          if (data.length > 0 && !selectedTribe) {
            // Default to user's own tribe if available
            setSelectedTribe(userTribe || data[0].name);
          }
        }
      };
      fetchTribes();
    }
  }, [realIsSuperAdmin]);

  // Fetch approved billboards
  useEffect(() => {
    const fetchBillboards = async () => {
      const { data } = await supabase
        .from('banners')
        .select('id, image_url, link_url')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setBillboards(data);
      }
    };
    
    fetchBillboards();
  }, []);

  // Function to inject billboards into posts (every 5 posts)
  const getInterleavedContent = () => {
    const result: (PostWithProfile | { type: 'billboard'; data: Billboard })[] = [];
    let billboardIndex = 0;
    
    posts.forEach((post, index) => {
      result.push(post);
      
      if ((index + 1) % 5 === 0 && billboardIndex < billboards.length) {
        result.push({ type: 'billboard', data: billboards[billboardIndex] });
        billboardIndex++;
      }
    });
    
    return result;
  };

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!effectiveTribe) {
      setIsLoading(false);
      return;
    }

    let query = supabase
      .from('posts')
      .select('id, content, fire_count, report_count, is_hidden, created_at, user_id, visibility, target_tribe, media_url, media_type')
      .eq('visibility', 'private')
      .eq('target_tribe', effectiveTribe)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    const activeCursor = loadMore ? cursor : null;
    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      if (!loadMore) setPosts([]);
      setHasMore(false);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }

    setHasMore(postsData.length === PAGE_SIZE);
    const lastItem = postsData[postsData.length - 1];
    setCursor({ created_at: lastItem.created_at, id: lastItem.id });

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe, academic_level, avatar_url')
      .in('user_id', userIds);
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe, academic_level: p.academic_level, avatar_url: p.avatar_url }])
    );
    const postsWithProfiles: PostWithProfile[] = postsData.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || { nickname: 'Community Member', tribe: effectiveTribe, academic_level: null, avatar_url: null }
    }));

    if (loadMore) {
      setPosts(prev => [...prev, ...postsWithProfiles]);
    } else {
      setPosts(postsWithProfiles);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [effectiveTribe, cursor]);

  const fetchUserReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_reactions')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) {
      setUserReactions(data.map(r => r.post_id));
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchUserReactions();

    const channel = supabase
      .channel('tribe-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, effectiveTribe]);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home': navigate('/feed'); break;
      case 'discover': navigate('/explore'); break;
      case 'chat': break;
      case 'market': navigate('/market'); break;
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    setCursor(null);
    fetchPosts();
    fetchUserReactions();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchPosts(true);
    }
  };

  const handleReactionChange = () => {
    fetchPosts();
    fetchUserReactions();
  };

  const handleContentTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
    if (!isVisible) forceShow();
  };

  return (
    <div className="min-h-screen bg-background pb-24" onClick={handleContentTap}>

      <ImmersiveHeader 
        title={`${effectiveTribe} Bwalo`}
        subtitle="Private tribe content"
        isVisible={isVisible}
        onRefresh={handleRefresh}
      />

      <div className="h-16" />

      {/* Super Admin tribe selector - replaces god view */}
      {realIsSuperAdmin && tribes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Viewing tribe feed</p>
              <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                <SelectTrigger className="h-8 bg-background/50">
                  <SelectValue placeholder="Select tribe" />
                </SelectTrigger>
                <SelectContent>
                  {tribes.map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tribe info banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-foreground font-semibold">{effectiveTribe} Private Bwalo</h2>
            <p className="text-muted-foreground text-sm">Posts visible only to {effectiveTribe} members</p>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <FeedSkeleton count={3} />
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-6xl">🫖</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No tea spilled here yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share something with your tribe!
            </p>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/30"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create First Post
              </motion.button>
            )}
          </motion.div>
        ) : (
          getInterleavedContent().map((item, index) => {
            if ('type' in item && item.type === 'billboard') {
              return (
                <BillboardCard
                  key={`billboard-${item.data.id}`}
                  imageUrl={item.data.image_url}
                  linkUrl={item.data.link_url}
                  index={index}
                />
              );
            }
            
            const post = item as PostWithProfile;
            return (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                userReactions={userReactions}
                onReactionChange={handleReactionChange}
                showModeration={isAdmin || isSuperAdmin}
              />
            );
          })
        )}

        {hasMore && !isLoading && posts.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6"
            >
              {isLoadingMore ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">You've seen all the tribe tea ☕</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
          aria-label="Create post"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
        defaultVisibility="private"
        defaultTribe={effectiveTribe}
      />
    </div>
  );
};

export default TribeFeed;
