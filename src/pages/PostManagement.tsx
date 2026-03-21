import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Trash2, EyeOff, Eye, Pin, Lock, Unlock, 
  Search, Filter, MessageSquare, Flame, AlertTriangle, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ManagedPost {
  id: string;
  content: string;
  user_id: string;
  tribe_id: string | null;
  fire_count: number;
  report_count: number;
  is_hidden: boolean;
  is_pinned: boolean;
  comments_locked: boolean;
  reach_limited: boolean;
  visibility: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  nickname?: string;
  tribe_name?: string;
}

const PostManagement = () => {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHidden, setFilterHidden] = useState<boolean | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      navigate('/');
      return;
    }
    if (user && isSuperAdmin) fetchPosts();
  }, [user, isSuperAdmin, authLoading]);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const tribeIds = [...new Set(data.map(p => p.tribe_id).filter(Boolean))] as string[];

      const [profilesRes, tribesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nickname').in('user_id', userIds),
        tribeIds.length > 0 
          ? supabase.from('tribes').select('id, name').in('id', tribeIds) 
          : Promise.resolve({ data: [] })
      ]);

      const nickMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.nickname]));
      const tribeMap = new Map((tribesRes.data || []).map(t => [t.id, t.name]));

      setPosts(data.map(p => ({
        ...p,
        nickname: nickMap.get(p.user_id) || 'Unknown',
        tribe_name: p.tribe_id ? tribeMap.get(p.tribe_id) || null : null
      })));
    }
    setIsLoading(false);
  };

  const toggleHidden = async (post: ManagedPost) => {
    setProcessingId(post.id);
    await supabase.from('posts').update({ is_hidden: !post.is_hidden }).eq('id', post.id);
    toast({ title: post.is_hidden ? 'Post restored' : 'Post contained (hidden)' });
    fetchPosts();
    setProcessingId(null);
  };

  const togglePinned = async (post: ManagedPost) => {
    setProcessingId(post.id);
    await supabase.from('posts').update({ is_pinned: !post.is_pinned }).eq('id', post.id);
    toast({ title: post.is_pinned ? 'Post unpinned' : 'Post pinned' });
    fetchPosts();
    setProcessingId(null);
  };

  const toggleLockComments = async (post: ManagedPost) => {
    setProcessingId(post.id);
    await supabase.from('posts').update({ comments_locked: !post.comments_locked }).eq('id', post.id);
    toast({ title: post.comments_locked ? 'Comments unlocked' : 'Comments locked' });
    fetchPosts();
    setProcessingId(null);
  };

  const deletePost = async (id: string) => {
    setProcessingId(id);
    await supabase.from('posts').delete().eq('id', id);
    toast({ title: 'Post deleted permanently' });
    setDeleteTarget(null);
    fetchPosts();
    setProcessingId(null);
  };

  const filtered = posts.filter(p => {
    if (searchQuery && !p.content.toLowerCase().includes(searchQuery.toLowerCase()) && !p.nickname?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterHidden === true && !p.is_hidden) return false;
    if (filterHidden === false && p.is_hidden) return false;
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-900/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/gatekeeper')} className="p-2 -ml-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <AdaptiveLogo size="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-white">Post Management</h1>
                <p className="text-xs text-slate-400">{filtered.length} posts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search posts or authors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterHidden(filterHidden === true ? null : true)}
            className={`border-slate-700 ${filterHidden === true ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}
          >
            <EyeOff className="w-4 h-4 mr-1" /> Hidden
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterHidden(filterHidden === false ? null : false)}
            className={`border-slate-700 ${filterHidden === false ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}
          >
            <Eye className="w-4 h-4 mr-1" /> Visible
          </Button>
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className={`bg-slate-900/50 border-slate-800 ${post.is_hidden ? 'opacity-60 border-red-500/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium text-sm">{post.nickname}</span>
                        {post.tribe_name && (
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">{post.tribe_name}</Badge>
                        )}
                        {post.is_hidden && <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">Hidden</Badge>}
                        {post.is_pinned && <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>}
                        {post.report_count > 0 && (
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />{post.report_count} reports
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-3">{post.content}</p>
                    </div>
                    {post.media_url && post.media_type === 'image' && (
                      <img src={post.media_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{post.fire_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comment_count || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString()}</span>
                    <Badge variant="outline" className="border-slate-700 text-xs">{post.visibility}</Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleHidden(post)}
                      disabled={processingId === post.id}
                      className={`border-slate-700 text-xs ${post.is_hidden ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      {post.is_hidden ? <><Eye className="w-3 h-3 mr-1" />Restore</> : <><EyeOff className="w-3 h-3 mr-1" />Contain</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePinned(post)}
                      disabled={processingId === post.id}
                      className="border-slate-700 text-slate-400 text-xs"
                    >
                      <Pin className="w-3 h-3 mr-1" />{post.is_pinned ? 'Unpin' : 'Pin'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleLockComments(post)}
                      disabled={processingId === post.id}
                      className="border-slate-700 text-slate-400 text-xs"
                    >
                      {post.comments_locked ? <><Unlock className="w-3 h-3 mr-1" />Unlock</> : <><Lock className="w-3 h-3 mr-1" />Lock</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(post.id)}
                      disabled={processingId === post.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs ml-auto"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deletePost(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostManagement;
