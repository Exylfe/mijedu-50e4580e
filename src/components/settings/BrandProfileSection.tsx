import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Image, MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BrandProfileSection = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: profile?.brand_name || '',
    brand_description: profile?.brand_description || '',
    brand_logo_url: profile?.brand_logo_url || '',
    whatsapp_number: profile?.whatsapp_number || '',
    website_url: profile?.website_url || ''
  });

  useEffect(() => {
    if (profile) {
      setForm({
        brand_name: profile.brand_name || '',
        brand_description: profile.brand_description || '',
        brand_logo_url: profile.brand_logo_url || '',
        whatsapp_number: profile.whatsapp_number || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          brand_name: form.brand_name,
          brand_description: form.brand_description,
          brand_logo_url: form.brand_logo_url,
          whatsapp_number: form.whatsapp_number,
          website_url: form.website_url
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Also update the brands table to keep in sync
      const { error: brandError } = await supabase
        .from('brands')
        .update({
          brand_name: form.brand_name,
          logo_url: form.brand_logo_url
        })
        .eq('user_id', user.id);

      // It's okay if brand update fails (might not exist)
      if (brandError) {
        console.warn('Brand table update warning:', brandError);
      }

      toast.success('Brand profile updated!');
      refreshProfile?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-amber-500" />
            Brand Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
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
                <Image className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Label className="text-muted-foreground text-sm">Logo URL</Label>
              <Input
                placeholder="https://..."
                value={form.brand_logo_url}
                onChange={(e) => setForm({ ...form, brand_logo_url: e.target.value })}
                className="mt-1 bg-muted/50 border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This logo will appear on your verified badge and banners
              </p>
            </div>
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Brand Name</Label>
            <Input
              placeholder="Your brand name"
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
              className="bg-muted/50 border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Business Description</Label>
            <Textarea
              placeholder="Tell students about your brand and what you offer..."
              value={form.brand_description}
              onChange={(e) => setForm({ ...form, brand_description: e.target.value })}
              className="bg-muted/50 border-border min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4 text-green-500" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* WhatsApp */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp Number
            </Label>
            <Input
              placeholder="+265 999 123 456"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              className="bg-muted/50 border-border"
            />
            <p className="text-xs text-muted-foreground">
              Include country code. This appears on your products.
            </p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Website Link
            </Label>
            <Input
              placeholder="https://yourbrand.com"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              className="bg-muted/50 border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Brand Profile
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default BrandProfileSection;
