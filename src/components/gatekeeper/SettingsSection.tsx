import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, Loader2, Megaphone, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GlassCard from './GlassCard';
import { useAuth } from '@/contexts/AuthContext';

interface AppSettings {
  maintenance_mode: { enabled: boolean; message: string };
}

const SettingsSection = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    maintenance_mode: { enabled: false, message: 'Mijedu is sleeping - Back soon' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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
      });
    }
    setIsLoading(false);
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

  const sendGlobalBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setSendingBroadcast(true);

    try {
      // Fetch all tribes to create pinned posts for each
      const { data: tribes, error: tribesError } = await supabase
        .from('tribes')
        .select('name')
        .eq('is_visible', true);

      if (tribesError) throw tribesError;

      // Create a pinned post for each tribe
      const posts = (tribes ?? []).map(tribe => ({
        user_id: user.id,
        content: `🔔 **Official Exylfe Corp Update**\n\n${broadcastMessage}`,
        visibility: 'public' as const,
        target_tribe: tribe.name,
        is_pinned: true,
      }));

      // Also create a global post (no target tribe)
      posts.push({
        user_id: user.id,
        content: `🔔 **Official Exylfe Corp Update**\n\n${broadcastMessage}`,
        visibility: 'public' as const,
        target_tribe: null as unknown as string,
        is_pinned: true,
      });

      const { error } = await supabase.from('posts').insert(posts);

      if (error) throw error;

      toast.success('System alert broadcast to all tribes!');
      setBroadcastMessage('');
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard className="p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Power className="w-4 h-4 text-destructive" />
            Global Controls
          </h3>
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="font-medium text-foreground text-sm">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Show sleeping screen to all users</p>
            </div>
            {savingSettings ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={settings.maintenance_mode.enabled}
                onCheckedChange={updateMaintenanceMode}
              />
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Global Broadcast / System Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            System Alert (Global Broadcast)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast" className="text-sm">
                Broadcast Message
              </Label>
              <Textarea
                id="broadcast"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your system-wide announcement..."
                className="bg-muted/30 min-h-[100px] resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                This will create a pinned post labeled "Official Exylfe Corp Update" in every Tribe feed for 24 hours.
              </p>
            </div>

            <Button
              onClick={sendGlobalBroadcast}
              disabled={sendingBroadcast || !broadcastMessage.trim()}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              {sendingBroadcast ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Broadcast to All Tribes
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default SettingsSection;
