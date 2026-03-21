import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BarChart3, Eye, Flame, MessageSquare, 
  Users, Radio, TrendingUp, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdaptiveLogo from '@/components/AdaptiveLogo';

interface PostStats {
  id: string;
  content: string;
  view_count: number;
  fire_count: number;
  created_at: string;
}

interface RoomStats {
  id: string;
  title: string;
  member_count: number;
}

const CreatorStudio = () => {
  const { user, profile, isAdmin, isLoading } = useSimulatedAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostStats[]>([]);
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalEngagement, setTotalEngagement] = useState(0);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch user's posts with stats
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, content, view_count, fire_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsData) {
      setPosts(postsData);
      setTotalViews(postsData.reduce((sum, p) => sum + (p.view_count || 0), 0));
      setTotalEngagement(postsData.reduce((sum, p) => sum + (p.fire_count || 0), 0));
    }

    // Fetch rooms created by user
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, title')
      .eq('created_by', user.id)
      .eq('is_active', true);

    if (roomsData) {
      // Get member counts for each room
      const roomsWithCounts = await Promise.all(
        roomsData.map(async (room) => {
          const { count } = await supabase
            .from('room_messages')
            .select('user_id', { count: 'exact', head: true })
            .eq('room_id', room.id);
          
          return {
            ...room,
            member_count: count || 0
          };
        })
      );
      setRooms(roomsWithCounts);
    }

    setLoading(false);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Engagements', value: totalEngagement, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Posts', value: posts.length, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Live Rooms', value: rooms.length, icon: Radio, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <AdaptiveLogo size="w-9 h-9" />
            <div>
              <h1 className="text-base font-bold text-foreground">Creator Studio</h1>
              <p className="text-[10px] text-muted-foreground">
                {profile?.tribe || 'Content'} Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-foreground">Analytics</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Post Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Post Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts yet. Create your first post!
                </p>
              ) : (
                posts.slice(0, 5).map((post) => (
                  <div 
                    key={post.id}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <p className="text-sm text-foreground line-clamp-1 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {post.fire_count || 0} fires
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="w-4 h-4 text-green-500" />
                Live Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active rooms. Create a discussion room!
                </p>
              ) : (
                rooms.map((room) => (
                  <div 
                    key={room.id}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{room.title}</p>
                      <p className="text-xs text-muted-foreground">Active Room</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10">
                      <Users className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-600">{room.member_count}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Pro Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Posts with images get 2x more engagement!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CreatorStudio;
