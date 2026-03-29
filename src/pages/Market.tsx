import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Search, ShoppingBag, BadgeCheck, Star, Ban, Sparkles, Filter, Laptop, Home, Book, Shirt, Heart, Pencil, UtensilsCrossed, Wrench, Gamepad2, Dumbbell, BookOpen, Watch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MarketSkeleton } from '@/components/FeedSkeleton';
import ImmersiveHeader from '@/components/ImmersiveHeader';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductDetailModal from '@/components/ProductDetailModal';
import FeaturedPartnerProducts from '@/components/market/FeaturedPartnerProducts';
import { useCategories, type Category } from '@/hooks/useCategories';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buy_link: string | null;
  user_id: string;
  brand_name: string;
  brand_logo_url?: string;
  discount_code?: string;
  is_sold_out?: boolean;
  is_special_offer?: boolean;
  status?: string;
  target_tribe?: string;
  created_at: string;
}

interface Brand {
  user_id: string;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_description: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Laptop, Home, Book, Shirt, Heart, UtensilsCrossed, Wrench, Pencil, Filter, Gamepad2, Dumbbell, BookOpen, Watch, Store,
};

const PAGE_SIZE = 20;

const Market = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isVisible, forceShow } = useScrollVisibility({ threshold: 80 });
  const { categories: dbCategories } = useCategories();
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('market');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);

  useEffect(() => {
    fetchBrands();
    fetchProducts(false);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    fetchProducts(false);
  }, [selectedCategory, selectedBrand, searchQuery]);

  const fetchBrands = async () => {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'vip_brand');

    if (rolesData && rolesData.length > 0) {
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, brand_name, brand_logo_url, brand_description')
        .in('user_id', userIds);
      if (profilesData) setBrands(profilesData as Brand[]);
    }
  };

  const attachBrandInfo = async (productsData: any[]): Promise<Product[]> => {
    if (productsData.length === 0) return [];
    const userIds = [...new Set(productsData.map(p => p.user_id))];

    const [profilesResult, brandsResult] = await Promise.all([
      supabase.from('profiles').select('user_id, brand_name, brand_logo_url, nickname').in('user_id', userIds),
      supabase.from('brands').select('user_id, brand_name, logo_url').in('user_id', userIds)
    ]);

    const brandMap = new Map<string, { brand_name: string; brand_logo_url: string | null }>();
    (profilesResult.data || []).forEach(p => {
      brandMap.set(p.user_id, { brand_name: p.brand_name || p.nickname || 'Partner Shop', brand_logo_url: p.brand_logo_url });
    });
    (brandsResult.data || []).forEach(b => {
      brandMap.set(b.user_id, { brand_name: b.brand_name, brand_logo_url: b.logo_url });
    });

    return productsData.map(p => ({
      ...p,
      brand_name: brandMap.get(p.user_id)?.brand_name || 'Partner Shop',
      brand_logo_url: brandMap.get(p.user_id)?.brand_logo_url
    }));
  };

  const fetchProducts = useCallback(async (loadMore: boolean, explicitCursor?: { created_at: string; id: string } | null) => {
    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    // If filtering by category, first get product IDs from join table
    let categoryProductIds: string[] | null = null;
    if (selectedCategory !== 'all') {
      const { data: pcData } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', selectedCategory);
      categoryProductIds = pcData?.map(d => d.product_id) || [];
      if (categoryProductIds.length === 0) {
        if (!loadMore) setProducts([]);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'approved');

    if (categoryProductIds) {
      query = query.in('id', categoryProductIds);
    }
    if (selectedBrand) {
      query = query.eq('user_id', selectedBrand);
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    // Tribe filtering: show global + user's tribe products
    if (profile?.tribe) {
      query = query.or(`target_tribe.eq.global,target_tribe.eq.${profile.tribe},target_tribe.is.null`);
    }

    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    const activeCursor = loadMore ? (explicitCursor ?? null) : null;
    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data: productsData, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!productsData || productsData.length === 0) {
      if (!loadMore) setProducts([]);
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    setHasMore(productsData.length === PAGE_SIZE);
    const lastItem = productsData[productsData.length - 1];
    setCursor({ created_at: lastItem.created_at, id: lastItem.id });

    const withBrands = await attachBrandInfo(productsData);

    if (loadMore) {
      setProducts(prev => [...prev, ...withBrands]);
    } else {
      setProducts(withBrands);
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [selectedCategory, selectedBrand, searchQuery, profile?.tribe]);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    if (item === 'home') navigate('/feed');
    else if (item === 'chat') navigate('/tribe-feed');
    else if (item === 'discover') navigate('/explore');
    else setActiveNav(item);
  };

  const handleContentTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) return;
    if (!isVisible) forceShow();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) fetchProducts(true, cursor);
  };

  // All filtering is now DB-side; products are already filtered
  const filteredProducts = products;

  const forYouProducts = products.filter(p =>
    p.target_tribe === profile?.tribe
  );

  return (
    <div className="min-h-screen bg-background pb-24" onClick={handleContentTap}>

      <ImmersiveHeader title="Bwalo Market" subtitle="Exclusive student deals" isVisible={isVisible} />
      <div className="h-16" />

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            All
          </button>
          {dbCategories.map((cat) => {
            const IconComp = ICON_MAP[cat.icon || ''] || Filter;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <FeaturedPartnerProducts />

      {/* For You Section */}
      {forYouProducts.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">For You</span>
            </div>
            <span className="text-xs text-muted-foreground">Exclusive for {profile?.tribe}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {forYouProducts.slice(0, 6).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => { setSelectedProduct(product); setIsDetailOpen(true); }}
                className="flex-shrink-0 w-36 rounded-xl border-2 border-primary/40 bg-card overflow-hidden hover:border-primary/60 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="aspect-square bg-muted/30 relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">For You</span>
                  </div>
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-medium text-foreground truncate">{product.title}</h3>
                  <p className="text-sm font-bold text-primary">MK {product.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Brands Row */}
      {brands.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Featured Brands</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all ${
                  selectedBrand === brand.user_id ? 'border-amber-500 bg-amber-500/10' : 'border-border/50 bg-card/50'
                }`}
              >
                <button
                  onClick={() => navigate(`/profile/${brand.user_id}`)}
                  className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2 mx-auto overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                >
                  {brand.brand_logo_url ? (
                    <img src={brand.brand_logo_url} alt={brand.brand_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-primary" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedBrand(selectedBrand === brand.user_id ? null : brand.user_id)}
                  className="text-xs text-center text-foreground font-medium truncate max-w-[80px] block w-full hover:text-primary transition-colors"
                >
                  {brand.brand_name || 'Brand'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="px-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {selectedBrand ? 'Brand Products' : 'All Products'}
        </h2>

        {isLoading ? (
          <MarketSkeleton count={4} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium">No products yet</p>
            <p className="text-muted-foreground text-sm">Partner shops will add products soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedProduct(product); setIsDetailOpen(true); }}
                className="rounded-xl border-2 border-primary/30 bg-card/50 overflow-hidden hover:border-primary/60 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.is_special_offer && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-medium">
                        <Star className="w-2.5 h-2.5" />
                        Exclusive
                      </div>
                    )}
                    {product.is_sold_out ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/90 text-white text-[10px] font-medium">
                        <Ban className="w-2.5 h-2.5" />
                        Sold Out
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium">
                        <BadgeCheck className="w-3 h-3" />
                        Partner
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-primary mb-1 flex items-center gap-1">{product.brand_name}</p>
                  <h3 className="text-sm font-medium text-foreground truncate">{product.title}</h3>
                  <p className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-1">
                    MK {product.price.toLocaleString()}
                  </p>
                  {profile?.user_id && (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-center text-sm font-medium hover:from-primary/30 hover:to-secondary/30 transition-colors">
                        View Details
                      </button>
                    </div>
                  )}
                  {!profile?.user_id && (
                    <button className="block w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-center text-sm font-medium hover:from-primary/30 hover:to-secondary/30 transition-colors">
                      View Details
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && products.length > 0 && (
          <div className="flex justify-center py-6">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="px-6">
              {isLoadingMore ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : 'Load more'}
            </Button>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">You've seen all products 🛍️</p>
          </div>
        )}
      </div>

      <GhostBottomNav activeItem={activeNav} onItemClick={handleNavClick} isVisible={isVisible} />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedProduct(null); }}
      />
    </div>
  );
};

export default Market;
