import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Globe, Lock, Users, Image, Video, Music, FileText, Sparkles, Megaphone } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmojiPicker from './EmojiPicker';
import { useNavigate } from 'react-router-dom';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  defaultVisibility?: 'public' | 'private';
  defaultTribe?: string;
  defaultContent?: string;
}

interface Tribe {
  id: string;
  name: string;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
  file: ['application/pdf']
};

const CreatePostModal = ({ isOpen, onClose, onPostCreated, defaultVisibility, defaultTribe, defaultContent }: CreatePostModalProps) => {
  const { user, profile: realProfile } = useAuth();
  const { isAdmin, isSuperAdmin, isVipBrand, adminTribe, profile } = useSimulatedAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const POST_DRAFT_KEY = 'mijedu_post_draft';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(defaultVisibility !== 'private');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<string>(defaultTribe || '');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [postTag, setPostTag] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Privileged = admin/super_admin/vip_brand (unlimited posting, visibility toggle, tags)
  const isPrivileged = isAdmin || isSuperAdmin || isVipBrand;
  // All verified users with a tribe can post
  const isVerifiedUser = realProfile?.is_verified && realProfile?.tribe_id;
  const canPost = isPrivileged || isVerifiedUser;
  const showVisibilityToggle = isPrivileged;

  // Restore draft / default content when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultContent) {
        setContent(defaultContent);
      } else {
        const draft = localStorage.getItem(POST_DRAFT_KEY);
        if (draft) setContent(draft);
      }
    }
  }, [isOpen, defaultContent]);

  // For regular users, force private visibility
  useEffect(() => {
    if (isOpen && !isPrivileged && isVerifiedUser) {
      setIsPublic(false);
    }
  }, [isOpen, isPrivileged, isVerifiedUser]);

  // Fetch tribes for super admin
  useEffect(() => {
    if (isSuperAdmin && isOpen) {
      const fetchTribes = async () => {
        const { data } = await supabase
          .from('tribes')
          .select('id, name')
          .eq('is_visible', true)
          .order('name');
        if (data) setTribes(data);
      };
      fetchTribes();
    }
  }, [isSuperAdmin, isOpen]);

  const getMediaCategory = (mimeType: string): string => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
    if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_TYPES.file.includes(mimeType)) return 'file';
    return 'unknown';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaCategory = getMediaCategory(file.type);
    if (mediaCategory === 'unknown') {
      toast.error('Unsupported file type. Use images, videos, audio, or PDFs.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);

    let uploadFile: File | Blob = file;
    // Compress images before upload
    if (mediaCategory === 'image') {
      try {
        uploadFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
      } catch { /* use original */ }
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${mediaCategory}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(filePath, uploadFile);

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(filePath);

    setMediaUrl(publicUrl);
    setMediaType(mediaCategory);
    setIsUploading(false);
    toast.success('Media uploaded!');
  };

  const handleRemoveMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (selectedEmojis.length < 3) {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    if (!content.trim() && !mediaUrl) {
      toast.error('Add some content or media to your post');
      return;
    }

    // Soft guards for regular users
    if (!isPrivileged) {
      if (!realProfile?.is_verified) {
        toast.error('You need to be verified before posting');
        navigate('/pending');
        onClose();
        return;
      }
      if (!realProfile?.tribe_id) {
        toast.error('You need to join a tribe before posting');
        navigate('/pending');
        onClose();
        return;
      }

      // Daily limit check: 1 post per day for regular users
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());

      if (!countError && (count ?? 0) >= 1) {
        toast.error("You've reached your daily post limit. Try again tomorrow!");
        return;
      }
    }

    // Security check: VIP brands cannot post private/tribe posts
    if (isVipBrand && !isSuperAdmin && !isAdmin && !isPublic) {
      toast.error('Shop accounts can only post publicly to Society Feed and Bwalo Market');
      return;
    }

    setIsSubmitting(true);

    const finalContent = selectedEmojis.length > 0 
      ? `${selectedEmojis.join(' ')} ${content.trim()}`
      : content.trim();

    const postData: {
      user_id: string;
      content: string;
      visibility: string;
      target_tribe?: string;
      media_url?: string;
      media_type?: string;
      post_tag?: string;
      tribe_id?: string;
    } = {
      user_id: user.id,
      content: finalContent || '📷',
      visibility: isPrivileged ? (isPublic ? 'public' : 'private') : 'private',
    };

    // For regular users, auto-set tribe_id from profile
    if (!isPrivileged && realProfile?.tribe_id) {
      postData.tribe_id = realProfile.tribe_id;
      postData.target_tribe = realProfile.tribe || undefined;
    }

    if (postTag && isPrivileged) {
      postData.post_tag = postTag;
    }

    if (mediaUrl && mediaType) {
      postData.media_url = mediaUrl;
      postData.media_type = mediaType;
    }

    // Handle target tribe for private posts (privileged users)
    if (isPrivileged && !isPublic) {
      if (isSuperAdmin && selectedTribe) {
        postData.target_tribe = selectedTribe;
      } else if (adminTribe) {
        postData.target_tribe = adminTribe;
      } else if (profile?.tribe) {
        postData.target_tribe = profile.tribe;
      }
    }

    const { error } = await supabase
      .from('posts')
      .insert(postData);

    if (error) {
      toast.error(`Failed to create post: ${error.message}`);
      console.error(error);
    } else {
      toast.success(isPublic && isPrivileged ? 'Post shared publicly!' : 'Post shared with your tribe!');
      setContent('');
      localStorage.removeItem(POST_DRAFT_KEY);
      setIsPublic(true);
      setMediaUrl(null);
      setMediaType(null);
      setSelectedTribe('');
      setSelectedEmojis([]);
      setPostTag('');
      onPostCreated();
      onClose();
    }

    setIsSubmitting(false);
  };

  const getVisibilityLabel = () => {
    if (isPublic) {
      return 'Go Public - Visible to all';
    }
    if (isSuperAdmin && selectedTribe) {
      return `Private - ${selectedTribe} only`;
    }
    if (adminTribe) {
      return `Private - ${adminTribe} only`;
    }
    if (profile?.tribe) {
      return `Private - ${profile.tribe} only`;
    }
    return 'Private - Your followers only';
  };

  const getBlockedMessage = () => {
    if (!user) return 'Please log in to create a post.';
    if (!realProfile?.is_verified) return 'Your account is pending verification. You can post once verified.';
    if (!realProfile?.tribe_id) return 'You need to join a tribe before posting.';
    return 'You cannot create posts at this time.';
  };

  const allAllowedTypes = Object.values(ALLOWED_TYPES).flat().join(',');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl"
          >
            <div className="bg-card border-t border-border/50">
              <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create Post
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {!canPost ? (
                <div className="text-center py-12 px-4">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {getBlockedMessage()}
                  </p>
                </div>
              ) : !profile ? (
                <div className="text-center py-12 px-4">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Please complete your profile setup before posting.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Regular user info banner */}
                  {!isPrivileged && (
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-foreground">
                      <Lock className="w-4 h-4 inline mr-1.5 text-primary" />
                      Your post will be shared with <strong>{realProfile?.tribe || 'your tribe'}</strong> members only.
                    </div>
                  )}

                  {/* Media Upload Area */}
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={allAllowedTypes}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="media-upload-modal"
                    />

                    {!mediaUrl ? (
                      <label
                        htmlFor="media-upload-modal"
                        className="block cursor-pointer"
                      >
                        <div className="aspect-square max-h-64 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center hover:bg-muted/30 hover:border-neon-purple/50 transition-all">
                          {isUploading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-neon-purple" />
                          ) : (
                            <>
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center mb-4">
                                <Image className="w-8 h-8 text-foreground" />
                              </div>
                              <p className="text-foreground font-medium mb-1">Add Photo or Video</p>
                              <p className="text-muted-foreground text-sm">Tap to upload media</p>
                            </>
                          )}
                        </div>
                      </label>
                    ) : (
                      <div className="relative aspect-square max-h-64 rounded-2xl overflow-hidden bg-muted/30">
                        <button
                          onClick={handleRemoveMedia}
                          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {selectedEmojis.length > 0 && (
                          <div className="absolute top-2 left-2 z-10 flex gap-1">
                            {selectedEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => removeEmoji(idx)}
                                className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center text-xl hover:bg-destructive/50 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {mediaType === 'image' && (
                          <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        {mediaType === 'video' && (
                          <video src={mediaUrl} controls className="w-full h-full object-cover" />
                        )}
                        {mediaType === 'audio' && (
                          <div className="h-full flex items-center justify-center p-4 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
                            <div className="text-center">
                              <Music className="w-12 h-12 mx-auto mb-4 text-neon-purple" />
                              <audio src={mediaUrl} controls className="w-full" />
                            </div>
                          </div>
                        )}
                        {mediaType === 'file' && (
                          <div className="h-full flex items-center justify-center p-4 bg-muted/30">
                            <div className="text-center">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-neon-purple" />
                              <p className="text-sm font-medium text-foreground">PDF Attached</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attachment & Sticker Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <label htmlFor="media-upload-modal" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-purple/20 text-neon-purple text-xs font-medium hover:bg-neon-purple/30 transition-colors cursor-pointer shrink-0">
                      <Image className="w-4 h-4" /> Photo
                    </label>
                    <label htmlFor="media-upload-modal" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-pink/20 text-neon-pink text-xs font-medium hover:bg-neon-pink/30 transition-colors cursor-pointer shrink-0">
                      <Video className="w-4 h-4" /> Video
                    </label>
                    <label htmlFor="media-upload-modal" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-green/20 text-neon-green text-xs font-medium hover:bg-neon-green/30 transition-colors cursor-pointer shrink-0">
                      <Music className="w-4 h-4" /> Audio
                    </label>
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    {isUploading && (
                      <Loader2 className="w-4 h-4 animate-spin text-neon-purple ml-auto shrink-0" />
                    )}
                  </div>

                  {/* Caption Input */}
                  <div>
                    <Textarea
                      ref={textareaRef}
                      placeholder="Write a caption..."
                      value={content}
                      onChange={(e) => { setContent(e.target.value); localStorage.setItem(POST_DRAFT_KEY, e.target.value); }}
                      className="min-h-[80px] bg-muted/30 border-border/50 resize-none text-base"
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {selectedEmojis.length > 0 && `${selectedEmojis.join(' ')} `}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {content.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Visibility Toggle - privileged users only */}
                  {showVisibilityToggle && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isPublic ? (
                            <Globe className="w-5 h-5 text-neon-green" />
                          ) : (
                            <Lock className="w-5 h-5 text-neon-purple" />
                          )}
                          <div>
                            <Label htmlFor="visibility-toggle" className="text-sm font-medium">
                              {isPublic ? 'Go Public' : 'Private'}
                            </Label>
                            <p className="text-xs text-muted-foreground">{getVisibilityLabel()}</p>
                          </div>
                        </div>
                        <Switch
                          id="visibility-toggle"
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                        />
                      </div>

                      {!isPublic && isSuperAdmin && (
                        <div className="mt-3">
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            <Users className="w-3 h-3 inline mr-1" />
                            Target Tribe or Brand
                          </Label>
                          <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                            <SelectTrigger className="bg-muted/50">
                              <SelectValue placeholder="Choose target..." />
                            </SelectTrigger>
                            <SelectContent>
                              {tribes.map((tribe) => (
                                <SelectItem key={tribe.id} value={tribe.name}>
                                  {tribe.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Tag Selector (admins only) */}
                  {(isAdmin || isSuperAdmin) && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Megaphone className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-medium">Post Tag</Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: '', label: 'None' },
                          { value: 'announcement', label: '📢 Announcement' },
                          { value: 'highlight', label: '✨ Highlight' },
                          { value: 'update', label: '📋 Update' },
                          ...(isSuperAdmin ? [{ value: 'platform_update', label: '🏛️ Platform Update' }] : []),
                        ].map(tag => (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => setPostTag(tag.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              postTag === tag.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && !mediaUrl) || isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 text-base font-semibold"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Share Post
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
