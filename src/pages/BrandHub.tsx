import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft, Package, Eye, MousePointer, Users, TrendingUp, MapPin, Plus, Pencil, Trash2, EyeOff, LayoutDashboard, Store, BarChart3, Settings, Megaphone, Tag, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import GhostBottomNav from '@/components/GhostBottomNav';
import ProductForm from '@/components/shop/ProductForm';

interface BrandData { id: string; brand_name: string; logo_url: string | null; is_active: boolean; status: string; }
interface ProductData { id: string; title: string; description: string | null; price: number; image_url: string | null; is_active: boolean; status: string; is_sold_out: boolean; buy_link: string | null; }

type Section = 'dashboard' | 'view-products' | 'add-product' | 'analytics' | 'promotions';

const BrandHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, clicks: 0, whatsapp: 0, website: 0, followers: 0 });
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    initBrand();
  }, [user]);

  const initBrand = async () => {
    if (!user) return;
    setIsLoading(true);

    // Try to fetch existing brand
    let { data } = await supabase
      .from('brands')
      .select('id, brand_name, logo_url, is_active, status')
      .eq('user_id', user.id)
      .maybeSingle();

    // Auto-create if missing — user was promoted to vip_brand but brand record doesn't exist yet
    if (!data) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, brand_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const brandName = profile?.brand_name || (profile?.nickname ? `${profile.nickname}'s Brand` : 'My Brand');

      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert({ user_id: user.id, brand_name: brandName, is_active: true, status: 'approved' })
        .select('id, brand_name, logo_url, is_active, status')
        .single();

      if (!error && newBrand) {
        data = newBrand;
        // Also update profile brand fields
        await supabase.from('profiles').update({
          brand_name: brandName,
          brand_description: `Official brand for ${profile?.nickname || 'this user'}`
        }).eq('user_id', user.id);
      }
    }

    if (data) {
      setBrand(data);
      await Promise.all([fetchProducts(), fetchStats(data.id)]);
    }
    setIsLoading(false);
  };

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, title, description, price, image_url, is_active, status, is_sold_out, buy_link')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setProducts(data || []);
  }, [user]);

  const fetchStats = async (brandId: string) => {
    if (!user) return;
    const { data: prods } = await supabase.from('products').select('id').eq('user_id', user.id);
    const pIds = prods?.map(p => p.id) || [];
    let views = 0, clicks = 0, whatsapp = 0, website = 0;
    if (pIds.length > 0) {
      const [{ count: vc }, { data: cl }] = await Promise.all([
        supabase.from('product_views').select('*', { count: 'exact', head: true }).in('product_id', pIds),
        supabase.from('product_clicks').select('click_type').in('product_id', pIds),
      ]);
      views = vc || 0;
      clicks = cl?.length || 0;
      whatsapp = cl?.filter(c => c.click_type === 'whatsapp').length || 0;
      website = cl?.filter(c => c.click_type === 'website').length || 0;
    }
    const { count: fc } = await supabase.from('entity_follows').select('*', { count: 'exact', head: true }).eq('entity_type', 'brand').eq('entity_id', brandId);
    setStats({ views, clicks, whatsapp, website, followers: fc || 0 });
  };

  const toggleVisibility = async (p: ProductData) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) toast.error('Failed'); else { toast.success(p.is_active ? 'Hidden' : 'Visible'); fetchProducts(); }
  };

  const deleteProduct = async (p: ProductData) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) toast.error('Failed'); else { toast.success('Deleted'); fetchProducts(); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // If brand still couldn't be created, show a retry — no redirect
  if (!brand) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Brand Office</h1>
          </div>
        </header>
        <div className="px-4 py-12 text-center space-y-4">
          <Crown className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Setting up your brand...</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">We couldn't create your brand automatically. Tap retry or contact an admin.</p>
          <Button onClick={initBrand} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">Retry Setup</Button>
        </div>
        <GhostBottomNav activeItem="home" onItemClick={(item) => { switch (item) { case 'home': navigate('/feed'); break; case 'discover': navigate('/explore'); break; case 'chat': navigate('/tribe-feed'); break; case 'market': navigate('/market'); break; } }} isVisible={true} />
      </div>
    );
  }

  const navItems: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'view-products', label: 'Products', icon: Package },
    { key: 'add-product', label: 'Add Product', icon: Plus },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'promotions', label: 'Promotions', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center overflow-hidden">
              {brand.logo_url ? <img src={brand.logo_url} alt="" className="w-full h-full object-cover" /> : <Crown className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Brand Office</h1>
              <p className="text-xs text-muted-foreground">{brand.brand_name}</p>
            </div>
          </div>
          <Badge className={brand.is_active ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-destructive/15 text-destructive border-destructive/30'}>
            {brand.is_active ? 'Active' : 'Suspended'}
          </Badge>
        </div>
        {/* Section tabs */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-1 no-scrollbar">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveSection(item.key); setEditingProduct(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === item.key ? 'bg-amber-500 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-6">
        {/* === DASHBOARD === */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Eye, label: 'Views', value: stats.views, color: 'text-blue-500' },
                { icon: MousePointer, label: 'Clicks', value: stats.clicks, color: 'text-emerald-500' },
                { icon: Users, label: 'Followers', value: stats.followers, color: 'text-purple-500' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <p className="text-lg font-bold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border">
                <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.whatsapp}</p>
                <p className="text-[10px] text-muted-foreground">WhatsApp Taps</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <MapPin className="w-4 h-4 text-purple-500 mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.website}</p>
                <p className="text-[10px] text-muted-foreground">Website Visits</p>
              </div>
            </div>
            <Button onClick={() => setActiveSection('add-product')} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" /> List New Product
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate(`/brand/${brand.id}`)} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 text-left transition-colors">
                <Store className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Brand Page</p>
                <p className="text-[10px] text-muted-foreground">View public page</p>
              </button>
              <button onClick={() => navigate('/settings')} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 text-left transition-colors">
                <Settings className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Settings</p>
                <p className="text-[10px] text-muted-foreground">Edit brand info</p>
              </button>
            </div>
          </div>
        )}

        {/* === ADD / EDIT PRODUCT === */}
        {activeSection === 'add-product' && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">{editingProduct ? 'Edit Product' : 'Add Brand Product'}</h2>
            <ProductForm
              existingProduct={editingProduct || undefined}
              onSuccess={() => { fetchProducts(); setActiveSection('view-products'); setEditingProduct(null); toast.success('Product saved!'); }}
              onCancel={() => { setActiveSection('view-products'); setEditingProduct(null); }}
            />
          </div>
        )}

        {/* === VIEW PRODUCTS === */}
        {activeSection === 'view-products' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Brand Products ({products.length})</h2>
              <Button size="sm" onClick={() => setActiveSection('add-product')} className="h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {products.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No products yet</p>
                <p className="text-xs text-muted-foreground mt-1">List your first product to start selling</p>
                <Button onClick={() => setActiveSection('add-product')} variant="outline" className="mt-3">List your first product</Button>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-2xl border ${product.is_active ? 'border-border/50 bg-card' : 'border-border/30 bg-muted/30 opacity-70'}`}>
                  <div className="flex items-start gap-3">
                    {product.image_url ? <img src={product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" /> :
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-muted-foreground" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.title}</p>
                      <p className="text-sm text-amber-500 font-semibold">MWK {product.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {!product.is_active && <Badge className="bg-muted text-muted-foreground text-[10px]">Hidden</Badge>}
                        <Badge className={`text-[10px] ${product.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                          {product.status === 'approved' ? 'Live' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingProduct(product); setActiveSection('add-product'); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(product)}>{product.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(product)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* === ANALYTICS === */}
        {activeSection === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Analytics Dashboard</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Views', value: stats.views, icon: Eye, color: 'text-blue-500' },
                { label: 'Total Clicks', value: stats.clicks, icon: MousePointer, color: 'text-emerald-500' },
                { label: 'WhatsApp Taps', value: stats.whatsapp, icon: TrendingUp, color: 'text-green-500' },
                { label: 'Website Visits', value: stats.website, icon: MapPin, color: 'text-purple-500' },
                { label: 'Followers', value: stats.followers, icon: Users, color: 'text-pink-500' },
                { label: 'Products', value: products.length, icon: Package, color: 'text-amber-500' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted-foreground">Detailed trend charts and conversion tracking coming soon.</p>
            </div>
          </div>
        )}

        {/* === PROMOTIONS === */}
        {activeSection === 'promotions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Promotions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-xl bg-card border border-border hover:border-amber-500/50 text-left transition-colors">
                <Tag className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Create Discount</p>
                <p className="text-[10px] text-muted-foreground">Set promo codes for products</p>
              </button>
              <button className="p-4 rounded-xl bg-card border border-border hover:border-amber-500/50 text-left transition-colors">
                <Gift className="w-5 h-5 text-pink-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Flash Sale</p>
                <p className="text-[10px] text-muted-foreground">Time-limited offers</p>
              </button>
              <button className="p-4 rounded-xl bg-card border border-border hover:border-amber-500/50 text-left transition-colors">
                <Megaphone className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Boost Product</p>
                <p className="text-[10px] text-muted-foreground">Promote in marketplace</p>
              </button>
              <button className="p-4 rounded-xl bg-card border border-border hover:border-amber-500/50 text-left transition-colors">
                <BarChart3 className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Campaign History</p>
                <p className="text-[10px] text-muted-foreground">View past promotions</p>
              </button>
            </div>
            <div className="p-6 rounded-xl bg-muted/30 border border-border/50 text-center">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Promotion tools are coming soon. Stay tuned!</p>
            </div>
          </div>
        )}
      </div>

      <GhostBottomNav activeItem="home" onItemClick={(item) => {
        switch (item) { case 'home': navigate('/feed'); break; case 'discover': navigate('/explore'); break; case 'chat': navigate('/tribe-feed'); break; case 'market': navigate('/market'); break; }
      }} isVisible={true} />
    </div>
  );
};

export default BrandHub;
