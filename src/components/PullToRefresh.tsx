import { useState, useRef, useCallback, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void;
  children: ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, MAX_PULL));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1200);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: pullDistance > 0 || isRefreshing ? `${isRefreshing ? 48 : pullDistance}px` : '0px',
          transition: pulling.current ? 'none' : 'height 0.3s ease',
        }}
      >
        <div
          className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            opacity: Math.min(pullDistance / THRESHOLD, 1),
            transform: `rotate(${pullDistance * 3}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
