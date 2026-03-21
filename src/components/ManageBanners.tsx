import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Link, Calendar, Plus, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const ManageBanners = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      console.error(error);
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
      // Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      // Insert banner record
      const { error: insertError } = await supabase
        .from('banners')
        .insert({
          image_url: urlData.publicUrl,
          link_url: linkUrl || null,
          expires_at: expiresAt || null,
          created_by: user.id,
          is_active: true
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Banner created successfully!');
      
      // Reset form
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
    if (!confirm('Are you sure you want to delete this banner?')) return;

    setProcessingId(banner.id);

    // Delete from storage first
    const fileName = banner.image_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('banners').remove([fileName]);
    }

    // Delete from database
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Manage Banners</h3>
          <p className="text-sm text-muted-foreground">Create and manage advertising banners</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary to-secondary text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Banner
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium text-foreground">Banner Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
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

            {/* Link URL */}
            <div>
              <Label className="text-sm font-medium text-foreground">Destination URL (optional)</Label>
              <div className="relative mt-2">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <Label className="text-sm font-medium text-foreground">Expiration Date (optional)</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !imageFile}
                className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
              >
                {isUploading ? 'Uploading...' : 'Create Banner'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Banners List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">No banners yet</p>
          <p className="text-muted-foreground text-sm">Create your first advertising banner</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl bg-card border ${
                !banner.is_active || isExpired(banner.expires_at)
                  ? 'border-muted opacity-60'
                  : 'border-border'
              }`}
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={banner.image_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!banner.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                        Inactive
                      </span>
                    ) : isExpired(banner.expires_at) ? (
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-xs text-destructive">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-xs text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>

                  {banner.link_url && (
                    <p className="text-sm text-muted-foreground truncate">
                      {banner.link_url}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Created: {formatDate(banner.created_at)}</span>
                    {banner.expires_at && (
                      <span>Expires: {formatDate(banner.expires_at)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleBannerStatus(banner)}
                    disabled={processingId === banner.id}
                    className="h-8 w-8 p-0"
                  >
                    {banner.is_active ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBanner(banner)}
                    disabled={processingId === banner.id}
                    className="h-8 w-8 p-0 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageBanners;
