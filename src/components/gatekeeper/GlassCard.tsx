import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className, gradient = false, hover = false, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm shadow-sm",
        gradient && "bg-gradient-to-br from-card/90 to-card/70",
        hover && "transition-all duration-200 hover:shadow-md hover:border-primary/20",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
