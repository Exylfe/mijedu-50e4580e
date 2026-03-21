import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Star, Ban, Eye, EyeOff, Clock, CheckCircle2, XCircle, Globe, Users, Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
};

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buy_link: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  is_special_offer: boolean;
  discount_code: string | null;
  status: string;
  target_tribe: string | null;
}

interface Tribe {
  id: string;
  name: string;
  type: string;
}

const BrandProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    image_url: '',
    buy_link: '',
    discount_code: '',
    is_special_offer: false,
    target_tribe: 'global'
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTribes();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const productsWithDefaults = data.map(p => ({
        ...p,
        is_sold_out: p.is_sold_out ?? false,
        is_special_offer: p.is_special_offer ?? false,
        discount_code: p.discount_code ?? null,
        status: p.status ?? 'pending_approval',
        target_tribe: p.target_tribe ?? 'global'
      }));
      setProducts(productsWithDefaults);
    }
    setIsLoading(false);
  };

  const fetchTribes = async () => {
    const { data } = await supabase
      .from('tribes')
      .select('id, name, type')
      .eq('is_visible', true)
      .order('name');
    if (data) setTribes(data);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Image must be under 10MB', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadProductImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return form.image_url || null;
    setIsUploading(true);
    const compressed = await compressImage(imageFile);
    const path = `${user.id}/products/${Date.now()}-${compressed.name}`;
    const { error } = await supabase.storage.from('post-media').upload(path, compressed);
    setIsUploading(false);
    if (error) {
      toast({ title: 'Image upload failed', variant: 'destructive' });
      return form.image_url || null;
    }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const notifySuperAdmins = async (productTitle: string) => {
    try {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');
      if (admins && user) {
        const notifications = admins.map(a => ({
          user_id: a.user_id,
          actor_id: user.id,
          type: 'new_product',
          entity_type: 'product',
          message: `New product listed: "${productTitle}" — now live in Bwalo Market`
        }));
        await supabase.from('notifications').insert(notifications);
      }
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }
  };

  const handleSubmit = async () => {
    if (!user || !form.title || !form.price) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const imageUrl = await uploadProductImage();

    const productData = {
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      image_url: imageUrl,
      buy_link: form.buy_link || null,
      discount_code: form.discount_code || null,
      is_special_offer: form.is_special_offer,
      target_tribe: form.target_tribe,
      is_active: true,
      status: 'approved'
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
      toast({ title: 'Product updated!' });
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);
      if (error) {
        toast({ title: 'Error creating product', variant: 'destructive' });
        return;
      }
      toast({ 
        title: 'Product is now live!', 
        description: 'Your product is visible in Bwalo Market. Super admins have been notified.'
      });
      notifySuperAdmins(form.title);
    }

    resetForm();
    fetchProducts();
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
    setForm({
      title: '',
      description: '',
      price: '',
      image_url: '',
      buy_link: '',
      discount_code: '',
      is_special_offer: false,
      target_tribe: 'global'
    });
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      buy_link: product.buy_link || '',
      discount_code: product.discount_code || '',
      is_special_offer: product.is_special_offer,
      target_tribe: product.target_tribe || 'global'
    });
    setShowModal(true);
  };

  const toggleSoldOut = async (product: Product) => {
    await supabase
      .from('products')
      .update({ is_sold_out: !product.is_sold_out })
      .eq('id', product.id);
    toast({ title: product.is_sold_out ? 'Product back in stock!' : 'Marked as sold out' });
    fetchProducts();
  };

  const toggleActive = async (product: Product) => {
    await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    toast({ title: product.is_active ? 'Product hidden' : 'Product visible' });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product deleted' });
    fetchProducts();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Bwalo Management Console</h2>
          <p className="text-slate-400 text-sm">Manage your products in the Mijedu marketplace</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-medium">No products yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first product to appear in Bwalo Market</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-slate-900/50 border ${product.is_active ? 'border-slate-800' : 'border-slate-800/50'} ${!product.is_active && 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-white">{product.title}</h3>
                            {/* Status Badge */}
                            {product.status === 'pending_approval' && (
                              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                                <Clock className="w-3 h-3 mr-1" /> Under Review
                              </Badge>
                            )}
                            {product.status === 'approved' && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                              </Badge>
                            )}
                            {product.status === 'denied' && (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                                <XCircle className="w-3 h-3 mr-1" /> Rejected
                              </Badge>
                            )}
                            {product.is_special_offer && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                                <Star className="w-3 h-3 mr-1" /> Mijedu Exclusive
                              </Badge>
                            )}
                            {product.is_sold_out && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="w-3 h-3 mr-1" /> Sold Out
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-400 text-sm line-clamp-1">{product.description}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs border-slate-700 ${
                              product.target_tribe === 'global' ? 'text-blue-400' : 'text-purple-400'
                            }`}>
                              {product.target_tribe === 'global' ? (
                                <><Globe className="w-3 h-3 mr-1" /> Global</>
                              ) : (
                                <><Users className="w-3 h-3 mr-1" /> {product.target_tribe}</>
                              )}
                            </Badge>
                            <p className="text-amber-500 font-bold">MK {product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openEdit(product)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => toggleSoldOut(product)}
                          className={`border-slate-700 hover:bg-slate-800 ${product.is_sold_out ? 'text-emerald-400' : 'text-orange-400'}`}
                        >
                          {product.is_sold_out ? 'Restock' : 'Mark Sold Out'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => toggleActive(product)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          {product.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                          {product.is_active ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Product Title *</Label>
              <Input
                placeholder="Enter product name"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="Describe your product"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Price (MK) *</Label>
              <Input
                placeholder="0"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Product Image</Label>
              <div className="mt-1.5">
                {(imagePreview || form.image_url) ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700">
                    <img src={imagePreview || form.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); setForm({ ...form, image_url: '' }); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-slate-700 cursor-pointer hover:border-amber-500/50 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-400">Upload image (auto-compressed)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label className="text-slate-300">WhatsApp / Website Link</Label>
              <Input
                placeholder="https://wa.me/..."
                value={form.buy_link}
                onChange={(e) => setForm({ ...form, buy_link: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Discount Code</Label>
              <Input
                placeholder="MIJEDU20"
                value={form.discount_code}
                onChange={(e) => setForm({ ...form, discount_code: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            {/* Target Tribe Dropdown */}
            <div>
              <Label className="text-slate-300">Target Audience</Label>
              <Select
                value={form.target_tribe}
                onValueChange={(value) => setForm({ ...form, target_tribe: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="global" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Global (All Tribes)
                    </div>
                  </SelectItem>
                  {tribes.map(tribe => (
                    <SelectItem key={tribe.id} value={tribe.name} className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        {tribe.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Products targeted to specific tribes only appear to those students</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div>
                <p className="text-white text-sm font-medium">Mijedu Exclusive</p>
                <p className="text-slate-400 text-xs">Add special badge to your product</p>
              </div>
              <Switch
                checked={form.is_special_offer}
                onCheckedChange={(checked) => setForm({ ...form, is_special_offer: checked })}
              />
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandProducts;
