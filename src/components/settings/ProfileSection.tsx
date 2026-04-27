import { useEffect, useState } from 'react';
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
import UserAvatar from '@/components/UserAvatar';
import { pickAvatar } from '@/lib/avatarPicker';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MIN_AVATAR_DIMENSION = 96;
const MAX_AVATAR_DIMENSION = 4096;
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

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
  const [form, setForm] = useState({
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    social_links: (profile?.social_links || {}) as SocialLinks
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revoke any object URL we created when the component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateImage = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image — file may be corrupted'));
      };
      img.src = url;
    });

  const handleAvatarTap = async () => {
    if (isUploading || !user) return;

    let picked;
    try {
      picked = await pickAvatar();
    } catch (err: any) {
      toast.error(err?.message || 'Could not open the picker');
      return;
    }
    if (!picked) return; // user cancelled

    const { file } = picked;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error('Use a JPG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error(`Image must be smaller than ${MAX_AVATAR_BYTES / (1024 * 1024)}MB`);
      return;
    }
    if (file.size < 1024) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error('Image is too small to be valid');
      return;
    }

    let dims: { width: number; height: number };
    try {
      dims = await validateImage(file);
    } catch (err: any) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error(err?.message || 'Invalid image');
      return;
    }
    if (dims.width < MIN_AVATAR_DIMENSION || dims.height < MIN_AVATAR_DIMENSION) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error(`Image must be at least ${MIN_AVATAR_DIMENSION}×${MIN_AVATAR_DIMENSION}px`);
      return;
    }
    if (dims.width > MAX_AVATAR_DIMENSION || dims.height > MAX_AVATAR_DIMENSION) {
      URL.revokeObjectURL(picked.previewUrl);
      toast.error(`Image must be ${MAX_AVATAR_DIMENSION}px or smaller on each side`);
      return;
    }

    setPreviewUrl(picked.previewUrl);
    setIsUploading(true);
    try {
      const ext = EXT_BY_TYPE[file.type] || 'jpg';
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
      setPreviewUrl(null);
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
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 relative">
                <UserAvatar
                  src={previewUrl || form.avatar_url || null}
                  name={form.nickname || profile?.nickname}
                  size={96}
                />
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
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="environment"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Profile picture</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap the avatar to upload from gallery or camera. JPG/PNG/WebP/GIF, max 3MB.
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
