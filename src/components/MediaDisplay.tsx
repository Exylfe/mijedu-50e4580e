import { FileText, Download, Play } from 'lucide-react';
import { useState } from 'react';

interface MediaDisplayProps {
  mediaUrl: string;
  mediaType: string;
  fullWidth?: boolean;
}

const MediaDisplay = ({ mediaUrl, mediaType, fullWidth = false }: MediaDisplayProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!mediaUrl || !mediaType) return null;

  const containerClass = fullWidth 
    ? 'w-full' 
    : 'mb-4 rounded-lg overflow-hidden border border-border/50';

  const imageClass = fullWidth
    ? 'w-full aspect-square object-cover cursor-pointer hover:opacity-95 transition-opacity'
    : 'w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity';

  const videoClass = fullWidth
    ? 'w-full aspect-square object-cover'
    : 'w-full max-h-96';

  return (
    <div className={containerClass}>
      {mediaType === 'image' && (
        <img 
          src={mediaUrl} 
          alt="Post media" 
          className={imageClass}
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      )}

      {mediaType === 'video' && (
        <div className="relative">
          <video 
            src={mediaUrl} 
            controls={isVideoPlaying}
            className={videoClass}
            playsInline
            muted={!isVideoPlaying}
            preload="metadata"
            onClick={() => {
              setIsVideoPlaying(true);
              const video = document.querySelector(`video[src="${mediaUrl}"]`) as HTMLVideoElement;
              if (video) {
                video.muted = false;
                video.play().catch(console.error);
              }
            }}
            onPlay={() => setIsVideoPlaying(true)}
          />
          {!isVideoPlaying && (
            <button
              onClick={() => {
                setIsVideoPlaying(true);
                const video = document.querySelector(`video[src="${mediaUrl}"]`) as HTMLVideoElement;
                if (video) {
                  video.muted = false;
                  video.play().catch(console.error);
                }
              }}
              className="absolute inset-0 flex items-center justify-center bg-background/30"
            >
              <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center">
                <Play className="w-8 h-8 text-foreground ml-1" />
              </div>
            </button>
          )}
        </div>
      )}

      {mediaType === 'audio' && (
        <div className="p-6 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center animate-pulse">
              <span className="text-3xl">🎵</span>
            </div>
          </div>
          <audio src={mediaUrl} controls className="w-full" />
        </div>
      )}

      {mediaType === 'file' && (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-neon-purple" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">PDF Document</p>
            <p className="text-xs text-muted-foreground">Tap to view</p>
          </div>
          <Download className="w-5 h-5 text-muted-foreground" />
        </a>
      )}
    </div>
  );
};

export default MediaDisplay;
