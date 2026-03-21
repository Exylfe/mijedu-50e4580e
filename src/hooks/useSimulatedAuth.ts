import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';

/**
 * Hook that returns auth values with View-As simulation applied.
 * Use this hook in components that need to respect the View-As simulator.
 * This only changes UI behavior - no database operations are affected.
 */
export function useSimulatedAuth() {
  const auth = useAuth();
  const { isSimulating, simulatedRole, simulatedTribe } = useViewAs();

  // If not simulating or user is not actually a super admin, return real values
  if (!isSimulating || !auth.isSuperAdmin) {
    return auth;
  }

  // Apply simulation overrides (UI only)
  const simulatedAuth = {
    ...auth,
    // Keep the real user/session/profile for database operations
    // but override the role flags for UI
    isAdmin: simulatedRole === 'tribe_admin' || simulatedRole === 'vip_brand',
    isSuperAdmin: false, // Never simulate as super admin
    isVipBrand: simulatedRole === 'vip_brand',
    adminTribe: simulatedRole === 'tribe_admin' ? simulatedTribe : null,
    // Override profile tribe for UI display
    profile: auth.profile ? {
      ...auth.profile,
      tribe: simulatedTribe || auth.profile.tribe,
    } : null,
  };

  // If simulating as regular user, remove all admin flags
  if (simulatedRole === 'user') {
    simulatedAuth.isAdmin = false;
    simulatedAuth.isSuperAdmin = false;
    simulatedAuth.isVipBrand = false;
    simulatedAuth.adminTribe = null;
  }

  return simulatedAuth;
}
