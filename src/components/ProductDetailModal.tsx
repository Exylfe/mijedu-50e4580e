import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Copy, Check, Store, MessageCircle, Star, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buy_link: string | null;
  brand_name?: string;
  brand_logo_url?: string;
  discount_code?: string;
  is_sold_out?: boolean;
  is_special_offer?: boolean;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  // Track product view when modal opens
  useEffect(() => {
    if (isOpen && product) {
      trackView();
    }
  }, [isOpen, product?.id]);

  const trackView = async () => {
    if (!product) return;
    await supabase.from('product_views').insert({
      product_id: product.id,
      viewer_tribe: profile?.tribe || null
    });
  };

  const trackClick = async (clickType: 'whatsapp' | 'website' | 'details') => {
    if (!product) return;
    await supabase.from('product_clicks').insert({
      product_id: product.id,
      click_type: clickType,
      viewer_tribe: profile?.tribe || null
    });
  };

  if (!product) return null;

  const handleCopyDiscount = () => {
    if (product.discount_code) {
      navigator.clipboard.writeText(product.discount_code);
      setCopied(true);
      toast.success('Discount code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppContact = async () => {
    if (product.is_sold_out) {
      toast.info('This product is currently sold out');
      return;
    }

    const isWhatsApp = product.buy_link?.includes('wa.me') || product.buy_link?.includes('whatsapp');
    await trackClick(isWhatsApp ? 'whatsapp' : 'website');
    
    if (product.buy_link) {
      window.open(product.buy_link, '_blank');
    } else {
      toast.info('Contact the seller through their shop page');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[95vh] overflow-y-auto rounded-t-3xl"
          >
            <div className="bg-card border-t border-border/50">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Product Image - Large */}
              <div className="relative aspect-square max-h-[50vh] bg-muted/30">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-20 h-20 text-muted-foreground" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_special_offer && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium shadow-lg">
                      <Star className="w-3 h-3" />
                      Mijedu Exclusive
                    </div>
                  )}
                  {product.is_sold_out && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-white text-xs font-medium">
                      <Ban className="w-3 h-3" />
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Brand Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-background/90 backdrop-blur-sm">
                  {product.brand_logo_url ? (
                    <img 
                      src={product.brand_logo_url} 
                      alt={product.brand_name || ''} 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">{product.brand_name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-medium">
                    Official Partner
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 space-y-4">
                {/* Title & Price */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{product.title}</h2>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">
                    MK {product.price.toLocaleString()}
                  </p>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Discount Code */}
                {product.discount_code && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-2">Discount Code</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-bold text-primary">
                        {product.discount_code}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyDiscount}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleWhatsAppContact}
                    disabled={product.is_sold_out}
                    className={`flex-1 h-14 gap-2 text-lg ${
                      product.is_sold_out 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {product.is_sold_out ? 'Sold Out' : 'Buy Now / Contact'}
                  </Button>
                </div>

                {product.buy_link && (
                  <a
                    href={product.buy_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in external browser
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
