import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, MousePointer, TrendingUp, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  whatsappClicks: number;
  websiteClicks: number;
  campusBreakdown: { tribe: string; count: number }[];
}

const BrandAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalClicks: 0,
    whatsappClicks: 0,
    websiteClicks: 0,
    campusBreakdown: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    // Get user's products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id);

    if (!products || products.length === 0) {
      setIsLoading(false);
      return;
    }

    const productIds = products.map(p => p.id);

    // Fetch views
    const { data: views, count: viewCount } = await supabase
      .from('product_views')
      .select('viewer_tribe', { count: 'exact' })
      .in('product_id', productIds);

    // Fetch clicks
    const { data: clicks } = await supabase
      .from('product_clicks')
      .select('click_type, viewer_tribe')
      .in('product_id', productIds);

    // Calculate campus breakdown
    const tribeCount: Record<string, number> = {};
    views?.forEach(v => {
      if (v.viewer_tribe) {
        tribeCount[v.viewer_tribe] = (tribeCount[v.viewer_tribe] || 0) + 1;
      }
    });
    clicks?.forEach(c => {
      if (c.viewer_tribe) {
        tribeCount[c.viewer_tribe] = (tribeCount[c.viewer_tribe] || 0) + 1;
      }
    });

    const campusBreakdown = Object.entries(tribeCount)
      .map(([tribe, count]) => ({ tribe, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setAnalytics({
      totalViews: viewCount || 0,
      totalClicks: clicks?.length || 0,
      whatsappClicks: clicks?.filter(c => c.click_type === 'whatsapp').length || 0,
      websiteClicks: clicks?.filter(c => c.click_type === 'website').length || 0,
      campusBreakdown
    });
    setIsLoading(false);
  };

  const statCards = [
    {
      title: 'Total Impressions',
      value: analytics.totalViews,
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Direct Engagements',
      value: analytics.totalClicks,
      icon: MousePointer,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'WhatsApp Clicks',
      value: analytics.whatsappClicks,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Website Visits',
      value: analytics.websiteClicks,
      icon: Users,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  ];

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
        <h2 className="text-xl font-semibold text-white mb-2">Performance Overview</h2>
        <p className="text-slate-400 text-sm">Track your brand's reach across Mijedu campuses</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-slate-900/50 border ${stat.borderColor} hover:border-opacity-50 transition-all`}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('emerald') ? '#10b981' : stat.color.includes('green') ? '#22c55e' : '#8b5cf6' }} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Campus Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-slate-900/50 border border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-amber-500" />
              Campus Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.campusBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No engagement data yet. Share your products to start tracking!</p>
            ) : (
              <div className="space-y-3">
                {analytics.campusBreakdown.map((campus, index) => {
                  const maxCount = analytics.campusBreakdown[0]?.count || 1;
                  const percentage = (campus.count / maxCount) * 100;
                  return (
                    <div key={campus.tribe} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 font-medium">{campus.tribe}</span>
                        <span className="text-slate-400">{campus.count} engagements</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BrandAnalytics;
