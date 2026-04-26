import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, Store, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type NavItem = 'home' | 'discover' | 'chat' | 'market' | 'profile';

const navItems: { id: NavItem; icon: typeof Home; label: string; path: string }[] = [
  { id: 'home', icon: Home, label: 'Feed', path: '/feed' },
  { id: 'discover', icon: Compass, label: 'Explore', path: '/explore' },
  { id: 'chat', icon: MessageCircle, label: 'Tribe', path: '/tribe-feed' },
  { id: 'market', icon: Store, label: 'Bwalo', path: '/market' },
  { id: 'profile', icon: User, label: 'Profile', path: '/settings' },
];

const routeToNav: Record<string, NavItem> = {
  '/feed': 'home',
  '/explore': 'discover',
  '/tribe-feed': 'chat',
  '/market': 'market',
  '/settings': 'profile',
};

const MobileAppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = routeToNav[location.pathname] || 'home';
  const queryClient = useQueryClient();

  // Prefetch data for other tabs on mount
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['market-products-prefetch'],
      queryFn: async () => {
        const { data } = await supabase
          .from('products')
          .select('id, title, price, image_url')
          .eq('is_active', true)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10);
        return data ?? [];
      },
      staleTime: 2 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ['tribes-prefetch'],
      queryFn: async () => {
        const { data } = await supabase
          .from('tribes')
          .select('id, name, type')
          .eq('is_visible', true)
          .order('name')
          .limit(20);
        return data ?? [];
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full">
        <Outlet />
      </div>

      {/* Persistent Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="absolute inset-0 bg-background border-t border-border" />
        <div className="relative flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1 min-h-[44px] min-w-[44px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="shellNavGlow"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--secondary) / 0.12))',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <div className={`relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>

                <span className={`relative z-10 text-[10px] font-medium ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>

                {item.id === 'market' && (
                  <div className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileAppShell;
