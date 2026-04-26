import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_id: string | null;
  tribe_type: 'college' | 'media';
  is_verified: boolean;
  verification_code?: string;
  student_id_url?: string;
  academic_level?: string;
  brand_name?: string;
  brand_logo_url?: string;
  brand_description?: string;
  avatar_url?: string;
  bio?: string;
  social_links?: Record<string, string>;
  whatsapp_number?: string;
  website_url?: string;
  points: number;
  role?: string | null;
  created_at: string;
  updated_at: string;
}

type AppRole = 'user' | 'tribe_admin' | 'super_admin' | 'vip_brand';

// Platform admin roles (NOT business ownership roles)
const PLATFORM_ADMIN_ROLES: AppRole[] = ['super_admin', 'tribe_admin'];

// NOTE: Primary admin protection is now handled at database level via user_roles table
// The admin user ID '2a38112a-2371-4eea-b8f6-73adee211d94' has permanent super_admin role in the database

interface UserRole {
  role: AppRole;
  tribe?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean; // true only for super_admin and tribe_admin (platform authority)
  isVipBrand: boolean;
  isSuperAdmin: boolean;
  adminTribe: string | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isVipBrand, setIsVipBrand] = useState(false);
  const [adminTribe, setAdminTribe] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
  };

  const checkAdminRole = async (userId: string) => {
    // Authorization is now fully handled by the database user_roles table
    // Primary admin protection is ensured at the database level
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, tribe')
      .eq('user_id', userId);

    if (!error && data && data.length > 0) {
      const roles = data as UserRole[];
      const superAdminRole = roles.find(r => r.role === 'super_admin');
      const tribeAdminRole = roles.find(r => r.role === 'tribe_admin');
      const vipBrandRole = roles.find(r => r.role === 'vip_brand');
      
      // isVipBrand = has vip_brand role (brand ownership marker)
      setIsVipBrand(!!vipBrandRole);
      
      // isAdmin = platform authority ONLY (super_admin or tribe_admin)
      // vip_brand is NOT a platform admin role — it's an entity ownership marker
      if (superAdminRole) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setAdminTribe(superAdminRole.tribe || null);
      } else if (tribeAdminRole) {
        setIsSuperAdmin(false);
        setIsAdmin(true);
        setAdminTribe(tribeAdminRole.tribe || null);
      } else {
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setAdminTribe(null);
      }
    } else {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsVipBrand(false);
      setAdminTribe(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdminRole(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control initial isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id);
          checkAdminRole(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsVipBrand(false);
          setAdminTribe(null);
        }
      }
    );

    // INITIAL load — fetch session + role BEFORE setting isLoading false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            checkAdminRole(session.user.id),
          ]);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Realtime subscription for profile changes (auto-redirect on verification)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string) => {
    const cap = await import('@capacitor/core').catch(() => ({ Capacitor: null as any }));
    const isNative = cap.Capacitor?.isNativePlatform?.() ?? false;
    const webBase = import.meta.env.VITE_APP_URL || (isNative ? 'https://mijedu.vercel.app' : window.location.origin);
    const redirectUrl = `${webBase}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsVipBrand(false);
    setAdminTribe(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        isVipBrand,
        isSuperAdmin,
        adminTribe,
        signUp,
        signIn,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
