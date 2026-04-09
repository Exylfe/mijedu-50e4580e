import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Crown, Menu, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdaptiveLogo from '@/components/AdaptiveLogo';

// Gatekeeper Components
import OverviewSection from '@/components/gatekeeper/OverviewSection';
import MembersSection from '@/components/gatekeeper/MembersSection';
import VerificationQueue from '@/components/gatekeeper/VerificationQueue';
import TribeGrid from '@/components/gatekeeper/TribeGrid';
import ActivitySection from '@/components/gatekeeper/ActivitySection';
import BannersSection from '@/components/gatekeeper/BannersSection';
import SettingsSection from '@/components/gatekeeper/SettingsSection';
import BrandCentreSection from '@/components/gatekeeper/BrandCentreSection';
import CreateAccountModal from '@/components/gatekeeper/CreateAccountModal';
import GatekeeperSidebar from '@/components/gatekeeper/GatekeeperSidebar';
import StudentShopsAdmin from '@/components/gatekeeper/StudentShopsAdmin';
import ModerationQueue from '@/components/gatekeeper/ModerationQueue';
import ErrorLogsSection from '@/components/gatekeeper/ErrorLogsSection';
import FeedbackSection from '@/components/gatekeeper/FeedbackSection';

interface Member {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_type: 'college' | 'media';
  is_verified: boolean;
  created_at: string;
  student_id_url?: string | null;
}

interface Tribe {
  id: string;
  name: string;
  type: 'college' | 'media';
  is_visible: boolean;
  logo_url: string | null;
}

const MEMBER_PAGE_SIZE = 20;

