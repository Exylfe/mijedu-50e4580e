import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, ArrowLeft, CheckCircle2, XCircle, Package, Image, 
  Clock, Eye, Building2, Globe, Users, Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AdaptiveLogo from '@/components/AdaptiveLogo';

interface PendingProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  target_tribe: string | null;
  status: string;
  created_at: string;
  user_id: string;
  brand_name?: string;
}

interface PendingBanner {
  id: string;
  image_url: string;
  link_url: string | null;
  status: string;
  created_at: string;
  brand_user_id: string | null;
  brand_name?: string;
}

const ExecutiveConsole = () => {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [pendingBanners, setPendingBanners] = useState<PendingBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      navigate('/');
      toast({ title: 'Access denied', description: 'Executive Console is for super admins only', variant: 'destructive' });
      return;
    }
    if (user && isSuperAdmin) {
      fetchPendingItems();
    }
  }, [user, isSuperAdmin, authLoading, navigate]);

  const fetchPendingItems = async () => {
    setIsLoading(true);
    
    // Fetch pending products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (productsData) {
      const userIds = [...new Set(productsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, brand_name')
        .in('user_id', userIds);

      const brandMap = new Map((profiles || []).map(p => [p.user_id, p.brand_name]));
      
      setPendingProducts(productsData.map(p => ({
        ...p,
        brand_name: brandMap.get(p.user_id) || 'Unknown Brand'
      })));
    }

    // Fetch pending banners
    const { data: bannersData } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (bannersData) {
      const userIds = [...new Set(bannersData.map(b => b.brand_user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, brand_name')
        .in('user_id', userIds);

      const brandMap = new Map((profiles || []).map(p => [p.user_id, p.brand_name]));
      
      setPendingBanners(bannersData.map(b => ({
        ...b,
        brand_name: b.brand_user_id ? brandMap.get(b.brand_user_id) || 'Unknown Brand' : 'Admin'
      })));
    }

    setIsLoading(false);
  };

  const approveProduct = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('products')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error approving product', variant: 'destructive' });
    } else {
      toast({ title: 'Product approved!', description: 'Now visible in Bwalo Market' });
      fetchPendingItems();
    }
    setProcessingId(null);
  };

  const rejectProduct = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('products')
      .update({ status: 'denied' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error rejecting product', variant: 'destructive' });
    } else {
      toast({ title: 'Product rejected' });
      fetchPendingItems();
    }
    setProcessingId(null);
  };

  const approveBanner = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('banners')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error approving banner', variant: 'destructive' });
    } else {
      toast({ title: 'Billboard approved!', description: 'Now visible in Society Feed' });
      fetchPendingItems();
    }
    setProcessingId(null);
  };

  const rejectBanner = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('banners')
      .update({ status: 'denied' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error rejecting banner', variant: 'destructive' });
    } else {
      toast({ title: 'Billboard rejected' });
      fetchPendingItems();
    }
    setProcessingId(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPending = pendingProducts.length + pendingBanners.length;

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-900/20 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/gatekeeper')} 
              className="p-2 -ml-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <AdaptiveLogo size="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-white">Executive Console</h1>
                <p className="text-xs text-slate-400">Content & Commerce Approval</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-3 h-3 mr-1" />
                {totalPending} Pending
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/50 border border-slate-800 mb-6">
            <TabsTrigger value="products" className="data-[state=active]:bg-slate-800 gap-2">
              <Package className="w-4 h-4" />
              Products
              {pendingProducts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                  {pendingProducts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-slate-800 gap-2">
              <Image className="w-4 h-4" />
              Billboards
              {pendingBanners.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                  {pendingBanners.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {pendingProducts.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-white font-medium">All caught up!</p>
                  <p className="text-slate-400 text-sm">No pending products to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {/* Product Image */}
                          <div className="w-24 h-24 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-slate-600" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-medium text-white">{product.title}</h3>
                                <p className="text-sm text-amber-500 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {product.brand_name}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-emerald-400">
                                MK {product.price.toLocaleString()}
                              </p>
                            </div>
                            
                            {product.description && (
                              <p className="text-slate-400 text-sm line-clamp-2 mb-2">{product.description}</p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="border-slate-700 text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(product.created_at).toLocaleDateString()}
                              </Badge>
                              <Badge variant="outline" className={`border-slate-700 ${
                                product.target_tribe === 'global' ? 'text-blue-400' : 'text-purple-400'
                              }`}>
                                {product.target_tribe === 'global' ? (
                                  <><Globe className="w-3 h-3 mr-1" /> Global</>
                                ) : (
                                  <><Users className="w-3 h-3 mr-1" /> {product.target_tribe}</>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 px-4 py-3 bg-slate-800/50 border-t border-slate-700/50">
                          <Button
                            onClick={() => approveProduct(product.id)}
                            disabled={processingId === product.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => rejectProduct(product.id)}
                            disabled={processingId === product.id}
                            variant="outline"
                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners">
            {pendingBanners.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-white font-medium">All caught up!</p>
                  <p className="text-slate-400 text-sm">No pending billboards to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingBanners.map((banner, index) => (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Banner Preview */}
                        <div className="aspect-[2/1] bg-slate-800">
                          <img 
                            src={banner.image_url} 
                            alt="Banner preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-amber-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {banner.brand_name}
                            </p>
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(banner.created_at).toLocaleDateString()}
                            </Badge>
                          </div>

                          {banner.link_url && (
                            <p className="text-xs text-slate-400 truncate mb-3">
                              Link: {banner.link_url}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => approveBanner(banner.id)}
                              disabled={processingId === banner.id}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                              size="sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectBanner(banner.id)}
                              disabled={processingId === banner.id}
                              variant="outline"
                              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ExecutiveConsole;
