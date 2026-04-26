import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Facebook, Youtube, Instagram, Link as LinkIcon, Loader2 } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    social_links: (profile?.social_links || {}) as SocialLinks
  });

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      setForm((f) => ({ ...f, avatar_url: publicUrl }));
      refreshProfile?.();
      toast.success('Profile picture updated');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

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
            <button
              type="button"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              aria-label="Change profile picture"
              className="relative group focus:outline-none focus:ring-2 focus:ring-primary rounded-full min-w-[44px] min-h-[44px]"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30 relative">
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
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-white shadow-md group-hover:scale-110 transition-transform">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Profile picture</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap the avatar to upload from gallery or camera. Max 5MB.
              </p>
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
