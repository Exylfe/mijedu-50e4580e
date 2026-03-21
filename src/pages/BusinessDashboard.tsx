import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Plus, Edit, Trash2, ExternalLink, Megaphone, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCategories, getProductCategories, setProductCategories } from '@/hooks/useCategories';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buy_link: string | null;
  is_active: boolean;
}

interface PromotedPost {
  id: string;
  content: string;
  target_link: string | null;
  is_active: boolean;
  created_at: string;
}

const BusinessDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useCategories();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<PromotedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Product form
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    image_url: '',
    buy_link: ''
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  
  // Promoted post form
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotedPost | null>(null);
  const [promoForm, setPromoForm] = useState({
    content: '',
    target_link: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [productsRes, promosRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('promoted_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (promosRes.data) setPromotedPosts(promosRes.data);
    setIsLoading(false);
  };

  const handleProductSubmit = async () => {
    if (!user || !productForm.title || !productForm.price) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const productData = {
      user_id: user.id,
      title: productForm.title,
      description: productForm.description || null,
      price: parseFloat(productForm.price),
      image_url: productForm.image_url || null,
      buy_link: productForm.buy_link || null,
      is_active: true
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast({ title: 'Error updating product', variant: 'destructive' });
        return;
      }
      await setProductCategories(editingProduct.id, selectedCategoryIds);
      toast({ title: 'Product updated!' });
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (error || !data) {
        toast({ title: 'Error creating product', variant: 'destructive' });
        return;
      }
      await setProductCategories(data.id, selectedCategoryIds);
      toast({ title: 'Product added!' });
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ title: '', description: '', price: '', image_url: '', buy_link: '' });
    setSelectedCategoryIds([]);
    fetchData();
  };

  const handlePromoSubmit = async () => {
    if (!user || !promoForm.content) {
      toast({ title: 'Please enter content', variant: 'destructive' });
      return;
    }

    const promoData = {
      user_id: user.id,
      content: promoForm.content,
      target_link: promoForm.target_link || null,
      is_active: true
    };

    if (editingPromo) {
      const { error } = await supabase
        .from('promoted_posts')
        .update(promoData)
        .eq('id', editingPromo.id);

      if (error) {
        toast({ title: 'Error updating promo', variant: 'destructive' });
        return;
      }
      toast({ title: 'Promoted post updated!' });
    } else {
      const { error } = await supabase
        .from('promoted_posts')
        .insert(promoData);

      if (error) {
        toast({ title: 'Error creating promo', variant: 'destructive' });
        return;
      }
      toast({ title: 'Promoted post created!' });
    }

    setShowPromoModal(false);
    setEditingPromo(null);
    setPromoForm({ content: '', target_link: '' });
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product deleted' });
    fetchData();
  };

  const deletePromo = async (id: string) => {
    await supabase.from('promoted_posts').delete().eq('id', id);
    toast({ title: 'Promo deleted' });
    fetchData();
  };

  const openEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      buy_link: product.buy_link || ''
    });
    const catIds = await getProductCategories(product.id);
    setSelectedCategoryIds(catIds);
    setShowProductModal(true);
  };

  const openEditPromo = (promo: PromotedPost) => {
    setEditingPromo(promo);
    setPromoForm({
      content: promo.content,
      target_link: promo.target_link || ''
    });
    setShowPromoModal(true);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-gold/10 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 glass border-b border-neon-gold/30">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neon-gold/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-neon-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neon-gold">Business Dashboard</h1>
              <p className="text-xs text-muted-foreground">{profile?.brand_name || 'Your Brand'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/market')}>
            View Market
          </Button>
        </div>
      </header>

      <Tabs defaultValue="products" className="px-4 py-4">
        <TabsList className="w-full bg-muted/50">
          <TabsTrigger value="products" className="flex-1 gap-2">
            <Package className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="promos" className="flex-1 gap-2">
            <Megaphone className="w-4 h-4" /> Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-foreground font-medium">Your Products</h2>
            <Button size="sm" onClick={() => { setEditingProduct(null); setProductForm({ title: '', description: '', price: '', image_url: '', buy_link: '' }); setSelectedCategoryIds([]); setShowProductModal(true); }} className="bg-neon-gold text-background hover:bg-neon-gold/80">
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-neon-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products yet. Add your first product!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl border-2 border-neon-gold/30 bg-card/50"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-muted/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      <p className="text-neon-gold font-bold mt-1">MK {product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteProduct(product.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-foreground font-medium">Promoted Posts</h2>
            <Button size="sm" onClick={() => setShowPromoModal(true)} className="bg-neon-gold text-background hover:bg-neon-gold/80">
              <Plus className="w-4 h-4 mr-1" /> New Promo
            </Button>
          </div>

          {promotedPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No promotions yet. Create a sponsored post!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promotedPosts.map((promo) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl border-2 border-neon-gold/30 bg-card/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-neon-gold/20 text-neon-gold font-medium">SPONSORED</span>
                      <p className="text-foreground mt-2">{promo.content}</p>
                      {promo.target_link && (
                        <a href={promo.target_link} target="_blank" rel="noopener noreferrer" className="text-neon-gold text-sm flex items-center gap-1 mt-2">
                          <ExternalLink className="w-3 h-3" /> {promo.target_link}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditPromo(promo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePromo(promo.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="bg-card border-neon-gold/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-neon-gold">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Product Title *"
              value={productForm.title}
              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              className="bg-muted/50"
            />
            <Textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              placeholder="Price (MK) *"
              type="number"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              placeholder="Image URL"
              value={productForm.image_url}
              onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              className="bg-muted/50"
            />
            <Input
              placeholder="Buy Link (WhatsApp/Website)"
              value={productForm.buy_link}
              onChange={(e) => setProductForm({ ...productForm, buy_link: e.target.value })}
              className="bg-muted/50"
            />

            {/* Category Selection */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      selectedCategoryIds.includes(cat.id)
                        ? 'border-neon-gold bg-neon-gold/10 text-neon-gold'
                        : 'border-border bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <Checkbox
                      checked={selectedCategoryIds.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="sr-only"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleProductSubmit} className="w-full bg-neon-gold text-background hover:bg-neon-gold/80">
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promo Modal */}
      <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
        <DialogContent className="bg-card border-neon-gold/30">
          <DialogHeader>
            <DialogTitle className="text-neon-gold">{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="What do you want to promote? *"
              value={promoForm.content}
              onChange={(e) => setPromoForm({ ...promoForm, content: e.target.value })}
              className="bg-muted/50 min-h-[100px]"
            />
            <Input
              placeholder="Target Link (WhatsApp/Website)"
              value={promoForm.target_link}
              onChange={(e) => setPromoForm({ ...promoForm, target_link: e.target.value })}
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">This will appear at the top of the Society Feed with a gold glow.</p>
            <Button onClick={handlePromoSubmit} className="w-full bg-neon-gold text-background hover:bg-neon-gold/80">
              {editingPromo ? 'Save Changes' : 'Create Promotion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDashboard;
