import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ArrowLeft, Clock, Flame, Users, Lock, Globe, Timer, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  status?: string;
  nickname?: string;
  tribe?: string;
}

interface RoomDetails {
  id: string;
  title: string;
  tribe: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  post_visibility: string;
  post_tribe: string | null;
}

const MESSAGE_PAGE_SIZE = 50;
const ROOM_TTL_HOURS = 24;

const RoomChat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('chat');
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<{ created_at: string; id: string } | null>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchRoomAndMessages();

    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        const newMsg = payload.new as Message;
        const { data } = await supabase.from('profiles').select('nickname, tribe').eq('user_id', newMsg.user_id).single();
        newMsg.nickname = data?.nickname;
        newMsg.tribe = data?.tribe;
        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomAndMessages = async () => {
    if (!roomId || !profile?.tribe) { setIsLoading(false); return; }

    const { data: roomData, error: roomError } = await supabase
      .from('rooms').select('id, title, tribe, post_id, is_active, last_activity_at').eq('id', roomId).single();

    if (roomError || !roomData) { setAccessDenied(true); setIsLoading(false); return; }

    // Check tribe access: super admins bypass, others must match tribe
    const roomTribe = roomData.tribe;
    if (!isSuperAdmin && roomTribe && roomTribe !== 'global' && roomTribe !== profile.tribe) {
      setAccessDenied(true); setIsLoading(false); return;
    }

    let postVisibility = 'public';
    let postTribe = null;

    if (roomData.post_id) {
      const { data: postData } = await supabase.from('posts').select('visibility, target_tribe').eq('id', roomData.post_id).single();
      if (postData) { postVisibility = postData.visibility; postTribe = postData.target_tribe; }
    }

    if (postVisibility === 'private' && !isSuperAdmin) {
      if (postTribe !== profile.tribe && roomTribe !== profile.tribe) {
        setAccessDenied(true); setIsLoading(false); return;
      }
    }

    setRoom({
      id: roomData.id,
      title: roomData.title,
      tribe: roomData.tribe,
      is_active: roomData.is_active,
      last_activity_at: roomData.last_activity_at,
      post_visibility: postVisibility,
      post_tribe: postTribe
    });

    // Fetch latest messages
    const { data: messagesData } = await supabase
      .from('room_messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MESSAGE_PAGE_SIZE);

    if (messagesData && messagesData.length > 0) {
      setHasOlderMessages(messagesData.length === MESSAGE_PAGE_SIZE);
      const oldest = messagesData[messagesData.length - 1];
      setOldestCursor({ created_at: oldest.created_at, id: oldest.id });

      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, nickname, tribe').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }]));

      setMessages(messagesData.reverse().map(m => ({
        ...m,
        nickname: profileMap.get(m.user_id)?.nickname,
        tribe: profileMap.get(m.user_id)?.tribe
      })));
    } else {
      setHasOlderMessages(false);
    }

    setIsLoading(false);
  };

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasOlderMessages || !roomId) return;
    const cursorSnapshot = oldestCursor;
    if (!cursorSnapshot) return;
    setIsLoadingOlder(true);

    const { data: olderData } = await supabase
      .from('room_messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .or(`created_at.lt.${cursorSnapshot.created_at},and(created_at.eq.${cursorSnapshot.created_at},id.lt.${cursorSnapshot.id})`)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MESSAGE_PAGE_SIZE);

    if (!olderData || olderData.length === 0) {
      setHasOlderMessages(false);
      setIsLoadingOlder(false);
      return;
    }

    setHasOlderMessages(olderData.length === MESSAGE_PAGE_SIZE);
    const oldest = olderData[olderData.length - 1];
    setOldestCursor({ created_at: oldest.created_at, id: oldest.id });

    const userIds = [...new Set(olderData.map(m => m.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, nickname, tribe').in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, { nickname: p.nickname, tribe: p.tribe }]));

    const enriched = olderData.reverse().map(m => ({
      ...m,
      nickname: profileMap.get(m.user_id)?.nickname,
      tribe: profileMap.get(m.user_id)?.tribe
    }));

    setMessages(prev => [...enriched, ...prev]);
    setIsLoadingOlder(false);
  }, [isLoadingOlder, hasOlderMessages, roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.user_id || !roomId || !room?.is_active) return;
    setIsSending(true);
    const { error } = await supabase.from('room_messages').insert({ room_id: roomId, user_id: profile.user_id, content: newMessage.trim() });
    if (error) console.error('Error sending message:', error);
    setNewMessage('');
    setIsSending(false);
  };

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    if (item === 'home') navigate('/feed');
    else if (item === 'discover') navigate('/explore');
    else if (item === 'chat') navigate('/tribe-feed');
    else if (item === 'market') navigate('/market');
    else setActiveNav(item);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getTimeRemaining = () => {
    if (!room?.last_activity_at || !room.is_active) return null;
    const lastActivity = new Date(room.last_activity_at);
    const expiresAt = new Date(lastActivity.getTime() + ROOM_TTL_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isRoomExpired = room ? !room.is_active : false;
  const timeRemaining = getTimeRemaining();

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-center mb-6">This room is private to a specific tribe you're not part of.</p>
        <Button onClick={() => navigate('/rooms')} variant="outline">Back to Rooms</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/rooms')} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <MessageSquare className="w-6 h-6 text-neon-purple" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold gradient-text truncate">{room?.title || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {room?.post_visibility === 'private' ? (
                  <>
                    <Lock className="w-3 h-3 text-neon-green" />
                    <span className="text-neon-green">{room?.post_tribe || room?.tribe} Only</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Public Discussion</span>
                  </>
                )}
                {timeRemaining && !isRoomExpired && (
                  <span className={`flex items-center gap-1 ml-2 ${
                    !timeRemaining.includes('h') ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    <Timer className="w-3 h-3" />
                    {timeRemaining}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expired banner */}
        {isRoomExpired && (
          <div className="bg-muted border-t border-border/50 px-4 py-2 text-center">
            <p className="text-sm text-muted-foreground font-medium">🔒 This room has expired. Messages are read-only.</p>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        {hasOlderMessages && !isLoading && messages.length > 0 && (
          <div className="flex justify-center py-3" ref={messagesTopRef}>
            <Button variant="ghost" size="sm" onClick={loadOlderMessages} disabled={isLoadingOlder} className="text-xs">
              {isLoadingOlder ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : 'Load older messages'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Flame className="w-12 h-12 text-destructive mb-4" />
            <p className="text-foreground font-medium">
              {isRoomExpired ? 'This room had no messages' : 'Start the conversation!'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isRoomExpired ? 'The room expired before anyone joined' : 'Be the first to drop some hot takes'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-1' : ''}`}>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        <span className="text-neon-purple text-xs font-medium">{message.nickname || 'Unknown'}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink font-medium">
                          {message.tribe || 'Unknown'}
                        </span>
                      </div>
                    )}
                    <div className={`relative px-4 py-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-foreground rounded-2xl rounded-br-md shadow-lg shadow-neon-purple/20'
                        : 'bg-card border-2 border-neon-pink/30 text-foreground rounded-2xl rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        <span className={`text-[10px] ${isOwn ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                          {formatTime(message.created_at)}
                        </span>
                        {isOwn && (
                          message.status === 'delivered' || message.status === 'read'
                            ? <CheckCheck className={`w-3 h-3 ${message.status === 'read' ? 'text-blue-400' : 'text-muted-foreground/70'}`} />
                            : <Check className="w-3 h-3 text-muted-foreground/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input - disabled when room is expired */}
      <div className="fixed bottom-20 left-0 right-0 p-4 glass border-t border-border/50">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Input
            placeholder={isRoomExpired ? 'Room expired — read only' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-muted/50"
            disabled={isSending || isRoomExpired}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || isRoomExpired}
            className="bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default RoomChat;
