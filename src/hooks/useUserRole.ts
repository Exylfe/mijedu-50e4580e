import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'user' | 'tribe_admin' | 'super_admin' | 'vip_brand';

interface UserRoleInfo {
  role: AppRole;
  tribe?: string | null;
}

// Cache for user roles to avoid repeated queries
const roleCache = new Map<string, { role: AppRole; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<AppRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole('user');
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      // Check cache first
      const cached = roleCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setRole(cached.role);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role');

      if (data && data.length > 0) {
        // Priority: super_admin > tribe_admin > vip_brand > user
        const highestRole = data.find(r => r.role === 'super_admin')?.role ||
                           data.find(r => r.role === 'tribe_admin')?.role ||
                           data.find(r => r.role === 'vip_brand')?.role ||
                           'user';
        
        setRole(highestRole as AppRole);
        roleCache.set(userId, { role: highestRole as AppRole, timestamp: Date.now() });
      } else {
        setRole('user');
      }
      setIsLoading(false);
    };

    fetchRole();
  }, [userId]);

  return { role, isLoading };
};

// Batch fetch roles for multiple users (more efficient)
export const fetchUserRoles = async (userIds: string[]): Promise<Map<string, AppRole>> => {
  const roleMap = new Map<string, AppRole>();
  
  if (userIds.length === 0) return roleMap;

  // Check cache first
  const uncachedIds: string[] = [];
  userIds.forEach(id => {
    const cached = roleCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      roleMap.set(id, cached.role);
    } else {
      uncachedIds.push(id);
    }
  });

  if (uncachedIds.length > 0) {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', uncachedIds);

    if (data) {
      // Group by user_id and get highest role
      const userRoles = new Map<string, AppRole[]>();
      data.forEach(r => {
        const existing = userRoles.get(r.user_id) || [];
        existing.push(r.role as AppRole);
        userRoles.set(r.user_id, existing);
      });

      userRoles.forEach((roles, userId) => {
        const highestRole = roles.includes('super_admin') ? 'super_admin' :
                           roles.includes('tribe_admin') ? 'tribe_admin' :
                           roles.includes('vip_brand') ? 'vip_brand' : 'user';
        roleMap.set(userId, highestRole);
        roleCache.set(userId, { role: highestRole, timestamp: Date.now() });
      });

      // Set 'user' for those without roles
      uncachedIds.forEach(id => {
        if (!roleMap.has(id)) {
          roleMap.set(id, 'user');
        }
      });
    }
  }

  return roleMap;
};
