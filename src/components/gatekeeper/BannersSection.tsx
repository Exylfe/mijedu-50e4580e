import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Link, Calendar, Plus, Trash2, Eye, EyeOff, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from './GlassCard';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const BannersSection = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch banners');
    } else {
      setBanners(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !user) {
      toast.error('Please select an image');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('banners')
        .insert({
          image_url: urlData.publicUrl,
          link_url: linkUrl || null,
          expires_at: expiresAt || null,
          brand_user_id: user.id,
          is_active: true
        });

      if (insertError) throw insertError;

      toast.success('Banner created successfully!');
      
      setImageFile(null);
      setImagePreview(null);
      setLinkUrl('');
      setExpiresAt('');
      setShowForm(false);
      fetchBanners();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleBannerStatus = async (banner: Banner) => {
    setProcessingId(banner.id);
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (error) {
      toast.error('Failed to update banner');
    } else {
      toast.success(banner.is_active ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    }
    setProcessingId(null);
  };

  const deleteBanner = async (banner: Banner) => {
    if (!confirm('Delete this banner?')) return;

    setProcessingId(banner.id);
    const fileName = banner.image_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('banners').remove([fileName]);
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', banner.id);

    if (error) {
      toast.error('Failed to delete banner');
    } else {
      toast.success('Banner deleted');
      fetchBanners();
    }
    setProcessingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Manage Banners</h3>
          <p className="text-xs text-muted-foreground">Create and manage ad banners</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <GlassCard className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <Label className="text-xs">Banner Image</Label>
                <div className="mt-1.5">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-28 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Destination URL</Label>
                  <div className="relative mt-1.5">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Expiration</Label>
                  <div className="relative mt-1.5">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="pl-8 h-9 text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !imageFile}
                  className="flex-1 h-9 bg-gradient-to-r from-primary to-secondary"
                >
                  {isUploading ? 'Uploading...' : 'Create'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Banners List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No banners yet</p>
          <p className="text-xs text-muted-foreground">Create your first banner</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard 
                hover
                className={`overflow-hidden ${
                  !banner.is_active || isExpired(banner.expires_at) ? 'opacity-50' : ''
                }`}
              >
                {/* Banner Image */}
                <div className="relative h-20">
                  <img
                    src={banner.image_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    {!banner.is_active ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-muted/90 text-[10px] text-muted-foreground">
                        Inactive
                      </span>
                    ) : isExpired(banner.expires_at) ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-destructive/90 text-[10px] text-white">
                        Expired
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[10px] text-white">
                        Live
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-2.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                    <span>{formatDate(banner.created_at)}</span>
                    {banner.expires_at && <span>→ {formatDate(banner.expires_at)}</span>}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewBanner(banner)}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleBannerStatus(banner)}
                      disabled={processingId === banner.id}
                      className="h-7 w-7 p-0"
                    >
                      {banner.is_active ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBanner(banner)}
                      disabled={processingId === banner.id}
                      className="h-7 w-7 p-0 hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Banner Preview</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-border">
                <img 
                  src={previewBanner.image_url} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                />
              </div>
              {previewBanner.link_url && (
                <p className="text-sm text-muted-foreground truncate">
                  Links to: {previewBanner.link_url}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This is how the banner will appear on the Society feed.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersSection;
