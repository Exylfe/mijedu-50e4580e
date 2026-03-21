import { motion } from 'framer-motion';
import { Crown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SponsoredPostProps {
  content: string;
  brandName: string;
  brandLogo?: string | null;
  targetLink?: string | null;
  brandUserId?: string | null;
  index: number;
}

const SponsoredPost = ({ content, brandName, brandLogo, targetLink, brandUserId, index }: SponsoredPostProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (targetLink) {
      window.open(targetLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (brandUserId) {
      navigate(`/profile/${brandUserId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      className={`relative p-4 rounded-xl border-2 border-neon-gold/50 bg-card/50 overflow-hidden ${
        targetLink ? 'cursor-pointer hover:border-neon-gold transition-colors' : ''
      }`}
    >
      {/* Gold glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/10 via-transparent to-neon-gold/5 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-gold/20 rounded-full blur-[60px] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <button
          onClick={handleBrandClick}
          className={`w-10 h-10 rounded-full bg-neon-gold/20 border-2 border-neon-gold/50 flex items-center justify-center overflow-hidden ${brandUserId ? 'hover:ring-2 hover:ring-neon-gold/50 transition-all cursor-pointer' : ''}`}
        >
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <Crown className="w-5 h-5 text-neon-gold" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBrandClick}
              className={`text-foreground font-medium ${brandUserId ? 'hover:text-primary transition-colors cursor-pointer' : ''}`}
            >
              {brandName}
            </button>
            <span className="px-2 py-0.5 rounded-full bg-neon-gold/20 border border-neon-gold/30 text-neon-gold text-[10px] font-bold">
              SPONSORED
            </span>
          </div>
        </div>
        {targetLink && (
          <ExternalLink className="w-4 h-4 text-neon-gold" />
        )}
      </div>

      {/* Content */}
      <p className="text-foreground text-sm leading-relaxed relative z-10">
        {content}
      </p>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-gold/50 to-transparent" />
    </motion.div>
  );
};

export default SponsoredPost;
