import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, Plus, Package, Eye, BarChart3, Pencil, Trash2, EyeOff, LayoutDashboard, List, ShoppingBag, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import GhostBottomNav from '@/components/GhostBottomNav';
import ProductForm from '@/components/shop/ProductForm';

interface ShopProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  status: string;
  created_at: string;
  buy_link: string | null;
}

type Section = 'dashboard' | 'list-product' | 'my-products' | 'orders';

const ShopOffice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<{ id: string; shop_name: string; status: string } | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchShop();
  }, [user]);

  const fetchShop = async () => {
    if (!user) return;
    setLoading(true);
    const { data: shopData } = await supabase
      .from('student_shops')
      .select('id, shop_name, status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .maybeSingle();

    if (!shopData) {
      navigate('/settings');
      toast.error('No approved shop found');
      return;
    }
    setShop(shopData);
    await fetchProducts();
    setLoading(false);
  };

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, title, description, price, image_url, is_active, is_sold_out, status, created_at, buy_link')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const list = data || [];
    setProducts(list);

    if (list.length > 0) {
      const ids = list.map(p => p.id);
      const [{ count: vc }, { count: cc }] = await Promise.all([
        supabase.from('product_views').select('*', { count: 'exact', head: true }).in('product_id', ids),
        supabase.from('product_clicks').select('*', { count: 'exact', head: true }).in('product_id', ids),
      ]);
      setStats({ views: vc || 0, clicks: cc || 0 });
    }
  }, [user]);

  const toggleVisibility = async (p: ShopProduct) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active } as any).eq('id', p.id);
    if (error) toast.error('Failed to update');
    else { toast.success(p.is_active ? 'Product hidden' : 'Product visible'); fetchProducts(); }
  };

  const deleteProduct = async (p: ShopProduct) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const navItems: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'list-product', label: 'List Product', icon: Plus },
    { key: 'my-products', label: 'My Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-primary" />
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-primary/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Shop Office</h1>
            <p className="text-xs text-muted-foreground">{shop?.shop_name}</p>
          </div>
        </div>
        {/* Internal Nav */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-1 no-scrollbar">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setActiveSection(item.key); setEditingProduct(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Dashboard */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Package, label: 'Products', value: products.length },
                { icon: Eye, label: 'Views', value: stats.views },
                { icon: BarChart3, label: 'Clicks', value: stats.clicks },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 text-center">
                  <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setActiveSection('list-product')} className="w-full bg-gradient-to-r from-emerald-500 to-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> List New Product
            </Button>
            {/* Recent products */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent Products</h2>
              {products.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 mb-2">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-primary font-semibold">MWK {p.price.toLocaleString()}</p>
                  </div>
                  <Badge className={`text-[10px] ${p.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    {p.status === 'approved' ? 'Live' : 'Pending'}
                  </Badge>
                </div>
              ))}
              {products.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No products yet. List your first product!</p>}
            </div>
          </div>
        )}

        {/* List Product */}
        {activeSection === 'list-product' && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">{editingProduct ? 'Edit Product' : 'List New Product'}</h2>
            <ProductForm
              shopId={shop?.id}
              existingProduct={editingProduct || undefined}
              onSuccess={() => { fetchProducts(); setActiveSection('my-products'); setEditingProduct(null); }}
              onCancel={() => { setActiveSection('my-products'); setEditingProduct(null); }}
            />
          </div>
        )}

        {/* My Products */}
        {activeSection === 'my-products' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">My Products ({products.length})</h2>
              <Button size="sm" onClick={() => setActiveSection('list-product')} className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {products.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No products yet</p>
                <Button onClick={() => setActiveSection('list-product')} variant="outline" className="mt-3">List your first product</Button>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-2xl border ${product.is_active ? 'border-border/50 bg-card' : 'border-border/30 bg-muted/30 opacity-70'}`}
                >
                  <div className="flex items-start gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.title}</p>
                      <p className="text-sm text-primary font-semibold">MWK {product.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {!product.is_active && <Badge className="bg-muted text-muted-foreground text-[10px]">Hidden</Badge>}
                        <Badge className={`text-[10px] ${product.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 border-amber-500/30'}`}>
                          {product.status === 'approved' ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingProduct(product); setActiveSection('list-product'); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(product)}>
                        {product.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(product)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Orders placeholder */}
        {activeSection === 'orders' && (
          <div className="p-8 rounded-2xl border border-border/50 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Orders</p>
            <p className="text-sm text-muted-foreground mt-1">Order management coming soon</p>
          </div>
        )}
      </div>

      <GhostBottomNav activeItem="market" onItemClick={(item) => {
        switch (item) { case 'home': navigate('/feed'); break; case 'discover': navigate('/explore'); break; case 'chat': navigate('/tribe-feed'); break; case 'market': navigate('/market'); break; }
      }} isVisible={true} />
    </div>
  );
};

export default ShopOffice;
