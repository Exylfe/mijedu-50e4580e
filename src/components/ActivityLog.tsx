import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, UserPlus, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ActivityItem {
  id: string;
  type: 'post' | 'user' | 'comment';
  message: string;
  timestamp: string;
  tribe?: string;
}

const ActivityLog = () => {
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
          message: `${profile?.nickname || 'Someone'} posted in ${profile?.tribe || 'Society'}`,
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
          message: `${user.nickname} joined ${user.tribe}`,
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
          message: `${profile?.nickname || 'Someone'} commented on a post`,
          timestamp: comment.created_at,
          tribe: profile?.tribe
        });
      });
    }

    // Sort all activities by timestamp (newest first) and take top 20
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
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4" />;
      case 'user':
        return <UserPlus className="w-4 h-4" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post':
        return 'bg-primary/10 text-primary';
      case 'user':
        return 'bg-emerald-100 text-emerald-600';
      case 'comment':
        return 'bg-secondary/10 text-secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Activity Log</h3>
          <p className="text-sm text-muted-foreground">Recent activity across the app</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">No activity yet</p>
          <p className="text-muted-foreground text-sm">Activity will appear here as users interact</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors"
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>

              {/* Tribe badge */}
              {activity.tribe && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary font-medium flex-shrink-0">
                  {activity.tribe}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
