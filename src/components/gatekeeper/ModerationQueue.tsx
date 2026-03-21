import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Flag, Eye, EyeOff, Trash2, Check, MessageCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from './GlassCard';

interface ReportedPost {
  id: string;
  content: string;
  user_id: string;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
  nickname?: string;
  tribe?: string;
}

interface ReportedComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  is_hidden: boolean | null;
  created_at: string;
  nickname?: string;
}

const ModerationQueue = () => {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [hiddenComments, setHiddenComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);

    // Fetch reported posts (report_count > 0)
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, content, user_id, report_count, is_hidden, created_at')
      .gt('report_count', 0)
      .order('report_count', { ascending: false })
      .limit(50);

    if (postsData && postsData.length > 0) {
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, tribe')
        .in('user_id', userIds);
      const map = new Map((profiles || []).map(p => [p.user_id, p]));
      setReportedPosts(postsData.map(p => ({
        ...p,
        nickname: map.get(p.user_id)?.nickname || undefined,
        tribe: map.get(p.user_id)?.tribe || undefined,
      })));
    }

    setLoading(false);
  };

  const handleHidePost = async (post: ReportedPost) => {
    await supabase.from('posts').update({ is_hidden: !post.is_hidden }).eq('id', post.id);
    toast.success(post.is_hidden ? 'Post restored' : 'Post hidden');
    fetchQueue();
  };

  const handleDeletePost = async (post: ReportedPost) => {
    if (!confirm('Delete this post permanently?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    toast.success('Post deleted');
    fetchQueue();
  };

  const handleDismiss = async (post: ReportedPost) => {
    // Reset report count to dismiss
    await supabase.from('posts').update({ report_count: 0 }).eq('id', post.id);
    toast.success('Reports dismissed');
    fetchQueue();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Moderation Queue</h2>
            <p className="text-xs text-muted-foreground">
              {reportedPosts.length} reported posts
            </p>
          </div>
        </div>
      </GlassCard>

      {reportedPosts.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-foreground font-medium">All clear!</p>
          <p className="text-sm text-muted-foreground">No reported content to review</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {reportedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard className={`p-4 ${post.is_hidden ? 'opacity-60' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-foreground">{post.nickname || 'Unknown'}</p>
                        <span className="text-xs text-muted-foreground">{post.tribe}</span>
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                          <Flag className="w-3 h-3 mr-1" />
                          {post.report_count} reports
                        </Badge>
                        {post.is_hidden && (
                          <Badge className="bg-muted text-muted-foreground text-[10px]">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleDismiss(post)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleHidePost(post)}
                    >
                      {post.is_hidden ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {post.is_hidden ? 'Restore' : 'Hide'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDeletePost(post)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;
