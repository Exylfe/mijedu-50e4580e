import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload, Trash2, Eye, Smartphone, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
  status: string;
}

const BrandBillboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user) fetchBanners();
  }, [user]);

  const fetchBanners = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('brand_user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setBanners(data);
    setIsLoading(false);
  };

  const uploadBanner = async () => {
    if (!user || !imageUrl) {
      toast({ title: 'Please provide an image URL', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('banners')
      .insert({
        image_url: imageUrl,
        link_url: linkUrl || null,
        brand_user_id: user.id,
        is_active: true,
        status: 'pending_approval'
      });

    if (error) {
      toast({ title: 'Error creating banner', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Billboard submitted for review!', 
      description: 'Our team will review and approve it shortly. You\'ll see it on Society Feed once approved.'
    });
    setImageUrl('');
    setLinkUrl('');
    setShowPreview(false);
    fetchBanners();
  };

  const toggleBanner = async (banner: Banner) => {
    await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    toast({ title: banner.is_active ? 'Banner hidden' : 'Banner active' });
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    toast({ title: 'Banner deleted' });
    fetchBanners();
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
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Billboard Control Center</h2>
        <p className="text-slate-400 text-sm">Manage your banners on the Society Feed carousel</p>
      </div>

      {/* Upload New Banner */}
      <Card className="bg-slate-900/50 border border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Upload className="w-4 h-4 text-amber-500" />
            Create New Billboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">Banner Image URL</Label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">Recommended: 1080x540px (2:1 ratio)</p>
          </div>
          <div>
            <Label className="text-slate-300">Click Destination (optional)</Label>
            <Input
              placeholder="https://wa.me/... or website link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          {/* Live Preview */}
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="relative bg-slate-950 rounded-2xl p-4 max-w-xs mx-auto border border-slate-700">
                {/* Phone frame mockup */}
                <div className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative">
                  {/* Status bar */}
                  <div className="h-6 bg-slate-800 flex items-center justify-between px-4">
                    <span className="text-[10px] text-slate-400">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-slate-600 rounded-sm" />
                    </div>
                  </div>
                  
                  {/* Banner preview area */}
                  <div className="p-3">
                    <div className="text-[10px] text-slate-500 mb-2">Society Feed</div>
                    <div className="rounded-xl overflow-hidden border border-slate-700">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full aspect-[2/1] object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <Button 
            onClick={uploadBanner}
            disabled={!imageUrl}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
          >
            Publish Billboard
          </Button>
        </CardContent>
      </Card>

      {/* Existing Banners */}
      {banners.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-medium">Your Billboards</h3>
          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-slate-900/50 border ${banner.is_active ? 'border-emerald-500/30' : 'border-slate-800'} ${!banner.is_active && 'opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-32 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                        <img 
                          src={banner.image_url} 
                          alt="Banner" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* Status Badge */}
                          {banner.status === 'pending_approval' && (
                            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                              <Clock className="w-3 h-3 mr-1" /> Under Review
                            </Badge>
                          )}
                          {banner.status === 'approved' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                            </Badge>
                          )}
                          {banner.status === 'denied' && (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                              <XCircle className="w-3 h-3 mr-1" /> Rejected
                            </Badge>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${banner.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {banner.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        {banner.link_url && (
                          <a 
                            href={banner.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-amber-500 flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {banner.link_url.slice(0, 30)}...
                          </a>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => toggleBanner(banner)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            {banner.is_active ? 'Hide' : 'Activate'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteBanner(banner.id)}
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
        </div>
      )}
    </div>
  );
};

export default BrandBillboard;
