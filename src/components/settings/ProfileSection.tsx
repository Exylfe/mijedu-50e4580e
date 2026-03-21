import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Facebook, Youtube, Instagram, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialLinks {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  other?: string;
  [key: string]: string | undefined;
}

const ProfileSection = () => {
  const { user, profile, refreshProfile, isVipBrand } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    social_links: (profile?.social_links || {}) as SocialLinks
  });

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: form.nickname,
          bio: form.bio,
          avatar_url: form.avatar_url,
          social_links: form.social_links
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated!');
      refreshProfile?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setForm({
      ...form,
      social_links: {
        ...form.social_links,
        [platform]: value
      }
    });
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
            <User className="w-4 h-4 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-muted-foreground text-sm">Profile Picture URL</Label>
              <Input
                placeholder="https://..."
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                className="mt-1 bg-muted/50 border-border"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Display Name</Label>
            <Input
              placeholder="Your display name"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="bg-muted/50 border-border"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Bio / About</Label>
            <Textarea
              placeholder="Tell the community about yourself..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="bg-muted/50 border-border min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links - Only for non-brands */}
      {!isVipBrand && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <LinkIcon className="w-4 h-4 text-primary" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Label>
              <Input
                placeholder="https://facebook.com/yourpage"
                value={form.social_links.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600" />
                YouTube
              </Label>
              <Input
                placeholder="https://youtube.com/@yourchannel"
                value={form.social_links.youtube || ''}
                onChange={(e) => updateSocialLink('youtube', e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
              </Label>
              <Input
                placeholder="https://instagram.com/yourhandle"
                value={form.social_links.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                Other Website
              </Label>
              <Input
                placeholder="https://yourwebsite.com"
                value={form.social_links.other || ''}
                onChange={(e) => updateSocialLink('other', e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ProfileSection;
