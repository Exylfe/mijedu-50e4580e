import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

const PALETTE = [
  'from-purple-500 to-pink-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-fuchsia-500 to-purple-600',
  'from-violet-500 to-indigo-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-pink-500',
];

function pickGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar with safe fallback to initials on a deterministic gradient.
 * Used wherever a user image may be missing or fail to load.
 */
const UserAvatar = ({ src, name, size = 40, className, alt }: UserAvatarProps) => {
  const [errored, setErrored] = useState(false);
  const initials = getInitials(name);
  const gradient = pickGradient(name || 'mijedu');
  const showImage = src && !errored;
  const fontSize = Math.max(10, Math.round(size * 0.4));

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full select-none',
        !showImage && `bg-gradient-to-br ${gradient}`,
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={alt || name || 'User avatar'}
      role="img"
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt || name || 'User avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-semibold text-white tracking-wide"
          style={{ fontSize }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
