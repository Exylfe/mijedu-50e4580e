import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import FollowButton from '@/components/FollowButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Brand {
  id: string;
  brand_name: string;
  logo_url: string | null;
  user_id: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buy_link: string | null;
}

interface PromotedPost {
  id: string;
  content: string;
  target_link: string | null;
  created_at: string;
}

const BrandPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<PromotedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('market');

  useEffect(() => {
    if (id) {
      fetchBrand();
      fetchProducts();
      fetchPromotedPosts();
    }
  }, [id]);

  const fetchBrand = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) setBrand(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter products by brand's user_id since products don't have brand_id
    if (data && brand) {
      const brandProducts = data.filter(p => p.user_id === brand.user_id);
      setProducts(brandProducts);
    }
  };

  const fetchPromotedPosts = async () => {
    if (!brand) return;
    
    const { data } = await supabase
      .from('promoted_posts')
      .select('*')
      .eq('user_id', brand.user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setPromotedPosts(data);
  };

  useEffect(() => {
    if (brand) {
      fetchProducts();
      fetchPromotedPosts();
    }
  }, [brand]);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home':
        navigate('/feed');
        break;
      case 'discover':
        navigate('/explore');
        break;
      case 'chat':
        navigate('/tribe-feed');
        break;
      case 'market':
        navigate('/market');
        break;
    }
  };

  if (!brand && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Brand not found</h2>
          <Button onClick={() => navigate('/explore')} className="mt-4">
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background with brand accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/explore')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            {brand?.logo_url ? (
              <img 
                src={brand.logo_url} 
                alt={brand.brand_name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-secondary/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/30">
                <Store className="w-6 h-6 text-secondary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">{brand?.brand_name}</h1>
              <p className="text-xs text-muted-foreground">Official Brand Page</p>
            </div>
          </div>

          <FollowButton entityId={brand?.id} entityType="brand" showCount={true} />
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Promoted Posts Section */}
        {promotedPosts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Featured Announcements
            </h2>
            <div className="space-y-3">
              {promotedPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-4 bg-gradient-to-r from-secondary/5 to-primary/5 border-secondary/20">
                    <p className="text-foreground text-sm">{post.content}</p>
                    {post.target_link && (
                      <a
                        href={post.target_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-secondary text-sm font-medium hover:underline"
                      >
                        Learn More <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Products & Services
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-muted/30 rounded-xl"
            >
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products available yet</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="overflow-hidden border-border/50 hover:border-secondary/30 transition-colors">
                    {product.image_url && (
                      <div className="aspect-square relative">
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-secondary">
                          MK{product.price.toLocaleString()}
                        </span>
                        {product.buy_link && (
                          <a
                            href={product.buy_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary hover:underline"
                          >
                            Buy Now
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default BrandPage;
