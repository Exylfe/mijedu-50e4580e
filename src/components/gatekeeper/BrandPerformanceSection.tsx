import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Store, Eye, MousePointer, Download, Camera, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GlassCard from './GlassCard';

interface BrandStats {
  id: string;
  brand_name: string;
  logo_url: string | null;
  user_id: string;
  total_product_views: number;
  total_product_clicks: number;
  total_banner_views: number;
}

const BrandPerformanceSection = () => {
  const [brands, setBrands] = useState<BrandStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBrandStats();
  }, []);

  const fetchBrandStats = async () => {
    // Fetch all brands
    const { data: brandsData } = await supabase
      .from('brands')
      .select('id, brand_name, logo_url, user_id')
      .eq('is_active', true);

    if (!brandsData) {
      setLoading(false);
      return;
    }

    // Fetch stats for each brand
    const brandsWithStats = await Promise.all(
      brandsData.map(async (brand) => {
        // Get products for this brand
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', brand.user_id);

        const productIds = products?.map(p => p.id) || [];

        // Get product views
        const { count: productViews } = await supabase
          .from('product_views')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds.length > 0 ? productIds : ['none']);

        // Get product clicks
        const { count: productClicks } = await supabase
          .from('product_clicks')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds.length > 0 ? productIds : ['none']);

        // Get banner views
        const { count: bannerViews } = await supabase
          .from('banner_views')
          .select('*', { count: 'exact', head: true })
          .eq('banner_id', brand.id);

        return {
          ...brand,
          total_product_views: productViews || 0,
          total_product_clicks: productClicks || 0,
          total_banner_views: bannerViews || 0
        };
      })
    );

    setBrands(brandsWithStats);
    setLoading(false);
  };

  const totalViews = brands.reduce((sum, b) => sum + b.total_product_views + b.total_banner_views, 0);
  const totalClicks = brands.reduce((sum, b) => sum + b.total_product_clicks, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Brand Performance</h3>
              <p className="text-[10px] text-muted-foreground">{brands.length} Active Partners</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSummary(!showSummary)}
            className="text-xs"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            {showSummary ? 'Hide' : 'Generate'} Summary
          </Button>
        </div>
      </GlassCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">{totalViews}</p>
          <p className="text-[10px] text-muted-foreground">Total Impressions</p>
        </GlassCard>
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MousePointer className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">{totalClicks}</p>
          <p className="text-[10px] text-muted-foreground">Total Engagements</p>
        </GlassCard>
      </div>

      {/* Screenshot-Ready Summary */}
      {showSummary && (
        <motion.div
          ref={summaryRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-primary/20 bg-background">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Mijedu Partner ROI Summary
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Brand</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Views</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand, index) => (
                    <tr 
                      key={brand.id}
                      className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Store className="w-3 h-3 text-primary" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">{brand.brand_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-foreground">
                        {brand.total_product_views + brand.total_banner_views}
                      </td>
                      <td className="p-3 text-center text-foreground">
                        {brand.total_product_clicks}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-primary/5">
                    <td className="p-3 font-semibold text-foreground">Total</td>
                    <td className="p-3 text-center font-semibold text-primary">{totalViews}</td>
                    <td className="p-3 text-center font-semibold text-primary">{totalClicks}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Brand List */}
      {!showSummary && (
        <div className="space-y-2">
          {brands.length === 0 ? (
            <GlassCard className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No brand partners yet</p>
            </GlassCard>
          ) : (
            brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-3" hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                          <Store className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{brand.brand_name}</p>
                        <p className="text-[10px] text-muted-foreground">VIP Partner</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{brand.total_product_views + brand.total_banner_views}</p>
                        <p className="text-[10px] text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{brand.total_product_clicks}</p>
                        <p className="text-[10px] text-muted-foreground">Clicks</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BrandPerformanceSection;
