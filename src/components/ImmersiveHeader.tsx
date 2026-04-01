import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, RefreshCw, Info, Settings, Shield, Crown, Store, LogOut, Sparkles, EyeOff, User, Bot, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useApprovedShop } from '@/hooks/useApprovedShop';
import AdaptiveLogo from '@/components/AdaptiveLogo';
import NotificationBell from '@/components/NotificationBell';

interface ImmersiveHeaderProps {
  title: string;
  subtitle?: string;
  isVisible: boolean;
  onRefresh?: () => void;
}

const ImmersiveHeader = ({ title, subtitle, isVisible, onRefresh }: ImmersiveHeaderProps) => {
  const { user, signOut, isSuperAdmin: realSuperAdmin } = useAuth();
  const { profile, isAdmin, isSuperAdmin, isVipBrand } = useSimulatedAuth();
  const { isSimulating, stopSimulation } = useViewAs();
  const { hasApprovedShop } = useApprovedShop();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleNavigation = (path: string) => { setShowMenu(false); navigate(path); };
  const handleSignOut = async () => { setShowMenu(false); await signOut(); navigate('/auth'); };

  const menuItems = [
    ...(realSuperAdmin && isSimulating ? [{ icon: EyeOff, label: 'Exit Simulation', onClick: () => { stopSimulation(); handleNavigation('/admin/simulator'); }, color: 'text-amber-500' }] : []),
    ...(realSuperAdmin && !isSimulating ? [{ icon: Sparkles, label: 'Simulator Hub', onClick: () => handleNavigation('/admin/simulator'), color: 'text-amber-500' }] : []),
    ...((isAdmin || isSuperAdmin) ? [{ icon: Shield, label: 'Admin Dashboard', onClick: () => handleNavigation('/gatekeeper'), color: 'text-primary' }] : []),
    ...(isVipBrand && !isSuperAdmin ? [{ icon: Crown, label: 'Brand Office', onClick: () => handleNavigation('/brand-hub'), color: 'text-amber-500' }] : []),
    ...(hasApprovedShop ? [{ icon: ShoppingBag, label: 'Shop Office', onClick: () => handleNavigation('/shop-office'), color: 'text-emerald-500' }] : []),
    { icon: Store, label: 'Bwalo Market', onClick: () => handleNavigation('/market'), color: 'text-foreground' },
    { icon: Bot, label: 'AI Assistant', onClick: () => handleNavigation('/ai-assistant'), color: 'text-foreground' },
    ...(onRefresh ? [{ icon: RefreshCw, label: 'Refresh Feed', onClick: () => { setShowMenu(false); onRefresh(); }, color: 'text-foreground' }] : []),
    { icon: Info, label: 'About Mijedu', onClick: () => handleNavigation('/about'), color: 'text-foreground' },
    { icon: Settings, label: 'Settings', onClick: () => handleNavigation('/settings'), color: 'text-foreground' },
    ...(user ? [{ icon: LogOut, label: 'Sign Out', onClick: handleSignOut, color: 'text-destructive' }] : [])
  ];

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 left-0 right-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AdaptiveLogo size="w-10 h-10" />
                <div>
                  <h1 className="text-lg font-bold gradient-text">{title}</h1>
                  {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user && <NotificationBell />}
                <motion.button onClick={() => setShowMenu(!showMenu)} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ background: showMenu ? 'hsl(var(--primary) / 0.1)' : 'transparent' }}>
                  <MoreVertical className={`w-5 h-5 transition-colors ${showMenu ? 'text-primary' : 'text-muted-foreground'}`} />
                </motion.button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="fixed top-16 right-4 z-50 min-w-56 rounded-2xl p-2 shadow-xl" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', border: '0.5px solid hsl(var(--border) / 0.5)' }}>
              {profile && user && (
                <button onClick={() => handleNavigation(`/profile/${user.id}`)} className="w-full flex items-center gap-3 p-3 mb-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{profile.nickname}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.tribe}</p>
                  </div>
                </button>
              )}
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} onClick={item.onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-muted/50">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className={item.color}>{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImmersiveHeader;
