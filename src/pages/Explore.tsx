import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Building2, Store, ChevronRight, Users, Flame, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import GhostBottomNav from '@/components/GhostBottomNav';
import ImmersiveHeader from '@/components/ImmersiveHeader';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

interface Tribe {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
}

interface Brand {
  id: string;
  brand_name: string;
  logo_url: string | null;
}

interface ActiveTribe {
  id: string | null;
  name: string | null;
  follower_count: number | null;
  member_count: number | null;
}

interface TrendingTribe {
  id: string | null;
  name: string | null;
  follower_count: number | null;
  post_count: number | null;
}

const Explore = () => {
  const navigate = useNavigate();
  const { isVisible, forceShow } = useScrollVisibility({ threshold: 80 });
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTribes, setActiveTribes] = useState<ActiveTribe[]>([]);
  const [trendingTribes, setTrendingTribes] = useState<TrendingTribe[]>([]);
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('discover');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [brandCount, setBrandCount] = useState(0);
  const [tribeCount, setTribeCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [tribesResult, brandsResult, tribeCountResult, brandRolesResult, totalUsersResult, verifiedUsersResult, activeTribesResult, trendingTribesResult] = await Promise.all([
        supabase.from('tribes').select('id, name, type, logo_url').eq('is_visible', true),
        supabase.from('brands').select('id, brand_name, logo_url').eq('is_active', true),
        supabase.from('tribes').select('id', { count: 'exact', head: true }).eq('is_visible', true),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'vip_brand'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('active_tribes').select('id, name, follower_count, member_count').limit(10),
        supabase.from('trending_tribes').select('id, name, follower_count, post_count').limit(10),
      ]);

      if (tribesResult.data) setTribes(tribesResult.data as unknown as Tribe[]);
      if (brandsResult.data) setBrands(brandsResult.data as unknown as Brand[]);
      if (activeTribesResult.data) setActiveTribes(activeTribesResult.data as unknown as ActiveTribe[]);
      if (trendingTribesResult.data) setTrendingTribes(trendingTribesResult.data as unknown as TrendingTribe[]);

      setBrandCount(brandRolesResult.count ?? brandsResult.data?.length ?? 0);
      setTribeCount(tribeCountResult.count || tribesResult.data?.length || 0);

      const total = totalUsersResult.count ?? 0;
      const verified = verifiedUsersResult.count ?? 0;
      setTotalUsers(total);
      setVerifiedUsers(verified);
      setPendingUsers(total - verified);
    };

    fetchData();

    // Real-time refresh on new follows or posts
    const channel = supabase
      .channel('explore-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entity_follows' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    switch (item) {
      case 'home': navigate('/feed'); break;
      case 'discover': break;
      case 'chat': navigate('/tribe-feed'); break;
      case 'market': navigate('/market'); break;
    }
  };

  const handleContentTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
    if (!isVisible) forceShow();
  };

  const categories = [
    {
      id: 'society',
      icon: Globe,
      title: 'Society',
      subtitle: 'Global Public Feed',
      gradient: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/30',
      iconBg: 'bg-primary/30',
      iconColor: 'text-primary',
      onClick: () => navigate('/feed')
    },
    {
      id: 'tribes',
      icon: Building2,
      title: 'All Tribes',
      subtitle: `${tribeCount} Colleges • ${totalUsers} Students (${verifiedUsers} Verified, ${pendingUsers} Pending)`,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/30',
      iconColor: 'text-emerald-500',
      expandable: true,
      items: tribes
    },
    {
      id: 'brands',
      icon: Store,
      title: 'Brands',
      subtitle: `${brandCount} Shops`,
      gradient: 'from-secondary/20 to-secondary/5',
      borderColor: 'border-secondary/30',
      iconBg: 'bg-secondary/30',
      iconColor: 'text-secondary',
      expandable: true,
      items: brands
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24" onClick={handleContentTap}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <ImmersiveHeader title="Explore" subtitle="Discover communities" isVisible={isVisible} />
      <div className="h-16" />

      {/* Active Tribes Section */}
      {activeTribes.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Active Communities</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {activeTribes.filter(t => t.id && t.name).map((tribe) => (
              <motion.button
                key={tribe.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/tribe/${tribe.id}`)}
                className="flex-shrink-0 w-28 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-b from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-xs font-medium text-foreground text-center line-clamp-2">{tribe.name}</span>
                <span className="text-[10px] text-muted-foreground">{tribe.posts_last_7_days ?? 0} posts</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Trending / Recommended Tribes */}
      {trendingTribes.length > 0 && (
        <div className="px-4 pt-2 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recommended for You</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingTribes.filter(t => t.id && t.name).map((tribe) => (
              <motion.button
                key={tribe.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/tribe/${tribe.id}`)}
                className="flex-shrink-0 w-28 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/20 hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground text-center line-clamp-2">{tribe.name}</span>
                <span className="text-[10px] text-muted-foreground">{tribe.follower_count ?? 0} followers</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-4 space-y-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <button
              onClick={() => {
                if (category.expandable) {
                  setExpandedCategory(expandedCategory === category.id ? null : category.id);
                } else if (category.onClick) {
                  category.onClick();
                }
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${category.gradient} border ${category.borderColor} hover:scale-[1.02] transition-all`}
            >
              <div className={`w-12 h-12 rounded-full ${category.iconBg} flex items-center justify-center`}>
                <category.icon className={`w-6 h-6 ${category.iconColor}`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-foreground font-semibold">{category.title}</h3>
                <p className="text-muted-foreground text-sm">{category.subtitle}</p>
              </div>
              {category.expandable && (
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`}
                />
              )}
            </button>

            <AnimatePresence>
              {category.expandable && expandedCategory === category.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 space-y-2 overflow-hidden"
                >
                  {category.id === 'tribes' && tribes.map((tribe) => (
                    <motion.button
                      key={tribe.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate(`/tribe/${tribe.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      {tribe.logo_url ? (
                        <img src={tribe.logo_url} alt={tribe.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/50 transition-all" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span className="text-foreground text-sm group-hover:text-primary transition-colors">{tribe.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{tribe.type}</span>
                    </motion.button>
                  ))}

                  {category.id === 'brands' && brands.map((brand) => (
                    <motion.button
                      key={brand.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate(`/brand/${brand.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.brand_name} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-secondary/50 transition-all" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center ring-2 ring-transparent group-hover:ring-secondary/50 transition-all">
                          <Store className="w-4 h-4 text-secondary" />
                        </div>
                      )}
                      <span className="text-foreground text-sm group-hover:text-secondary transition-colors">{brand.brand_name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <GhostBottomNav activeItem={activeNav} onItemClick={handleNavClick} isVisible={isVisible} />
    </div>
  );
};

export default Explore;
