import { useState, useRef, useEffect } from 'react';
import { Image, Video, Music, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { useAuth } from '@/contexts/AuthContext';

interface MediaUploaderProps {
  onMediaUploaded: (url: string, type: string) => void;
  onMediaRemoved: () => void;
  mediaUrl: string | null;
  mediaType: string | null;
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
  file: ['application/pdf']
};

const MAX_FILE_SIZE_MB = 50;
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1200,
  initialQuality: 0.7,
  useWebWorker: true,
};

const MediaUploader = ({ onMediaUploaded, onMediaRemoved, mediaUrl, mediaType }: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Clean up blob URLs on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getMediaCategory = (mimeType: string): string => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
    if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_TYPES.file.includes(mimeType)) return 'file';
    return 'unknown';
  };

  const sanitizeFileName = (name: string): string => {
    const ext = name.split('.').pop() || '';
    const base = name.replace(/\.[^/.]+$/, '');
    const sanitized = base.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${sanitized}_${Date.now()}.${ext}`;
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      const compressed = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
      console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
      return compressed;
    } catch (err) {
      console.warn('Image compression failed, using original:', err);
      return file;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaCategory = getMediaCategory(file.type);
    if (mediaCategory === 'unknown') {
      toast.error('Unsupported file type. Use images, videos, audio, or PDFs.');
      return;
    }

    // For images, skip pre-check — compression will handle large files
    // For non-image files, enforce the size limit
    if (mediaCategory !== 'image' && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      // Compress images before upload
      let fileToUpload: File = file;
      if (mediaCategory === 'image') {
        fileToUpload = await compressImage(file);
      }

      // Build sanitized path: userId/category/filename
      const userId = user?.id || 'anonymous';
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${userId}/${mediaCategory}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(filePath, fileToUpload);

      if (error) {
        if (error.message?.includes('Payload too large') || error.message?.includes('413')) {
          toast.error('File is too large for upload. Try a smaller file.');
        } else if (error.message?.includes('mime') || error.message?.includes('type')) {
          toast.error('This file format is not allowed.');
        } else {
          toast.error(`Upload failed: ${error.message}`);
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(data.path);

      // Revoke old preview if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      onMediaUploaded(publicUrl, mediaCategory);
      toast.success('Media uploaded!');
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        toast.error('Network error. Check your internet connection and try again.');
      } else if (err?.message?.includes('memory') || err?.message?.includes('OOM')) {
        toast.error('File too large for your device. Try a smaller photo or screenshot.');
      } else {
        toast.error(`Upload failed: ${err?.message || 'Unknown error. Please try again.'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onMediaRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const allAllowedTypes = Object.values(ALLOWED_TYPES).flat().join(',');

  return (
    <div className="space-y-3">
      {/* Attachment Bar */}
      <div className="relative flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
        {/* Full overlay when uploading */}
        {isUploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg bg-background/90 backdrop-blur-sm">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Optimizing & Uploading…</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground mr-2">Attach:</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={allAllowedTypes}
          onChange={handleFileSelect}
          className="hidden"
          id="media-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="media-upload"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <Image className="w-4 h-4" />
          Photo
        </label>
        <label
          htmlFor="media-upload"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <Video className="w-4 h-4" />
          Video
        </label>
        <label
          htmlFor="media-upload"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/40 text-accent-foreground text-xs font-medium hover:bg-accent/60 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <Music className="w-4 h-4" />
          Audio
        </label>
        <label
          htmlFor="media-upload"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <FileText className="w-4 h-4" />
          PDF
        </label>
      </div>

      {/* Media Preview */}
      {mediaUrl && mediaType && (
        <div className="relative rounded-lg overflow-hidden border border-border/50">
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {mediaType === 'image' && (
            <img 
              src={mediaUrl} 
              alt="Preview" 
              className="w-full max-h-48 object-cover"
            />
          )}

          {mediaType === 'video' && (
            <video 
              src={mediaUrl} 
              controls 
              className="w-full max-h-48"
            />
          )}

          {mediaType === 'audio' && (
            <div className="p-4 bg-muted/30">
              <audio src={mediaUrl} controls className="w-full" />
            </div>
          )}

          {mediaType === 'file' && (
            <div className="p-4 bg-muted/30 flex items-center gap-3">
              <FileText className="w-8 h-8 text-neon-purple" />
              <span className="text-sm text-foreground">PDF Document</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
