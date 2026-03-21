import { useState, useEffect, useCallback } from 'react';

interface UseScrollVisibilityOptions {
  threshold?: number;
  hideDelay?: number;
}

export const useScrollVisibility = (options: UseScrollVisibilityOptions = {}) => {
  const { threshold = 50, hideDelay = 0 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Always show at top of page
    if (currentScrollY < threshold) {
      setIsVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Scrolling down - hide
    if (currentScrollY > lastScrollY && currentScrollY > threshold) {
      setIsVisible(false);
    }
    // Scrolling up - show
    else if (currentScrollY < lastScrollY) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY, threshold]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const debouncedScroll = () => {
      if (hideDelay > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleScroll, hideDelay);
      } else {
        handleScroll();
      }
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, hideDelay]);

  // Force show on tap (for tap-to-reveal)
  const forceShow = useCallback(() => {
    setIsVisible(true);
  }, []);

  return { isVisible, forceShow };
};
