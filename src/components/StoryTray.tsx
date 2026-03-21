import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StoryCreatorModal from './StoryCreatorModal';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  text_overlay: string | null;
  link_url: string | null;
  created_at: string;
  expires_at: string;
  tribe: string | null;
  profile?: {
    nickname: string;
    tribe: string;
  };
}

const StoryTray = () => {
  const { user, isAdmin, isSuperAdmin, isVipBrand } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(0);

  const canCreateStory = isAdmin || isSuperAdmin || isVipBrand;

  const fetchStories = async () => {
    const { data: storiesData, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      setIsLoading(false);
      return;
    }

    if (!storiesData || storiesData.length === 0) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(storiesData.map(s => s.user_id))];

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nickname, tribe')
      .in('user_id', userIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }])
    );

    const storiesWithProfiles = storiesData.map(story => ({
      ...story,
      profile: profilesMap.get(story.user_id)
    }));

    setStories(storiesWithProfiles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('stories-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStoryClick = (story: Story, index: number) => {
    setViewingStory(story);
    setViewingStoryIndex(index);
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const handleNextStory = () => {
    if (viewingStoryIndex < stories.length - 1) {
      const nextIndex = viewingStoryIndex + 1;
      setViewingStoryIndex(nextIndex);
      setViewingStory(stories[nextIndex]);
    } else {
      setViewingStory(null);
    }
  };

  const handlePrevStory = () => {
    if (viewingStoryIndex > 0) {
      const prevIndex = viewingStoryIndex - 1;
      setViewingStoryIndex(prevIndex);
      setViewingStory(stories[prevIndex]);
    }
  };

  // Don't render if loading or no stories and user can't create
  if (isLoading) return null;
  if (stories.length === 0 && !canCreateStory) return null;

  return (
    <>
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story Button - Only for admins */}
          {canCreateStory && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowCreator(true)}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-dashed border-primary/50 flex items-center justify-center hover:border-primary transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Add Story</span>
            </motion.button>
          )}

          {/* Story Items */}
          {stories.map((story, index) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleStoryClick(story, index)}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-primary to-secondary">
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                  {story.media_type === 'video' ? (
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <img
                      src={story.media_url}
                      alt="Story"
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => handleProfileClick(e, story.user_id)}
                className="text-xs text-muted-foreground truncate max-w-16 hover:text-primary transition-colors"
              >
                {story.profile?.nickname || 'User'}
              </button>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Story Creator Modal */}
      <StoryCreatorModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onStoryCreated={fetchStories}
      />

      {/* Story Viewer */}
      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          onClose={() => setViewingStory(null)}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
          hasNext={viewingStoryIndex < stories.length - 1}
          hasPrev={viewingStoryIndex > 0}
        />
      )}
    </>
  );
};

export default StoryTray;
