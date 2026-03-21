import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Lock, Globe, Building2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import BottomNav from '@/components/BottomNav';
import FollowButton from '@/components/FollowButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Tribe {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
}

interface PostWithProfile {
  id: string;
  content: string;
  created_at: string;
  fire_count: number;
  report_count: number;
  is_hidden: boolean;
  media_url: string | null;
  media_type: string | null;
  visibility: string;
  target_tribe: string | null;
  user_id: string;
  profiles: {
    nickname: string;
    tribe: string;
  } | null;
}

const TribePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isSuperAdmin, isAdmin, adminTribe } = useAuth();
  
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [publicPosts, setPublicPosts] = useState<PostWithProfile[]>([]);
  const [privatePosts, setPrivatePosts] = useState<PostWithProfile[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('discover');
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  const isMember = profile?.tribe === tribe?.name;
  
  // Can current user open tribe admin hub?
  const canOpenTribeAdminHub = tribe && (isSuperAdmin || (isAdmin && adminTribe === tribe.name));

  useEffect(() => {
    if (id) {
      fetchTribe();
      fetchPosts();
      if (user) {
        fetchUserReactions();
      }
    }
  }, [id, user]);

  const fetchTribe = async () => {
    const { data } = await supabase
      .from('tribes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) setTribe(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    
    // Fetch public posts for this tribe
    const { data: publicData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, fire_count, report_count, is_hidden, media_url, media_type, visibility, target_tribe, user_id,
        profiles!posts_user_id_profiles_fkey (nickname, tribe)
      `)
      .eq('visibility', 'public')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter posts where the author's tribe matches
    if (publicData && tribe) {
      const filteredPublic = publicData.filter(
        post => (post.profiles as any)?.[0]?.tribe === tribe.name
      );
      setPublicPosts(filteredPublic as unknown as PostWithProfile[]);
    }

    setLoading(false);
  };

  const fetchPrivatePosts = async () => {
    if (!tribe || !isMember) return;

    const { data: privateData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, fire_count, report_count, is_hidden, media_url, media_type, visibility, target_tribe, user_id,
        profiles!posts_user_id_profiles_fkey (nickname, tribe)
      `)
      .eq('visibility', 'private')
      .eq('target_tribe', tribe.name)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (privateData) {
      setPrivatePosts(privateData as unknown as PostWithProfile[]);
    }
  };

  useEffect(() => {
    if (tribe) {
      fetchPosts();
      if (isMember) {
        fetchPrivatePosts();
      }
    }
  }, [tribe, isMember]);

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

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home':
        navigate('/feed');
        break;
      case 'discover':
        navigate('/explore');
        break;
      case 'chat':
        navigate('/tribe-feed');
        break;
      case 'market':
        navigate('/market');
        break;
    }
  };

  const handleReactionChange = () => {
    fetchPosts();
    fetchUserReactions();
  };

  if (!tribe && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Tribe not found</h2>
          <Button onClick={() => navigate('/explore')} className="mt-4">
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/explore')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            {tribe?.logo_url ? (
              <img 
                src={tribe.logo_url} 
                alt={tribe.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">{tribe?.name}</h1>
              <p className="text-xs text-muted-foreground">{tribe?.type}</p>
            </div>
          </div>

          {isMember ? (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Member
            </span>
          ) : null}
          
          <FollowButton entityId={tribe?.id} entityType="tribe" showCount={true} />
          
          {/* Open Hub button for admins */}
          {canOpenTribeAdminHub && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/tribe-admin/${encodeURIComponent(tribe?.name || '')}`)}
              className="gap-1.5 border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
            >
              {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
              Open Hub
            </Button>
          )}
        </div>
      </header>

      {/* Content Tabs */}
      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'public' | 'private')}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Public Feed
            </TabsTrigger>
            {isMember && (
              <TabsTrigger value="private" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Private Tea
              </TabsTrigger>
            )}
            {!isMember && (
              <TabsTrigger value="private" disabled className="flex items-center gap-2 opacity-50">
                <Lock className="w-4 h-4" />
                Members Only
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="public" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : publicPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No public posts yet</p>
              </motion.div>
            ) : (
              publicPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  userReactions={userReactions}
                  onReactionChange={handleReactionChange}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="private" className="mt-4 space-y-4">
            {!isMember ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Only {tribe?.name} members can see private posts</p>
              </motion.div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : privatePosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No private posts yet</p>
              </motion.div>
            ) : (
              privatePosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  userReactions={userReactions}
                  onReactionChange={handleReactionChange}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default TribePage;
