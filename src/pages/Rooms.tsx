import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, ArrowLeft, Clock, Flame, Lock, Globe, Timer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

interface RoomWithDetails {
  id: string;
  title: string;
  created_at: string;
  tribe: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  post_visibility: string;
  post_tribe: string | null;
  fire_count: number;
  message_count: number;
}

const PAGE_SIZE = 20;
const ROOM_TTL_HOURS = 24;

const Rooms = () => {
  const { user, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('chat');
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    fetchRooms(false);

    const channel = supabase
      .channel('rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        setCursor(null);
        setHasMore(true);
        fetchRooms(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.tribe, showExpired]);

  const enrichRooms = async (roomsData: any[]): Promise<RoomWithDetails[]> => {
    if ((!profile?.tribe && !isSuperAdmin) || roomsData.length === 0) return [];

    const postIds = roomsData.filter(r => r.post_id).map(r => r.post_id);
    const roomIds = roomsData.map(r => r.id);

    const [postsResult, countsResult] = await Promise.all([
      postIds.length > 0
        ? supabase.from('posts').select('id, visibility, target_tribe, fire_count').in('id', postIds)
        : Promise.resolve({ data: [] }),
      supabase.rpc('get_room_message_counts', { room_ids: roomIds })
    ]);

    const postsMap = new Map(
      (postsResult.data || []).map(p => [p.id, { visibility: p.visibility, target_tribe: p.target_tribe, fire_count: p.fire_count }])
    );

    const messageCountMap = new Map<string, number>();
    (countsResult.data || []).forEach((r: any) => {
      messageCountMap.set(r.room_id, Number(r.message_count));
    });

    return roomsData
      .map(room => {
        const postInfo = room.post_id ? postsMap.get(room.post_id) : null;
        return {
          id: room.id,
          title: room.title,
          created_at: room.created_at,
          tribe: room.tribe,
          is_active: room.is_active,
          last_activity_at: room.last_activity_at,
          post_visibility: postInfo?.visibility || 'public',
          post_tribe: postInfo?.target_tribe || null,
          fire_count: postInfo?.fire_count || 0,
          message_count: messageCountMap.get(room.id) || 0
        };
      })
      .filter(room => {
        if (isSuperAdmin) return true;
        if (room.post_visibility === 'public') return true;
        if (room.post_visibility === 'private') {
          return room.post_tribe === profile?.tribe || room.tribe === profile?.tribe;
        }
        return false;
      });
  };

  const fetchRooms = useCallback(async (loadMore: boolean, explicitCursor?: { created_at: string; id: string } | null) => {
    if (!profile?.tribe && !isSuperAdmin) { setIsLoading(false); return; }

    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    let query = supabase
      .from('rooms')
      .select('id, title, created_at, tribe, post_id, is_active, last_activity_at');

    // Super admins see all rooms; regular users filter by tribe
    if (!isSuperAdmin && profile?.tribe) {
      query = query.or(`tribe.eq.${profile.tribe},tribe.eq.global,tribe.is.null`);
    }

    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    // By default only show active rooms
    if (!showExpired) {
      query = query.eq('is_active', true);
    }

    const activeCursor = loadMore ? (explicitCursor ?? null) : null;
    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data: roomsData, error } = await query;

    if (error) {
      console.error('Error fetching rooms:', error);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!roomsData || roomsData.length === 0) {
      if (!loadMore) setRooms([]);
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    setHasMore(roomsData.length === PAGE_SIZE);
    const lastItem = roomsData[roomsData.length - 1];
    setCursor({ created_at: lastItem.created_at, id: lastItem.id });

    const enriched = await enrichRooms(roomsData);

    if (loadMore) {
      setRooms(prev => [...prev, ...enriched]);
    } else {
      setRooms(enriched);
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [profile?.tribe, showExpired, isSuperAdmin]);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    if (item === 'home') navigate('/feed');
    else if (item === 'discover') navigate('/explore');
    else if (item === 'chat') navigate('/tribe-feed');
    else if (item === 'market') navigate('/market');
    else setActiveNav(item);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const getTimeRemaining = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return null;
    const lastActivity = new Date(lastActivityAt);
    const expiresAt = new Date(lastActivity.getTime() + ROOM_TTL_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) fetchRooms(true, cursor);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/feed')} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <MessageSquare className="w-6 h-6 text-neon-purple" />
            <div>
              <h1 className="text-lg font-bold gradient-text">Hot Tea Rooms</h1>
              <p className="text-xs text-muted-foreground">Live discussions on trending posts</p>
            </div>
          </div>
          <button
            onClick={() => setShowExpired(!showExpired)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              showExpired
                ? 'bg-muted text-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {showExpired ? 'Hide expired' : 'Show expired'}
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">No live tea in your circle right now</p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Check the Public Feed for hot posts! Rooms are created when posts get 🔥🔥🔥
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {rooms.map((room, index) => {
              const isExpired = !room.is_active;
              const timeRemaining = room.is_active ? getTimeRemaining(room.last_activity_at) : null;
              const isUrgent = timeRemaining && !timeRemaining.includes('h') && timeRemaining !== 'Expired';

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isExpired && navigate(`/room/${room.id}`)}
                  className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all group ${
                    isExpired
                      ? 'border-border/30 bg-muted/30 opacity-60 cursor-default'
                      : 'border-border/50 bg-card/50 hover:border-neon-purple/50 cursor-pointer'
                  }`}
                >
                  {/* Expired overlay */}
                  {isExpired && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-background/40 z-10">
                      <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        Room expired
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {/* Time remaining badge */}
                    {timeRemaining && !isExpired && (
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        isUrgent
                          ? 'text-destructive bg-destructive/10 animate-pulse'
                          : 'text-muted-foreground bg-muted/50'
                      }`}>
                        <Timer className="w-3 h-3" />
                        <span>{timeRemaining}</span>
                      </div>
                    )}

                    {room.post_visibility === 'private' ? (
                      <div className="flex items-center gap-1 text-xs text-neon-green bg-neon-green/10 px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span>{room.post_tribe || room.tribe}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-neon-purple bg-neon-purple/10 px-2 py-1 rounded-full">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isExpired
                        ? 'bg-muted/50'
                        : 'bg-gradient-to-br from-neon-purple/30 to-neon-pink/30'
                    }`}>
                      <MessageSquare className={`w-6 h-6 ${isExpired ? 'text-muted-foreground' : 'text-neon-purple'}`} />
                    </div>
                    <div className="flex-1 min-w-0 pr-24">
                      <h3 className={`font-semibold transition-colors truncate ${
                        isExpired
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground group-hover:text-neon-purple'
                      }`}>
                        {room.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-destructive" />
                          <span>{room.fire_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{room.message_count} msgs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(room.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isExpired && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-purple/5 to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {hasMore && !isLoading && rooms.length > 0 && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="px-6">
              {isLoadingMore ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : 'Load more'}
            </Button>
          </div>
        )}

        {!hasMore && rooms.length > 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">You've seen all rooms 🍵</p>
          </div>
        )}
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default Rooms;
