import { Globe, Lock } from 'lucide-react';

interface PostTypeBadgeProps {
  visibility: 'public' | 'private' | string;
  targetTribe?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const PostTypeBadge = ({ visibility, targetTribe, size = 'sm', className = '' }: PostTypeBadgeProps) => {
  const isPublic = visibility === 'public';
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  };

  if (isPublic) {
    return (
      <span 
        className={`inline-flex items-center rounded-full bg-neon-green/20 text-neon-green font-medium ${sizeClasses[size]} ${className}`}
        title="Public - Visible to all"
      >
        <Globe className={iconSizes[size]} />
        Public
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full bg-primary/20 text-primary font-medium ${sizeClasses[size]} ${className}`}
      title={targetTribe ? `Private - ${targetTribe} only` : 'Private - Tribe only'}
    >
      <Lock className={iconSizes[size]} />
      {targetTribe || 'Tribe'}
    </span>
  );
};

export default PostTypeBadge;
