import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useApprovedShop = () => {
  const { user } = useAuth();
  const [hasApprovedShop, setHasApprovedShop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setHasApprovedShop(false); setIsLoading(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from('student_shops')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('is_active', true)
        .maybeSingle();
      setHasApprovedShop(!!data);
      setIsLoading(false);
    };
    check();
  }, [user]);

  return { hasApprovedShop, isLoading };
};
