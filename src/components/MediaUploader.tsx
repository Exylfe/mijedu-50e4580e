import { useState, useRef } from 'react';
import { Image, Video, Music, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const MediaUploader = ({ onMediaUploaded, onMediaRemoved, mediaUrl, mediaType }: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMediaCategory = (mimeType: string): string => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
    if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
    if (ALLOWED_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_TYPES.file.includes(mimeType)) return 'file';
    return 'unknown';
  };

  const handleUpload = async (file: File) => {
    try {
      // 1. Prepare the file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Attempt the upload
      const { data, error } = await supabase.storage
        .from('post-media') // Ensure this matches your bucket name
        .upload(filePath, file);

      // 3. If Supabase returns an error, "throw" it to the catch block
      if (error) throw error;

      console.log("Upload successful!", data);
      return data;

    } catch (error) {
      // 4. This block runs if ANYTHING goes wrong
      // It prevents the app from crashing/closing
      console.error("Storage Error Detail:", error instanceof Error ? error.message : String(error));
      
      // Show a message to the user so they know why it failed
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return null;
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

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);

    // Call the new handleUpload function
    const uploadResult = await handleUpload(file);

    if (!uploadResult) {
      setIsUploading(false);
      return;
    }

    // Get the public URL after successful upload
    const filePath = uploadResult.path;
    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(filePath);

    onMediaUploaded(publicUrl, mediaCategory);
    setIsUploading(false);
    toast.success('Media uploaded!');
  };

  const handleRemove = () => {
    onMediaRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const allAllowedTypes = Object.values(ALLOWED_TYPES).flat().join(',');

  return (
    <div className="space-y-3">
      {/* Attachment Bar */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
        <span className="text-xs text-muted-foreground mr-2">Attach:</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={allAllowedTypes}
          onChange={handleFileSelect}
          className="hidden"
          id="media-upload"
        />
        <label
          htmlFor="media-upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-purple/20 text-neon-purple text-xs font-medium hover:bg-neon-purple/30 transition-colors cursor-pointer"
        >
          <Image className="w-4 h-4" />
          Photo
        </label>
        <label
          htmlFor="media-upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-pink/20 text-neon-pink text-xs font-medium hover:bg-neon-pink/30 transition-colors cursor-pointer"
        >
          <Video className="w-4 h-4" />
          Video
        </label>
        <label
          htmlFor="media-upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neon-green/20 text-neon-green text-xs font-medium hover:bg-neon-green/30 transition-colors cursor-pointer"
        >
          <Music className="w-4 h-4" />
          Audio
        </label>
        <label
          htmlFor="media-upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          PDF
        </label>
        {isUploading && (
          <Loader2 className="w-4 h-4 animate-spin text-neon-purple ml-auto" />
        )}
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