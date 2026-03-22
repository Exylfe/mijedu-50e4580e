import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'user' | 'tribe_admin' | 'super_admin' | 'vip_brand';

interface RoleManagerOptions {
  onSuccess?: () => void;
  callerRole?: AppRole;
  callerTribe?: string | null;
}

export const useRoleManager = (options?: RoleManagerOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const assignRole = async (
    userId: string,
    newRole: AppRole,
    context?: { tribe?: string; tribeId?: string; nickname?: string }
  ): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // === TRIBE ADMIN RESTRICTIONS ===
      const callerRole = options?.callerRole;
      const callerTribe = options?.callerTribe;
      
      if (callerRole === 'tribe_admin') {
        // Tribe admin can only assign: user, tribe_admin
        if (newRole !== 'user' && newRole !== 'tribe_admin') {
          toast.error('You can only assign Student or Tribe Admin roles');
          return false;
        }
        // Tribe admin can only assign within their tribe
        if (context?.tribe && context.tribe !== callerTribe) {
          toast.error('You can only manage users in your own tribe');
          return false;
        }
      }

      // Check if role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', newRole)
        .maybeSingle();

      if (existing) {
        toast.info('User already has this role');
        return false;
      }

      // Insert new role FIRST (safe pattern)
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          tribe: newRole === 'tribe_admin' ? (context?.tribe || null) : null,
          tribe_id: newRole === 'tribe_admin' ? (context?.tribeId || null) : null,
        });

      if (insertError) throw insertError;

      // Remove old roles only after successful insert
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', newRole);

      // Auto-create brand/shop for vip_brand promotion
      if (newRole === 'vip_brand' && context?.nickname) {
        const brandName = context.nickname + "'s Shop";
        await supabase.from('profiles').update({
          brand_name: brandName,
          brand_description: `Official shop for ${context.nickname}`
        }).eq('user_id', userId);

        await supabase.from('brands').insert({
          user_id: userId,
          brand_name: brandName,
          is_active: true,
          status: 'approved'
        });
      }

      toast.success(`Role updated to ${newRole.replace('_', ' ')}`);
      options?.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Role assignment error:', error);
      toast.error('Failed to update role');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const revokeToUser = async (userId: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Ensure 'user' role exists first
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role: 'user' as AppRole,
      }, { onConflict: 'user_id,role' }).select();

      // Then remove non-user roles
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'user' as AppRole);

      if (error) throw error;

      toast.success('Admin privileges revoked');
      options?.onSuccess?.();
      return true;
    } catch (error) {
      console.error('Revoke error:', error);
      toast.error('Failed to revoke admin');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { assignRole, revokeToUser, isProcessing };
};
