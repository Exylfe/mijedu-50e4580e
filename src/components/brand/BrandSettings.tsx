import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const BrandSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: '',
    brand_description: '',
    brand_logo_url: ''
  });

  useEffect(() => {
    if (profile) {
      setForm({
        brand_name: profile.brand_name || '',
        brand_description: profile.brand_description || '',
        brand_logo_url: profile.brand_logo_url || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        brand_name: form.brand_name,
        brand_description: form.brand_description,
        brand_logo_url: form.brand_logo_url
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
      refreshProfile?.();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Brand Profile</h2>
        <p className="text-slate-400 text-sm">Manage how your brand appears on Mijedu</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-slate-900/50 border border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-amber-500" />
              Brand Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Preview */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                {form.brand_logo_url ? (
                  <img 
                    src={form.brand_logo_url} 
                    alt="Brand logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <Image className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <Label className="text-slate-300">Logo URL</Label>
                <Input
                  placeholder="https://..."
                  value={form.brand_logo_url}
                  onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Brand Name</Label>
              <Input
                placeholder="Your brand name"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Brand Description</Label>
              <Textarea
                placeholder="Tell students about your brand..."
                value={form.brand_description}
                onChange={(e) => setForm({ ...form, brand_description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Brand Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Premium Partner</p>
                <p className="text-slate-400 text-xs">Your brand has full access to Mijedu features</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-2xl font-bold text-amber-500">∞</p>
                <p className="text-xs text-slate-400">Products</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-2xl font-bold text-amber-500">3</p>
                <p className="text-xs text-slate-400">Billboards</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-900/50">
                <p className="text-2xl font-bold text-amber-500">∞</p>
                <p className="text-xs text-slate-400">Promos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BrandSettings;
