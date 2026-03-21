import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ProductFormProps {
  shopId?: string;
  existingProduct?: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    stock_quantity?: number;
    buy_link?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'mijedu_product_draft';

const ProductForm = ({ shopId, existingProduct, onSuccess, onCancel }: ProductFormProps) => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [title, setTitle] = useState(existingProduct?.title || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [price, setPrice] = useState(existingProduct?.price?.toString() || '');
  const [stockQuantity, setStockQuantity] = useState(existingProduct?.stock_quantity?.toString() || '0');
  const [buyLink, setBuyLink] = useState(existingProduct?.buy_link || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(existingProduct?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(existingProduct?.image_url || '');
  const [saving, setSaving] = useState(false);

  // Restore draft on mount (only for new products)
  useEffect(() => {
    if (!existingProduct) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const d = JSON.parse(draft);
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
          if (d.price) setPrice(d.price);
          if (d.buyLink) setBuyLink(d.buyLink);
        }
      } catch { /* ignore */ }
    }
  }, [existingProduct]);

  // Save draft on change
  useEffect(() => {
    if (!existingProduct) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description, price, buyLink }));
    }
  }, [title, description, price, buyLink, existingProduct]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  useEffect(() => {
    if (existingProduct) {
      const loadCategories = async () => {
        const { data } = await supabase
          .from('product_categories')
          .select('category_id')
          .eq('product_id', existingProduct.id);
        if (data) setSelectedCategories(data.map(d => d.category_id));
      };
      loadCategories();
    }
  }, [existingProduct]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true });
      setImageFile(compressed as File);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return existingProduct?.image_url || null;
    const ext = imageFile.name.split('.').pop();
    const path = `${user.id}/products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('post-media').upload(path, imageFile);
    if (error) {
      toast.error('Failed to upload image');
      return null;
    }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !price) {
      toast.error('Product name and price are required');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const categoryNames = categories
        .filter(c => selectedCategories.includes(c.id))
        .map(c => c.name);

      const productData: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        image_url: imageUrl,
        is_active: isActive,
        buy_link: buyLink.trim() || null,
        user_id: user.id,
        status: 'approved',
        categories: categoryNames,
      };

      (productData as Record<string, unknown>).stock_quantity = parseInt(stockQuantity) || 0;
      if (shopId) {
        (productData as Record<string, unknown>).shop_id = shopId;
      }

      if (existingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData as any)
          .eq('id', existingProduct.id);
        if (error) throw error;

        await supabase.from('product_categories').delete().eq('product_id', existingProduct.id);
        if (selectedCategories.length > 0) {
          await supabase.from('product_categories').insert(
            selectedCategories.map(cid => ({ product_id: existingProduct.id, category_id: cid }))
          );
        }
        toast.success('Product updated');
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData as any)
          .select('id')
          .single();
        if (error) throw error;

        if (selectedCategories.length > 0 && newProduct) {
          await supabase.from('product_categories').insert(
            selectedCategories.map(cid => ({ product_id: newProduct.id, category_id: cid }))
          );
        }
        toast.success('Product listed successfully');
      }

      clearDraft();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <Label>Product Image</Label>
        <div className="mt-1.5">
          {imagePreview ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>
      </div>

      {/* Product Name */}
      <div>
        <Label htmlFor="title">Product Name *</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter product name" className="mt-1.5" />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your product" className="mt-1.5" rows={3} />
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Price (MWK) *</Label>
          <Input id="price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input id="stock" type="number" min="0" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" className="mt-1.5" />
        </div>
      </div>

      {/* Categories — Multi-select */}
      <div>
        <Label>Categories</Label>
        <p className="text-xs text-muted-foreground mb-2">Select all that apply — your product will appear in each category.</p>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {categories.map(cat => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                selectedCategories.includes(cat.id)
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <span className="text-sm font-medium">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Buy Link */}
      <div>
        <Label htmlFor="buyLink">Buy Link / WhatsApp</Label>
        <Input id="buyLink" value={buyLink} onChange={e => setBuyLink(e.target.value)} placeholder="https://wa.me/265..." className="mt-1.5" />
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select value={isActive ? 'active' : 'inactive'} onValueChange={v => setIsActive(v === 'active')}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existingProduct ? 'Update Product' : 'List Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
