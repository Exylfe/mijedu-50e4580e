import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Mijedu is sleeping - Back soon');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('maintenance-mode-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const settings = payload.new.value as MaintenanceSettings;
            setIsMaintenanceMode(settings.enabled);
            setMaintenanceMessage(settings.message || 'Mijedu is sleeping - Back soon');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaintenanceStatus = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    if (!error && data) {
      const settings = data.value as unknown as MaintenanceSettings;
      setIsMaintenanceMode(settings.enabled);
      setMaintenanceMessage(settings.message || 'Mijedu is sleeping - Back soon');
    }
    setIsLoading(false);
  };

  return { isMaintenanceMode, maintenanceMessage, isLoading };
}