const Gatekeeper = () => {
  const { user, isAdmin, isSuperAdmin, adminTribe, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filterTribe, setFilterTribe] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [showVerificationQueue, setShowVerificationQueue] = useState(false);

  // Cursor pagination state for members
  const [memberCursor, setMemberCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [isLoadingMoreMembers, setIsLoadingMoreMembers] = useState(false);

  const handleTribeClick = (tribeName: string) => {
    setFilterTribe(tribeName);
    setActiveSection('members');
  };

  // Re-fetch members when filterTribe changes
  useEffect(() => {
    if (user && isAdmin) {
      setAllMembers([]);
      setMemberCursor(null);
      setHasMoreMembers(true);
      fetchMembers(false);
    }
  }, [filterTribe]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      fetchData();
      fetchUserRoles();
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchData = async () => {
    setLoadingData(true);
    await Promise.all([fetchMembers(false), fetchTribes(), fetchFlaggedCount()]);
    setLoadingData(false);
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (!error && data) {
      const rolesMap: Record<string, string> = {};
      const rolePriority = { super_admin: 4, vip_brand: 3, tribe_admin: 2, user: 1 };

      data.forEach((item) => {
        const currentPriority = rolePriority[rolesMap[item.user_id] as keyof typeof rolePriority] || 0;
        const newPriority = rolePriority[item.role as keyof typeof rolePriority] || 0;
        if (newPriority > currentPriority) {
          rolesMap[item.user_id] = item.role;
        }
      });

      setUserRoles(rolesMap);
    }
  };

  const handleRoleChange = () => {
    fetchUserRoles();
    // Reset and refetch members
    setAllMembers([]);
    setMemberCursor(null);
    setHasMoreMembers(true);
    fetchMembers(false);
  };

  const fetchMembers = useCallback(async (loadMore: boolean, explicitCursor?: { created_at: string; id: string } | null) => {
    if (loadMore) setIsLoadingMoreMembers(true);

    let query = supabase.from('profiles').select('id, user_id, nickname, tribe, tribe_type, is_verified, created_at, student_id_url');

    if (!isSuperAdmin && adminTribe) {
      query = query.eq('tribe', adminTribe);
    }

    // DB-side tribe filter
    if (filterTribe) {
      query = query.eq('tribe', filterTribe);
    }

    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(MEMBER_PAGE_SIZE);

    const activeCursor = loadMore ? (explicitCursor ?? null) : null;
    if (activeCursor) {
      query = query.or(`created_at.lt.${activeCursor.created_at},and(created_at.eq.${activeCursor.created_at},id.lt.${activeCursor.id})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      setIsLoadingMoreMembers(false);
      return;
    }

    if (!data || data.length === 0) {
      if (!loadMore) setAllMembers([]);
      setHasMoreMembers(false);
      setIsLoadingMoreMembers(false);
      return;
    }

    setHasMoreMembers(data.length === MEMBER_PAGE_SIZE);
    const lastItem = data[data.length - 1];
    setMemberCursor({ created_at: lastItem.created_at, id: lastItem.id });

    if (loadMore) {
      setAllMembers(prev => [...prev, ...(data as Member[])]);
    } else {
      setAllMembers(data as Member[]);
    }
    setIsLoadingMoreMembers(false);
  }, [isSuperAdmin, adminTribe, filterTribe]);

  const fetchTribes = async () => {
    const { data, error } = await supabase
      .from('tribes')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    if (!error && data) setTribes(data as Tribe[]);
  };

  const fetchFlaggedCount = async () => {
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gt('report_count', 0);
    setFlaggedCount(count || 0);
  };

  const handleLoadMoreMembers = () => {
    if (!isLoadingMoreMembers && hasMoreMembers) fetchMembers(true, memberCursor);
  };

  const pendingMembers = allMembers.filter(m => !m.is_verified);
  const verifiedCount = allMembers.filter(m => m.is_verified).length;

  const memberCounts = allMembers.reduce((acc, member) => {
    acc[member.tribe] = (acc[member.tribe] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return showVerificationQueue ? (
          <div className="space-y-4">
            <button onClick={() => setShowVerificationQueue(false)} className="text-sm text-primary hover:underline">
              ← Back to Overview
            </button>
            <VerificationQueue pendingMembers={pendingMembers as any} onRefresh={() => { setAllMembers([]); setMemberCursor(null); setHasMoreMembers(true); fetchMembers(false); }} />
          </div>
        ) : (
          <OverviewSection
            pendingCount={pendingMembers.length}
            verifiedCount={verifiedCount}
            totalUsers={allMembers.length}
            flaggedCount={flaggedCount}
            tribesCount={tribes.length}
            showBrandPerformance={isSuperAdmin}
            onPendingClick={() => setShowVerificationQueue(true)}
            isLive={true}
          />
        );
      case 'members':
        return (
          <div className="space-y-4">
            {isSuperAdmin && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              </div>
            )}
            <MembersSection
              allMembers={allMembers}
              pendingMembers={pendingMembers}
              processingId={processingId}
              setProcessingId={setProcessingId}
              onRefresh={() => { setAllMembers([]); setMemberCursor(null); setHasMoreMembers(true); fetchMembers(false); }}
              showTribe={isSuperAdmin}
              isSuperAdmin={isSuperAdmin}
              filterTribe={filterTribe}
              tribes={tribes}
              userRoles={userRoles}
              onRoleChange={handleRoleChange}
            />
            {/* Load More Members */}
            {hasMoreMembers && allMembers.length > 0 && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={handleLoadMoreMembers} disabled={isLoadingMoreMembers} className="px-6">
                  {isLoadingMoreMembers ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : 'Load more members'}
                </Button>
              </div>
            )}
            {!hasMoreMembers && allMembers.length > 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">All members loaded</p>
              </div>
            )}
          </div>
        );
      case 'tribes':
        return isSuperAdmin ? (
          <TribeGrid tribes={tribes} onRefresh={fetchTribes} memberCounts={memberCounts} onTribeClick={handleTribeClick} />
        ) : null;
      case 'brand-centre':
        return isSuperAdmin ? <BrandCentreSection /> : null;
      case 'ads':
        return isSuperAdmin ? <BannersSection /> : null;
      case 'activity':
        return isSuperAdmin ? <ActivitySection /> : null;
      case 'student-shops':
        return isSuperAdmin ? <StudentShopsAdmin /> : null;
      case 'moderation':
        return <ModerationQueue />;
      case 'error-logs':
        return isSuperAdmin ? <ErrorLogsSection /> : null;
      case 'feedback':
        return isSuperAdmin ? <FeedbackSection /> : null;
      case 'settings':
        return isSuperAdmin ? <SettingsSection /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">

      <GatekeeperSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isSuperAdmin={isSuperAdmin || false}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={pendingMembers.length}
        onCreateAccount={() => setShowCreateAccount(true)}
        adminTribe={adminTribe}
      />

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={() => navigate('/feed')} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <AdaptiveLogo size="w-9 h-9" />
            <div>
              <h1 className="text-base font-bold text-foreground">Gatekeeper</h1>
              <p className="text-[10px] text-muted-foreground">
                {isSuperAdmin ? 'Super Admin • All Tribes' : `${adminTribe} Admin`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <Shield className="w-3.5 h-3.5 text-primary" />}
            <span className="text-[10px] font-medium text-foreground">{isSuperAdmin ? 'Super' : 'Admin'}</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 overflow-x-hidden">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </main>

      <CreateAccountModal
        isOpen={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onSuccess={() => { setShowCreateAccount(false); fetchData(); }}
        tribes={tribes}
      />
    </div>
  );
};

export default Gatekeeper;
