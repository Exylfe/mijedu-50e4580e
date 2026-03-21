import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, UserPlus, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';

interface ActivityItem {
  id: string;
  type: 'post' | 'user' | 'comment';
  message: string;
  timestamp: string;
  tribe?: string;
}

const ActivitySection = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivities = async () => {
    const allActivities: ActivityItem[] = [];

    // Fetch recent posts with profile info
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsData && postsData.length > 0) {
      const postUserIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: postProfiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, tribe')
        .in('user_id', postUserIds);

      const profileMap = new Map(
        (postProfiles || []).map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }])
      );

      postsData.forEach(post => {
        const profile = profileMap.get(post.user_id);
        allActivities.push({
          id: `post-${post.id}`,
          type: 'post',
          message: `${profile?.nickname || 'Someone'} shared a post`,
          timestamp: post.created_at,
          tribe: profile?.tribe
        });
      });
    }

    // Fetch recent users (profiles)
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, nickname, tribe, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersData) {
      usersData.forEach(user => {
        allActivities.push({
          id: `user-${user.id}`,
          type: 'user',
          message: `${user.nickname} joined the community`,
          timestamp: user.created_at,
          tribe: user.tribe
        });
      });
    }

    // Fetch recent comments
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('id, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (commentsData && commentsData.length > 0) {
      const commentUserIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: commentProfiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, tribe')
        .in('user_id', commentUserIds);

      const profileMap = new Map(
        (commentProfiles || []).map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }])
      );

      commentsData.forEach(comment => {
        const profile = profileMap.get(comment.user_id);
        allActivities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          message: `${profile?.nickname || 'Someone'} left a comment`,
          timestamp: comment.created_at,
          tribe: profile?.tribe
        });
      });
    }

    // Sort by timestamp
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(allActivities.slice(0, 20));
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchActivities();
  };

  const getIcon = (type: ActivityItem['type']) => {
    const iconClass = "w-3.5 h-3.5";
    switch (type) {
      case 'post':
        return <FileText className={iconClass} />;
      case 'user':
        return <UserPlus className={iconClass} />;
      case 'comment':
        return <MessageCircle className={iconClass} />;
    }
  };

  const getIconStyle = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post':
        return 'bg-primary/10 text-primary';
      case 'user':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'comment':
        return 'bg-secondary/10 text-secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Activity Log</h3>
          <p className="text-xs text-muted-foreground">Recent community activity</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No activity yet</p>
          <p className="text-xs text-muted-foreground">Activity will appear here as users interact</p>
        </GlassCard>
      ) : (
        <div className="space-y-1.5">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <GlassCard className="p-3">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconStyle(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{activity.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Tribe badge */}
                  {activity.tribe && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/5 text-[10px] text-primary font-medium flex-shrink-0">
                      {activity.tribe}
                    </span>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
