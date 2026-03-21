import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedAd {
  enabled: boolean;
  image_url: string | null;
  target_url: string | null;
}

const FeaturedAdBanner = () => {
  const [ad, setAd] = useState<FeaturedAd | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchAd();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('featured-ad-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.featured_ad'
        },
        () => {
          fetchAd();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAd = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'featured_ad')
      .maybeSingle();

    if (!error && data) {
      setAd(data.value as unknown as FeaturedAd);
    }
  };

  if (!ad || !ad.enabled || !ad.image_url || isDismissed) {
    return null;
  }

  const handleClick = () => {
    if (ad.target_url) {
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative mx-4 mt-4 rounded-xl overflow-hidden border border-neon-gold/30 shadow-lg shadow-neon-gold/10"
    >
      {/* Ad content */}
      <button
        onClick={handleClick}
        className="w-full block relative group"
        disabled={!ad.target_url}
      >
        <img
          src={ad.image_url}
          alt="Featured Advertisement"
          className="w-full h-24 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Hover overlay */}
        {ad.target_url && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Sponsored label */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-neon-gold font-medium flex items-center gap-1">
          <span>✨</span>
          AD
        </div>
      </button>

      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default FeaturedAdBanner;