import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Link, Type, Send, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
};

const StoryCreatorModal = ({ isOpen, onClose, onStoryCreated }: StoryCreatorModalProps) => {
  const { user, profile } = useAuth();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('image');
  const [textOverlay, setTextOverlay] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMediaCategory = (mimeType: string): string => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
    return 'unknown';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaCategory = getMediaCategory(file.type);
    if (mediaCategory === 'unknown') {
      toast.error('Only images and videos are allowed for stories.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);

    const fileName = `stories/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(fileName);

    setMediaUrl(publicUrl);
    setMediaType(mediaCategory);
    setIsUploading(false);
    toast.success('Media uploaded!');
  };

  const handleSubmit = async () => {
    if (!user || !mediaUrl) {
      toast.error('Please upload an image or video first.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        text_overlay: textOverlay || null,
        link_url: linkUrl || null,
        tribe: profile?.tribe || null,
      });

    if (error) {
      toast.error(`Failed to create story: ${error.message}`);
      console.error(error);
    } else {
      toast.success('Story posted! It will disappear in 24 hours.');
      resetForm();
      onStoryCreated();
      onClose();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setMediaUrl(null);
    setMediaType('image');
    setTextOverlay('');
    setLinkUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const allAllowedTypes = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.video].join(',');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md mx-4 bg-card rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-bold gradient-text">Create Story</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Media Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept={allAllowedTypes}
                onChange={handleFileSelect}
                className="hidden"
                id="story-media-upload"
              />

              {!mediaUrl ? (
                <label
                  htmlFor="story-media-upload"
                  className="block cursor-pointer"
                >
                  <div className="aspect-[9/16] max-h-80 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center hover:bg-muted/30 hover:border-primary/50 transition-all">
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-foreground font-medium mb-1">Upload Media</p>
                        <p className="text-muted-foreground text-sm">Image or Video</p>
                        <div className="flex gap-2 mt-3">
                          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1">
                            <Image className="w-3 h-3" /> Photo
                          </span>
                          <span className="px-2 py-1 rounded bg-secondary/10 text-secondary text-xs flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              ) : (
                <div className="relative aspect-[9/16] max-h-80 rounded-xl overflow-hidden bg-black">
                  <button
                    onClick={() => {
                      setMediaUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Text Overlay Preview */}
                  {textOverlay && (
                    <div className="absolute inset-x-0 bottom-20 z-10 px-4">
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-center">
                        {textOverlay}
                      </div>
                    </div>
                  )}

                  {mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Story preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}

              {/* Text Overlay Input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Text Overlay
                </Label>
                <Textarea
                  placeholder="Add text to your story..."
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  className="bg-muted/30 border-border/50 resize-none"
                  rows={2}
                  maxLength={100}
                />
              </div>

              {/* Link Input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Add Link
                </Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!mediaUrl || isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Share Story
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Stories disappear after 24 hours
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StoryCreatorModal;
