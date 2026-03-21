import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Menu, Shield, RefreshCw, Info, Settings, User, LogOut, Crown, Store, Sparkles, EyeOff, Bot, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useApprovedShop } from '@/hooks/useApprovedShop';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface AppSidebarProps {
  onRefresh?: () => void;
}

const AppSidebar = ({ onRefresh }: AppSidebarProps) => {
  const { user, signOut, isSuperAdmin: realSuperAdmin } = useAuth();
  const { profile, isAdmin, isSuperAdmin, isVipBrand } = useSimulatedAuth();
  const { isSimulating, stopSimulation } = useViewAs();
  const { hasApprovedShop } = useApprovedShop();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNavigation = (path: string) => { setOpen(false); navigate(path); };
  const handleRefresh = () => { setOpen(false); onRefresh?.(); };
  const handleSignOut = async () => { setOpen(false); await signOut(); navigate('/auth'); };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background">
        <SheetHeader className="text-left">
          <SheetTitle className="gradient-text">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {profile && user && (
            <button onClick={() => handleNavigation(`/profile/${user.id}`)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{profile.nickname}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.tribe}</p>
              </div>
            </button>
          )}

          <Separator className="my-3" />

          {realSuperAdmin && isSimulating && (
            <>
              <Button variant="ghost" className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => { stopSimulation(); handleNavigation('/admin/simulator'); }}>
                <EyeOff className="w-4 h-4" /> Exit Simulation
              </Button>
              <Separator className="my-3" />
            </>
          )}

          {realSuperAdmin && !isSimulating && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleNavigation('/admin/simulator')}>
              <Sparkles className="w-4 h-4" /> Simulator Hub
            </Button>
          )}

          {(isAdmin || isSuperAdmin) && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleNavigation('/gatekeeper')}>
              <Shield className="w-4 h-4" /> Admin Dashboard
            </Button>
          )}

          {isVipBrand && !isSuperAdmin && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleNavigation('/brand-hub')}>
              <Crown className="w-4 h-4" /> Brand Office
            </Button>
          )}

          {hasApprovedShop && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleNavigation('/shop-office')}>
              <ShoppingBag className="w-4 h-4" /> Shop Office
            </Button>
          )}

          <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigation('/market')}>
            <Store className="w-4 h-4" /> Bwalo Market
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigation('/ai-assistant')}>
            <Bot className="w-4 h-4" /> AI Assistant
          </Button>

          {onRefresh && (
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" /> Refresh Feed
            </Button>
          )}

          <Separator className="my-3" />

          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => handleNavigation('/about')}>
            <Info className="w-4 h-4" /> About Mijedu
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => handleNavigation('/settings')}>
            <Settings className="w-4 h-4" /> Settings & Profile
          </Button>

          <Separator className="my-3" />

          {user && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
