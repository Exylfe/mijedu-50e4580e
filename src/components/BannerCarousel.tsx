import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  expires_at: string | null;
}

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('id, image_url, link_url, expires_at')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBanners(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('banners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        () => {
          fetchBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handleBannerClick = (linkUrl: string | null) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Hide section if no banners or still loading
  if (isLoading || banners.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 mt-4">
      <div className="relative rounded-xl overflow-hidden shadow-lg shadow-primary/20">
        {/* Banner slides */}
        <div className="relative h-32 sm:h-40">
          <AnimatePresence mode="wait">
            <motion.button
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleBannerClick(banners[currentIndex]?.link_url)}
              className="absolute inset-0 w-full h-full cursor-pointer group"
              disabled={!banners[currentIndex]?.link_url}
            >
              <img
                src={banners[currentIndex]?.image_url}
                alt="Advertisement"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Hover overlay */}
              {banners[currentIndex]?.link_url && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              {/* Ad label */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                AD
              </div>
            </motion.button>
          </AnimatePresence>
        </div>

        {/* Navigation arrows (only if more than 1 banner) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-colors shadow-md"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-colors shadow-md"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;
