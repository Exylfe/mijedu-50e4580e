import { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Building2, LogOut, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSection from '@/components/settings/ProfileSection';
import BrandProfileSection from '@/components/settings/BrandProfileSection';
import SecuritySection from '@/components/settings/SecuritySection';
import ShopRequestForm from '@/components/settings/ShopRequestForm';

import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isVipBrand, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [existingShop, setExistingShop] = useState<{ id: string; shop_name: string; status: string } | null>(null);

  useEffect(() => {
    if (user && !isVipBrand) {
      supabase
        .from('student_shops')
        .select('id, shop_name, status')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setExistingShop(data);
        });
    }
  }, [user, isVipBrand]);

  const hasApprovedShop = existingShop?.status === 'approved';

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold gradient-text">Settings</h1>
            <p className="text-xs text-muted-foreground">
              {isVipBrand ? 'Manage your brand profile' : 'Manage your account'}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Profile Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {isVipBrand ? (
                profile?.brand_logo_url ? (
                  <img src={profile.brand_logo_url} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-amber-500" />
                )
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {isVipBrand ? profile?.brand_name : profile?.nickname || 'User'}
              </p>
              <p className="text-sm text-muted-foreground">{profile?.tribe}</p>
              {profile?.is_verified && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full bg-muted/50 p-1 rounded-xl mb-6 overflow-x-auto scrollbar-hide ${hasApprovedShop ? 'grid grid-cols-3' : ''}`}>
            <TabsTrigger 
              value="profile" 
              className="flex-1 min-h-[44px] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {isVipBrand ? (
                <Building2 className="w-4 h-4 mr-2" />
              ) : (
                <User className="w-4 h-4 mr-2" />
              )}
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            {hasApprovedShop && (
              <TabsTrigger 
                value="shop" 
                className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Store className="w-4 h-4 mr-2" />
                My Shop
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            {isVipBrand ? <BrandProfileSection /> : (
              <div className="space-y-6">
                <ProfileSection />
                {/* Student Shop Section - only show if no approved shop */}
                {!hasApprovedShop && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" />
                      Student Shop
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Request a shop to sell items on Bwalo Market. A super admin must approve your request.
                    </p>
                    <ShopRequestForm
                      existingShop={existingShop}
                      onSuccess={() => {
                        supabase
                          .from('student_shops')
                          .select('id, shop_name, status')
                          .eq('user_id', user!.id)
                          .maybeSingle()
                          .then(({ data }) => { if (data) setExistingShop(data); });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>

          {hasApprovedShop && (
            <TabsContent value="shop">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{existingShop?.shop_name}</p>
                      <p className="text-xs text-emerald-600 font-medium">Active Shop</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your shop, products, and listings from the Shop Office.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/shop-office')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-primary hover:opacity-90"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Open Shop Office
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }}
          className="w-full mt-6 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
