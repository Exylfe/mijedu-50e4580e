import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Store, Settings, Plus, Eye, EyeOff, 
  Trash2, Image, Link, Power, Save, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tribe {
  id: string;
  name: string;
  type: 'college' | 'media';
  is_visible: boolean;
  logo_url: string | null;
}

interface Brand {
  id: string;
  user_id: string;
  brand_name: string;
  is_active: boolean;
  logo_url: string | null;
}

interface AppSettings {
  maintenance_mode: { enabled: boolean; message: string };
  featured_ad: { enabled: boolean; image_url: string | null; target_url: string | null };
}

const ControlTower = () => {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    maintenance_mode: { enabled: false, message: 'Mijedu is sleeping - Back soon' },
    featured_ad: { enabled: false, image_url: null, target_url: null }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // New tribe form state
  const [newTribeName, setNewTribeName] = useState('');
  const [newTribeType, setNewTribeType] = useState<'college' | 'media'>('college');
  const [addingTribe, setAddingTribe] = useState(false);

  // New brand form state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandEmail, setNewBrandEmail] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

  useEffect(() => {
    fetchData();
    subscribeToChanges();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchTribes(), fetchBrands(), fetchSettings()]);
    setIsLoading(false);
  };

  const fetchTribes = async () => {
    const { data, error } = await supabase
      .from('tribes')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setTribes(data as Tribe[]);
    }
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('brand_name', { ascending: true });

    if (!error && data) {
      setBrands(data as unknown as Brand[]);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');

    if (!error && data) {
      const settingsMap: Record<string, unknown> = {};
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
      
      setSettings({
        maintenance_mode: (settingsMap.maintenance_mode as AppSettings['maintenance_mode']) || 
          { enabled: false, message: 'Mijedu is sleeping - Back soon' },
        featured_ad: (settingsMap.featured_ad as AppSettings['featured_ad']) || 
          { enabled: false, image_url: null, target_url: null }
      });
    }
  };

  const subscribeToChanges = () => {
    const tribesChannel = supabase
      .channel('tribes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tribes' }, () => {
        fetchTribes();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tribesChannel);
      supabase.removeChannel(settingsChannel);
    };
  };

  const toggleTribeVisibility = async (tribe: Tribe) => {
    setProcessingId(tribe.id);
    
    const { error } = await supabase
      .from('tribes')
      .update({ is_visible: !tribe.is_visible })
      .eq('id', tribe.id);

    if (error) {
      toast.error('Failed to update tribe');
    } else {
      toast.success(`${tribe.name} is now ${tribe.is_visible ? 'hidden' : 'visible'}`);
    }
    setProcessingId(null);
  };

  const addTribe = async () => {
    if (!newTribeName.trim()) {
      toast.error('Please enter a tribe name');
      return;
    }

    setAddingTribe(true);

    const { error } = await supabase
      .from('tribes')
      .insert({
        name: newTribeName.trim(),
        type: newTribeType,
        is_visible: true
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('A tribe with this name already exists');
      } else {
        toast.error('Failed to add tribe');
      }
    } else {
      toast.success(`${newTribeName} added successfully!`);
      setNewTribeName('');
      fetchTribes();
    }
    setAddingTribe(false);
  };

  const deleteTribe = async (tribe: Tribe) => {
    if (!confirm(`Are you sure you want to delete ${tribe.name}? This cannot be undone.`)) {
      return;
    }

    setProcessingId(tribe.id);

    const { error } = await supabase
      .from('tribes')
      .delete()
      .eq('id', tribe.id);

    if (error) {
      toast.error('Failed to delete tribe');
    } else {
      toast.success(`${tribe.name} deleted`);
    }
    setProcessingId(null);
  };

  const toggleBrandActive = async (brand: Brand) => {
    setProcessingId(brand.id);
    
    const { error } = await supabase
      .from('brands')
      .update({ is_active: !brand.is_active })
      .eq('id', brand.id);

    if (error) {
      toast.error('Failed to update brand');
    } else {
      toast.success(`${brand.brand_name} shop is now ${brand.is_active ? 'hidden' : 'visible'}`);
      fetchBrands();
    }
    setProcessingId(null);
  };

  const addBrand = async () => {
    if (!newBrandName.trim() || !newBrandEmail.trim()) {
      toast.error('Please enter brand name and email');
      return;
    }

    setAddingBrand(true);

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('nickname', newBrandEmail.trim())
      .maybeSingle();

    if (userError || !userData) {
      // Create brand with placeholder user_id (super admin will link it later)
      // For now, we'll just create the brand entry
      toast.error('User not found. Please ensure the user has created an account first.');
      setAddingBrand(false);
      return;
    }

    // Add brand entry
    const { error: brandError } = await supabase
      .from('brands')
      .insert({
        user_id: userData.user_id,
        brand_name: newBrandName.trim(),
        is_active: true
      });

    if (brandError) {
      toast.error('Failed to create brand');
      setAddingBrand(false);
      return;
    }

    // Add VIP brand role
    const { error: roleError } = await supabase.rpc('has_role', {
      _user_id: userData.user_id,
      _role: 'vip_brand'
    });

    if (!roleError) {
      // Insert role if not exists (handled by unique constraint)
      await supabase.from('user_roles').upsert({
        user_id: userData.user_id,
        role: 'vip_brand'
      }, { onConflict: 'user_id,role' });
    }

    toast.success(`${newBrandName} brand created!`);
    setNewBrandName('');
    setNewBrandEmail('');
    fetchBrands();
    setAddingBrand(false);
  };

  const updateMaintenanceMode = async (enabled: boolean) => {
    setSavingSettings(true);
    
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        value: { ...settings.maintenance_mode, enabled },
        updated_at: new Date().toISOString()
      })
      .eq('key', 'maintenance_mode');

    if (error) {
      toast.error('Failed to update maintenance mode');
    } else {
      setSettings(prev => ({
        ...prev,
        maintenance_mode: { ...prev.maintenance_mode, enabled }
      }));
      toast.success(enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    }
    setSavingSettings(false);
  };

  const updateFeaturedAd = async () => {
    setSavingSettings(true);
    
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        value: settings.featured_ad,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'featured_ad');

    if (error) {
      toast.error('Failed to update featured ad');
    } else {
      toast.success('Featured ad updated');
    }
    setSavingSettings(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Tower Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border rounded-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-neon-gold/20 to-neon-purple/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-gold to-neon-purple flex items-center justify-center">
              <Settings className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Control Tower</h2>
              <p className="text-muted-foreground text-sm">Super Admin Master Controls</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-border rounded-xl overflow-hidden"
      >
        <div className="bg-card p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Power className="w-4 h-4 text-destructive" />
            Global Controls
          </h3>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Show sleeping screen to regular users</p>
            </div>
            <Switch
              checked={settings.maintenance_mode.enabled}
              onCheckedChange={updateMaintenanceMode}
              disabled={savingSettings}
            />
          </div>
        </div>
      </motion.div>

      {/* Management Tabs */}
      <Tabs defaultValue="tribes" className="w-full">
        <TabsList className="w-full mb-4 bg-muted/50 grid grid-cols-3">
          <TabsTrigger value="tribes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple/20 data-[state=active]:to-neon-pink/20">
            <Building2 className="w-4 h-4 mr-1" />
            Tribes
          </TabsTrigger>
          <TabsTrigger value="brands" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple/20 data-[state=active]:to-neon-pink/20">
            <Store className="w-4 h-4 mr-1" />
            Brands
          </TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-purple/20 data-[state=active]:to-neon-pink/20">
            <Image className="w-4 h-4 mr-1" />
            Ads
          </TabsTrigger>
        </TabsList>

        {/* Tribes Manager */}
        <TabsContent value="tribes">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Add Tribe Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-neon-purple to-neon-pink text-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Tribe
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Tribe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Tribe Name</Label>
                    <Input
                      value={newTribeName}
                      onChange={(e) => setNewTribeName(e.target.value)}
                      placeholder="e.g., KUHES"
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newTribeType === 'college' ? 'default' : 'outline'}
                        onClick={() => setNewTribeType('college')}
                        className={newTribeType === 'college' ? 'bg-neon-purple' : ''}
                      >
                        College
                      </Button>
                      <Button
                        type="button"
                        variant={newTribeType === 'media' ? 'default' : 'outline'}
                        onClick={() => setNewTribeType('media')}
                        className={newTribeType === 'media' ? 'bg-neon-pink' : ''}
                      >
                        Media Hub
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={addTribe} 
                    disabled={addingTribe}
                    className="bg-gradient-to-r from-neon-purple to-neon-pink"
                  >
                    {addingTribe ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Tribe'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Tribes List */}
            <div className="space-y-2">
              {tribes.map((tribe, index) => (
                <motion.div
                  key={tribe.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`gradient-border rounded-lg overflow-hidden ${!tribe.is_visible ? 'opacity-60' : ''}`}
                >
                  <div className="bg-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tribe.type === 'college' 
                          ? 'bg-gradient-to-br from-neon-purple to-neon-purple/50' 
                          : 'bg-gradient-to-br from-neon-pink to-neon-pink/50'
                      }`}>
                        <Building2 className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tribe.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{tribe.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTribeVisibility(tribe)}
                        disabled={processingId === tribe.id}
                      >
                        {processingId === tribe.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tribe.is_visible ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTribe(tribe)}
                        disabled={processingId === tribe.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Brands Manager */}
        <TabsContent value="brands">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Add Brand Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-neon-gold to-neon-purple text-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Create VIP Brand Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create VIP Brand</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Brand Name</Label>
                    <Input
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="e.g., TNM Malawi"
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">User Nickname (must exist)</Label>
                    <Input
                      value={newBrandEmail}
                      onChange={(e) => setNewBrandEmail(e.target.value)}
                      placeholder="User's nickname"
                      className="bg-muted/50 border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      The user must have already signed up
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={addBrand} 
                    disabled={addingBrand}
                    className="bg-gradient-to-r from-neon-gold to-neon-purple"
                  >
                    {addingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Brand'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Brands List */}
            {brands.length === 0 ? (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No VIP brands yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {brands.map((brand, index) => (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`gradient-border rounded-lg overflow-hidden ${!brand.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="bg-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-gold to-neon-purple flex items-center justify-center">
                          <Store className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{brand.brand_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {brand.is_active ? 'Shop Active' : 'Shop Hidden'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleBrandActive(brand)}
                          disabled={processingId === brand.id}
                        >
                          {processingId === brand.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : brand.is_active ? (
                            <Eye className="w-4 h-4 text-neon-gold" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Featured Ads Manager */}
        <TabsContent value="ads">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="gradient-border rounded-xl overflow-hidden">
              <div className="bg-card p-4 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-neon-purple" />
                  Featured Ad Banner
                </h3>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Enable Featured Ad</p>
                    <p className="text-xs text-muted-foreground">Show banner at top of Society Feed</p>
                  </div>
                  <Switch
                    checked={settings.featured_ad.enabled}
                    onCheckedChange={(enabled) => setSettings(prev => ({
                      ...prev,
                      featured_ad: { ...prev.featured_ad, enabled }
                    }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Image URL
                    </Label>
                    <Input
                      value={settings.featured_ad.image_url || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        featured_ad: { ...prev.featured_ad, image_url: e.target.value || null }
                      }))}
                      placeholder="https://example.com/banner.jpg"
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Target URL
                    </Label>
                    <Input
                      value={settings.featured_ad.target_url || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        featured_ad: { ...prev.featured_ad, target_url: e.target.value || null }
                      }))}
                      placeholder="https://example.com or wa.me/..."
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>

                  {/* Preview */}
                  {settings.featured_ad.image_url && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <div className="rounded-lg overflow-hidden border border-border">
                        <img 
                          src={settings.featured_ad.image_url} 
                          alt="Ad Preview" 
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x120?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={updateFeaturedAd}
                    disabled={savingSettings}
                    className="w-full bg-gradient-to-r from-neon-purple to-neon-pink"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Featured Ad
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlTower;