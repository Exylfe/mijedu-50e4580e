import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Building2, Store, HelpCircle, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { FeedSkeleton } from '@/components/FeedSkeleton';
import PostCard from '@/components/PostCard';
import SponsoredPost from '@/components/SponsoredPost';
import CreatePostModal from '@/components/CreatePostModal';
import BannerCarousel from '@/components/BannerCarousel';
import StoryTray from '@/components/StoryTray';
import ImmersiveHeader from '@/components/ImmersiveHeader';
import FeedbackPopup from '@/components/FeedbackPopup';
import PullToRefresh from '@/components/PullToRefresh';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

interface PromotedPost {
  id: string;
  content: string;
  target_link: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_user_id: string | null;
}

const PAGE_SIZE = 20;
const FOLLOWING_MIN = 10;

type FeedTab = 'following' | 'tribe' | 'brand';

const SocietyFeed = () => {
  const { user } = useAuth();
  const { profile, isAdmin, isSuperAdmin } = useSimulatedAuth();
  const navigate = useNavigate();
  const { isVisible, forceShow } = useScrollVisibility({ threshold: 80 });
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('home');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<PromotedPost[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('following');
  const [hasFollowing, setHasFollowing] = useState(false);
  const [defaultContent, setDefaultContent] = useState<string | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false);

  const canPost = isSuperAdmin || isAdmin || (profile?.is_verified && profile?.tribe_id);

  const attachProfiles = async (postsData: any[]): Promise<PostWithProfile[]> => {
    if (postsData.length === 0) return [];
    const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))];
    if (userIds.length === 0) return postsData.map(p => ({ ...p, profiles: { nickname: 'Community Member', tribe: 'Unknown', academic_level: null, avatar_url: null } }));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe, academic_level, avatar_url')
      .in('user_id', userIds);
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe, academic_level: p.academic_level, avatar_url: p.avatar_url }])
    );
    return postsData.map(post => ({
      ...post,
      fire_count: post.fire_count ?? 0,
      report_count: post.report_count ?? 0,
      is_hidden: post.is_hidden ?? false,
      profiles: profilesMap.get(post.user_id) || { nickname: 'Community Member', tribe: 'Unknown', academic_level: null, avatar_url: null }
    }));
  };

  // Following tab: posts from followed users, backfill with hot posts
  const fetchFollowingFeed = useCallback(async (loadMore = false) => {
    if (!user) {
      return fetchTribePosts(loadMore);
    }

    const activeCursor = loadMore ? cursor : null;

    let query = supabase
      .from('following_feed')
      .select('id, content, fire_count, report_count, is_hidden, created_at, user_id, visibility, target_tribe, media_url, media_type')
      .eq('follower_user', user.id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (activeCursor) {
      query = query.lt('created_at', activeCursor.created_at);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Following feed error:', error);
      return fetchTribePosts(loadMore);
    }

    const validData = (data || []).filter(p => p.id && p.user_id && p.content);

    if (!loadMore && validData.length < FOLLOWING_MIN) {
      const backfillNeeded = FOLLOWING_MIN - validData.length;
      const existingIds = new Set(validData.map(p => p.id));
      const { data: hotData } = await supabase
        .from('hot_posts')
        .select('id, content, fire_count, created_at, user_id, view_count, tribe_id, media_url, media_type')
        .order('hot_score', { ascending: false })
        .limit(backfillNeeded + 5);

      const backfill = (hotData || [])
        .filter(p => p.id && !existingIds.has(p.id))
        .slice(0, backfillNeeded)
        .map(p => ({
          ...p,
          report_count: 0,
          is_hidden: false,
          visibility: 'public',
          target_tribe: null,
          media_url: (p as any).media_url || null,
          media_type: (p as any).media_type || null,
        }));

      const combined = [...validData, ...backfill];
      const postsWithProfiles = await attachProfiles(combined);
      setPosts(postsWithProfiles);
      setHasFollowing(validData.length > 0);
      setHasMore(validData.length === PAGE_SIZE);
      if (validData.length > 0) {
        const last = validData[validData.length - 1];
        setCursor({ created_at: last.created_at, id: last.id! });
      }
    } else {
      setHasMore(validData.length === PAGE_SIZE);
      if (validData.length > 0) {
        const last = validData[validData.length - 1];
        setCursor({ created_at: last.created_at, id: last.id! });
      }
      const postsWithProfiles = await attachProfiles(validData);
      if (loadMore) {
        setPosts(prev => [...prev, ...postsWithProfiles]);
      } else {
        setPosts(postsWithProfiles);
      }
      setHasFollowing(true);
    }

    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [user, cursor]);

  // Tribe tab: posts from user's tribe + all public posts
  const fetchTribePosts = useCallback(async (loadMore = false) => {
    const activeCursor = loadMore ? cursor : null;

    let query = supabase
      .from('posts')
      .select('id, content, fire_count, report_count, is_hidden, created_at, user_id, visibility, target_tribe, media_url, media_type, tribe_id')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    // Show public posts + posts matching user's tribe
    if (profile?.tribe_id) {
      query = query.or(`visibility.eq.public,tribe_id.eq.${profile.tribe_id}`);
    } else {
      query = query.eq('visibility', 'public');
    }

    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data: postsData, error } = await query;
    if (error) {
      console.error('Error fetching tribe posts:', error);
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

    const postsWithProfiles = await attachProfiles(postsData);
    if (loadMore) {
      setPosts(prev => [...prev, ...postsWithProfiles]);
    } else {
      setPosts(postsWithProfiles);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [cursor, profile?.tribe_id]);

  // Brand tab: posts from users with vip_brand role or brand shops
  const fetchBrandPosts = useCallback(async (loadMore = false) => {
    const activeCursor = loadMore ? cursor : null;

    // Get brand user IDs from user_roles and brands tables
    const [rolesResult, brandsResult] = await Promise.all([
      supabase.from('user_roles').select('user_id').eq('role', 'vip_brand'),
      supabase.from('brands').select('user_id').eq('is_active', true),
    ]);

    const brandUserIds = [
      ...new Set([
        ...(rolesResult.data || []).map(r => r.user_id),
        ...(brandsResult.data || []).map(b => b.user_id),
      ])
    ];

    if (brandUserIds.length === 0) {
      if (!loadMore) setPosts([]);
      setHasMore(false);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }

    let query = supabase
      .from('posts')
      .select('id, content, fire_count, report_count, is_hidden, created_at, user_id, visibility, target_tribe, media_url, media_type')
      .eq('is_hidden', false)
      .in('user_id', brandUserIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data: postsData, error } = await query;
    if (error) {
      console.error('Error fetching brand posts:', error);
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

    const postsWithProfiles = await attachProfiles(postsData);
    if (loadMore) {
      setPosts(prev => [...prev, ...postsWithProfiles]);
    } else {
      setPosts(postsWithProfiles);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [cursor]);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (activeTab === 'following') {
      return fetchFollowingFeed(loadMore);
    } else if (activeTab === 'brand') {
      return fetchBrandPosts(loadMore);
    } else {
      return fetchTribePosts(loadMore);
    }
  }, [activeTab, fetchFollowingFeed, fetchTribePosts, fetchBrandPosts]);

  const fetchUserReactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_reactions')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) setUserReactions(data.map(r => r.post_id));
  };

  const fetchPromotedPosts = async () => {
    const { data: promoted } = await supabase
      .from('promoted_posts')
      .select('id, content, target_link, user_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (promoted && promoted.length > 0) {
      const userIds = [...new Set(promoted.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, brand_name, brand_logo_url')
        .in('user_id', userIds);
      const profilesMap = new Map(
        (profiles || []).map(p => [p.user_id, { brand_name: p.brand_name, brand_logo_url: p.brand_logo_url }])
      );
      setPromotedPosts(
        promoted.map(p => ({
          id: p.id,
          content: p.content,
          target_link: p.target_link,
          brand_name: profilesMap.get(p.user_id)?.brand_name || 'VIP Brand',
          brand_logo_url: profilesMap.get(p.user_id)?.brand_logo_url || null,
          brand_user_id: p.user_id
        }))
      );
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setCursor(null);
    setHasMore(true);
    fetchPosts();
    fetchPromotedPosts();
    fetchUserReactions();
  }, [activeTab]);

  useEffect(() => {
    const postsChannel = supabase
      .channel('society-feed-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        setCursor(null);
        fetchPosts();
      })
      .subscribe();

    const followsChannel = supabase
      .channel('society-feed-follows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entity_follows' }, () => {
        if (activeTab === 'following') {
          setCursor(null);
          fetchPosts();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(followsChannel);
    };
  }, [user, activeTab]);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home': break;
      case 'discover': navigate('/explore'); break;
      case 'chat': navigate('/tribe-feed'); break;
      case 'market': navigate('/market'); break;
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    setCursor(null);
    fetchPosts();
    fetchPromotedPosts();
    fetchUserReactions();
  };

  const handleReactionChange = () => {
    fetchPosts();
    fetchUserReactions();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchPosts(true);
    }
  };

  const handleContentTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
    if (!isVisible) forceShow();
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case 'following':
        return {
          icon: <Users className="w-8 h-8 text-muted-foreground" />,
          title: 'No posts from followed users yet',
          subtitle: 'Follow people and brands to see their posts here',
        };
      case 'tribe':
        return {
          icon: <Building2 className="w-8 h-8 text-muted-foreground" />,
          title: 'No tribe posts yet',
          subtitle: 'Join a tribe or wait for members to start posting',
        };
      case 'brand':
        return {
          icon: <Store className="w-8 h-8 text-muted-foreground" />,
          title: 'No brand posts yet',
          subtitle: 'Brand partners will share updates here',
        };
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-background pb-24" onClick={handleContentTap}>
      <ImmersiveHeader title="Global Bwalo" subtitle="Public Feed" isVisible={isVisible} onRefresh={handleRefresh} />
      <div className="h-16" />

      {/* Guided Posting Prompt Bar */}
      {canPost && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: '❓ Ask a question', icon: HelpCircle, template: '📚 Course:\n📌 Topic:\n❓ My question:\n' },
              { label: '📝 Share notes', icon: BookOpen, template: '📚 Course:\n📌 Topic:\n📝 Summary:\n' },
              { label: '💬 Discussion', icon: MessageSquare, template: '💬 Question:\n📄 Details:\n' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (!user) {
                    toast.error('Please log in to post');
                    return;
                  }
                  if (!profile?.is_verified) {
                    toast.error('Your account is pending verification');
                    navigate('/pending');
                    return;
                  }
                  if (!profile?.tribe_id && !isSuperAdmin && !isAdmin) {
                    toast.error('You need to join a tribe before posting');
                    navigate('/pending');
                    return;
                  }
                  setDefaultContent(item.template);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feed Tabs */}
      <div className="px-4 pt-3 pb-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)}>
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="following" className="flex-1 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />
              Following
            </TabsTrigger>
            <TabsTrigger value="tribe" className="flex-1 text-xs">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              Tribe
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex-1 text-xs">
              <Store className="w-3.5 h-3.5 mr-1" />
              Brand
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <StoryTray />
      <BannerCarousel />

      {promotedPosts.length > 0 && (
        <div className="px-4 pt-6 space-y-3">
          {promotedPosts.map((post, index) => (
            <SponsoredPost
              key={post.id}
              content={post.content}
              brandName={post.brand_name || 'VIP Brand'}
              brandLogo={post.brand_logo_url}
              targetLink={post.target_link}
              brandUserId={post.brand_user_id}
              index={index}
            />
          ))}
        </div>
      )}

      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <FeedSkeleton count={3} />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              {getEmptyState().icon}
            </div>
            <p className="text-foreground font-medium">{getEmptyState().title}</p>
            <p className="text-muted-foreground text-sm">{getEmptyState().subtitle}</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              userReactions={userReactions}
              onReactionChange={handleReactionChange}
            />
          ))
        )}

        {hasMore && !isLoading && posts.length > 0 && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="px-6">
              {isLoadingMore ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : 'Load more'}
            </Button>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">You're all caught up ✨</p>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      {canPost && (
        <motion.button
          onClick={() => {
            if (!user) { toast.error('Please log in to post'); return; }
            setDefaultContent(undefined);
            setShowCreateModal(true);
          }}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setDefaultContent(undefined); }}
        onPostCreated={() => {
          setShowCreateModal(false);
          setDefaultContent(undefined);
          handleRefresh();
          // Trigger feedback popup 2 seconds after successful post
          setTimeout(() => setShowFeedback(true), 2000);
        }}
        defaultContent={defaultContent}
      />

      <FeedbackPopup isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      
    </div>
  );
};

export default SocietyFeed;
