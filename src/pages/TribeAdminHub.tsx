import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, ShieldCheck, Flag, MessageSquare, 
  BarChart3, TrendingUp, Clock, Pin, AlertTriangle,
  CheckCircle, XCircle, Crown, GraduationCap, Menu
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import AdaptiveLogo from '@/components/AdaptiveLogo';

interface TribeMember {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  is_verified: boolean;
  student_id_url?: string;
  created_at: string;
}

interface FlaggedPost {
  id: string;
  content: string;
  report_count: number;
  user_id: string;
  created_at: string;
  profiles: {
    nickname: string;
    tribe: string;
  } | null;
}

interface TribeInfo {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
}

const TribeAdminHub = () => {
  const { tribeName } = useParams<{ tribeName: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, adminTribe } = useAuth();
  const { toast } = useToast();
  
  const [tribe, setTribe] = useState<TribeInfo | null>(null);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('members');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  
  // Analytics state
  const [newMembersThisWeek, setNewMembersThisWeek] = useState(0);
  const [activityByHour, setActivityByHour] = useState<Record<number, number>>({});

  // Determine which tribe to manage
  const targetTribe = tribeName ? decodeURIComponent(tribeName) : adminTribe;

  // Access control
  const hasAccess = isSuperAdmin || (isAdmin && adminTribe === targetTribe);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    
    if (!hasAccess) {
      toast({ title: 'Access denied', description: 'You do not have permission to manage this tribe', variant: 'destructive' });
      navigate('/gatekeeper');
      return;
    }

    if (targetTribe) {
      fetchData();
    }
  }, [user, isAdmin, hasAccess, targetTribe]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTribeInfo(),
      fetchMembers(),
      fetchFlaggedPosts(),
      fetchAnalytics()
    ]);
    setLoading(false);
  };

  const fetchTribeInfo = async () => {
    if (!targetTribe) return;
    const { data } = await supabase
      .from('tribes')
      .select('*')
      .eq('name', targetTribe)
      .single();
    if (data) setTribe(data);
  };

  const fetchMembers = async () => {
    if (!targetTribe) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tribe', targetTribe)
      .order('created_at', { ascending: false });
    if (data) setMembers(data as TribeMember[]);
  };

  const fetchFlaggedPosts = async () => {
    if (!targetTribe) return;
    const { data } = await supabase
      .from('posts')
      .select(`
        id, content, report_count, user_id, created_at,
        profiles!posts_user_id_profiles_fkey (nickname, tribe)
      `)
      .gt('report_count', 0)
      .eq('is_hidden', false)
      .order('report_count', { ascending: false });
    
    if (data) {
      // Filter to posts from tribe members
      const tribePosts = data.filter(p => (p.profiles as any)?.[0]?.tribe === targetTribe);
      setFlaggedPosts(tribePosts as unknown as FlaggedPost[]);
    }
  };

  const fetchAnalytics = async () => {
    if (!targetTribe) return;
    
    // New members this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tribe', targetTribe)
      .gte('created_at', weekAgo.toISOString());
    
    setNewMembersThisWeek(count || 0);
    
    // Activity by hour (from posts)
    const { data: posts } = await supabase
      .from('posts')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (posts) {
      const hourCounts: Record<number, number> = {};
      posts.forEach(post => {
        const hour = new Date(post.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      setActivityByHour(hourCounts);
    }
  };

  const logAdminAction = async (actionType: string, targetType: string, targetId?: string, details?: object) => {
    if (!user?.id) return;
    await supabase.from('admin_action_logs').insert([{
      admin_id: user.id,
      action: actionType,
      target_user_id: targetId || null,
      details: { target_type: targetType, target_tribe: targetTribe || null, ...(details || {}) } as unknown as Record<string, never>
    }]);
  };

  const handleVerifyStudent = async (memberId: string, userId: string) => {
    setProcessingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to verify student', variant: 'destructive' });
    } else {
      await logAdminAction('verify_student', 'profile', userId, { action: 'verified' });
      toast({ title: 'Success', description: 'Student verified successfully' });
      fetchMembers();
    }
    setProcessingId(null);
  };

  const handleFlagStudent = async (userId: string) => {
    setProcessingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to flag student', variant: 'destructive' });
    } else {
      await logAdminAction('flag_student', 'profile', userId, { action: 'flagged' });
      toast({ title: 'Success', description: 'Student flagged for moderation' });
      fetchMembers();
    }
    setProcessingId(null);
  };

  const handleKeepPost = async (postId: string) => {
    setProcessingId(postId);
    const { error } = await supabase
      .from('posts')
      .update({ report_count: 0 })
      .eq('id', postId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to clear reports', variant: 'destructive' });
    } else {
      await logAdminAction('keep_post', 'post', postId, { action: 'cleared_reports' });
      toast({ title: 'Success', description: 'Post reports cleared' });
      fetchFlaggedPosts();
    }
    setProcessingId(null);
  };

  const handleRemovePost = async (postId: string) => {
    setProcessingId(postId);
    const { error } = await supabase
      .from('posts')
      .update({ is_hidden: true })
      .eq('id', postId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove post', variant: 'destructive' });
    } else {
      await logAdminAction('remove_post', 'post', postId, { action: 'hidden' });
      toast({ title: 'Success', description: 'Post removed' });
      fetchFlaggedPosts();
    }
    setProcessingId(null);
  };

  const handleBroadcast = async () => {
    if (!broadcastContent.trim() || !user) return;
    
    setBroadcastSubmitting(true);
    const pinnedUntil = new Date();
    pinnedUntil.setHours(pinnedUntil.getHours() + 24);
    
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: broadcastContent,
      visibility: 'private',
      target_tribe: targetTribe,
      is_pinned: true,
    });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to create broadcast', variant: 'destructive' });
    } else {
      await logAdminAction('broadcast', 'post', undefined, { content: broadcastContent.substring(0, 100) });
      toast({ title: 'Success', description: 'Broadcast pinned to tribe feed for 24 hours' });
      setBroadcastContent('');
    }
    setBroadcastSubmitting(false);
  };

  // Get peak hours
  const peakHours = Object.entries(activityByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {tribe?.logo_url ? (
              <img src={tribe.logo_url} alt={tribe.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-500" />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-foreground">Tribe Admin Hub</h1>
              <p className="text-[10px] text-muted-foreground">{targetTribe}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20">
            {isSuperAdmin ? (
              <Crown className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
            )}
            <span className="text-[10px] font-medium text-foreground">
              {isSuperAdmin ? 'Super Admin' : 'Tribe Admin'}
            </span>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">+{newMembersThisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{members.filter(m => !m.is_verified).length}</p>
                <p className="text-xs text-muted-foreground">Pending Verify</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flag className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{flaggedPosts.length}</p>
                <p className="text-xs text-muted-foreground">Flagged Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 bg-muted/30">
            <TabsTrigger value="members" className="gap-1 text-xs">
              <Users className="w-3.5 h-3.5" />
              Members
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1 text-xs">
              <Flag className="w-3.5 h-3.5" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1 text-xs">
              <Pin className="w-3.5 h-3.5" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tribe Members</h2>
              <Badge variant="outline" className="bg-muted/50">
                {members.filter(m => !m.is_verified).length} pending
              </Badge>
            </div>
            
            {members.map(member => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {member.nickname?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {member.is_verified ? (
                    <>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-500 hover:text-amber-600"
                        onClick={() => handleFlagStudent(member.user_id)}
                        disabled={processingId === member.user_id}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                        Pending
                      </Badge>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleVerifyStudent(member.id, member.user_id)}
                        disabled={processingId === member.user_id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            
            {members.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members in this tribe yet</p>
              </div>
            )}
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Flagged Content</h2>
              <Badge variant="outline" className="bg-destructive/10 text-destructive">
                {flaggedPosts.length} flagged
              </Badge>
            </div>
            
            {flaggedPosts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-destructive/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{post.profiles?.nickname || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="destructive" className="gap-1">
                    <Flag className="w-3 h-3" />
                    {post.report_count} reports
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleKeepPost(post.id)}
                    disabled={processingId === post.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Keep Post
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRemovePost(post.id)}
                    disabled={processingId === post.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {flaggedPosts.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No flagged content to review</p>
              </div>
            )}
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="mt-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pin className="w-5 h-5 text-primary" />
                  Tribe Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create an announcement that will be pinned to the top of the Tribe Feed for 24 hours.
                  Use this for important campus-wide emergencies or events.
                </p>
                
                <Textarea
                  placeholder="Write your broadcast message..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="min-h-[120px] bg-background"
                />
                
                <Button
                  onClick={handleBroadcast}
                  disabled={!broadcastContent.trim() || broadcastSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-purple-600"
                >
                  <Pin className="w-4 h-4 mr-2" />
                  {broadcastSubmitting ? 'Broadcasting...' : 'Pin to Tribe Feed'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Tribe Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-4xl font-bold text-foreground mb-2">+{newMembersThisWeek}</p>
                  <p className="text-muted-foreground">new members this week</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{members.filter(m => m.is_verified).length}</p>
                    <p className="text-xs text-muted-foreground">Verified Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{members.filter(m => !m.is_verified).length}</p>
                    <p className="text-xs text-muted-foreground">Pending Verification</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Activity Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Peak activity hours when the Bwalo is loudest:
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  {peakHours.length > 0 ? (
                    peakHours.map((hour, idx) => (
                      <div
                        key={hour}
                        className={`text-center p-3 rounded-xl ${
                          idx === 0 
                            ? 'bg-amber-500/20 border border-amber-500/30' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <p className={`text-lg font-bold ${idx === 0 ? 'text-amber-500' : 'text-foreground'}`}>
                          {hour}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {idx === 0 ? 'Peak Hour' : `#${idx + 1}`}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-4">
                      <p className="text-muted-foreground">Not enough data yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TribeAdminHub;
