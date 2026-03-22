import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberCard from './MemberCard';
import GlassCard from './GlassCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


interface Member {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
  tribe_type: 'college' | 'media';
  is_verified: boolean;
  created_at: string;
}

interface Tribe {
  id: string;
  name: string;
  type: string;
}

interface MembersSectionProps {
  allMembers: Member[];
  pendingMembers: Member[];
  processingId: string | null;
  setProcessingId: (id: string | null) => void;
  onRefresh: () => void;
  showTribe?: boolean;
  isSuperAdmin?: boolean;
  filterTribe?: string | null;
  tribes?: Tribe[];
  userRoles?: Record<string, string>;
  onRoleChange?: (member: Member, newRole: string) => void;
}

const MembersSection = ({ 
  allMembers, 
  pendingMembers, 
  processingId, 
  setProcessingId,
  onRefresh,
  showTribe,
  isSuperAdmin,
  filterTribe,
  tribes = [],
  userRoles = {},
  onRoleChange
}: MembersSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // For tribe_admin: filter out super_admin and vip_brand users from the list
  const visibleMembers = isSuperAdmin 
    ? allMembers 
    : allMembers.filter(m => {
        const memberRole = userRoles[m.user_id];
        return memberRole !== 'super_admin' && memberRole !== 'vip_brand';
      });

  const filteredAllMembers = visibleMembers;
  const filteredPendingMembers = visibleMembers.filter(m => !m.is_verified);

  const verifiedMembers = filteredAllMembers.filter(m => m.is_verified);

  const filterMembers = (members: Member[]) => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.nickname.toLowerCase().includes(query) ||
      m.tribe.toLowerCase().includes(query)
    );
  };

  const displayMembers = activeTab === 'pending' 
    ? filterMembers(filteredPendingMembers)
    : activeTab === 'verified'
    ? filterMembers(verifiedMembers)
    : filterMembers(filteredAllMembers);

  const handleApprove = async (member: Member) => {
    setProcessingId(member.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', member.id);

    if (error) {
      toast.error('Failed to approve user');
    } else {
      toast.success(`${member.nickname} has been verified!`);
      onRefresh();
    }
    setProcessingId(null);
  };

  const handleBan = async (member: Member) => {
    setProcessingId(member.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', member.id);

    if (error) {
      toast.error('Failed to ban user');
    } else {
      toast.success(`${member.nickname} has been banned`);
      onRefresh();
    }
    setProcessingId(null);
  };

  const handleMakeAdmin = async (member: Member, role: string, tribeOverride?: string) => {
    setProcessingId(member.id);
    
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', member.user_id)
      .eq('role', role as any)
      .maybeSingle();

    if (existingRole) {
      toast.info(`${member.nickname} already has this role`);
      setProcessingId(null);
      return;
    }

    // Insert new role
    const tribeValue = role === 'tribe_admin' ? (tribeOverride || member.tribe) : null;
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: member.user_id,
        role: role as any,
        tribe: tribeValue
      });

    if (error) {
      toast.error('Failed to assign role');
      console.error(error);
      setProcessingId(null);
      return;
    }

    // AUTO-CREATE SHOP: If promoting to vip_brand, automatically create a brand/shop hub
    if (role === 'vip_brand') {
      const brandName = member.nickname + "'s Shop";
      
      // Update profile with brand info
      await supabase
        .from('profiles')
        .update({
          brand_name: brandName,
          brand_description: `Official shop for ${member.nickname}`
        })
        .eq('user_id', member.user_id);

      // Create entry in brands table
      const { error: brandError } = await supabase
        .from('brands')
        .insert({
          user_id: member.user_id,
          brand_name: brandName,
          is_active: true
        });

      if (brandError) {
        console.error('Brand creation error:', brandError);
        toast.warning(`${member.nickname} promoted to Brand Owner, but shop hub had an issue`);
      } else {
        toast.success(`${member.nickname} is now a Brand Owner with an auto-generated Shop Hub!`);
      }
    } else {
      toast.success(`${member.nickname} is now a ${role.replace('_', ' ')}`);
    }

    onRefresh();
    setProcessingId(null);
  };

  const handleRevokeAdmin = async (member: Member) => {
    setProcessingId(member.id);
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', member.user_id)
      .neq('role', 'user');

    if (error) {
      toast.error('Failed to revoke admin');
      console.error(error);
    } else {
      toast.success(`Admin privileges revoked for ${member.nickname}`);
      onRefresh();
    }
    setProcessingId(null);
  };

  const handleDeleteUser = async (member: Member) => {
    if (!confirm(`Are you sure you want to permanently delete ${member.nickname}'s account? This cannot be undone.`)) return;
    setProcessingId(member.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('delete-user-account', {
        body: { targetUserId: member.user_id },
      });
      if (res.error) {
        toast.error('Failed to delete account');
        console.error(res.error);
      } else {
        toast.success(`${member.nickname}'s account has been deleted`);
        onRefresh();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account');
    }
    setProcessingId(null);
  };

  return (
    <div className="space-y-4">
      {filterTribe && (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Showing: {filterTribe}
          </span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
        </GlassCard>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 p-1 rounded-xl">
          <TabsTrigger 
            value="all"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Users className="w-4 h-4 mr-1.5" />
            All ({filteredAllMembers.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Pending ({filteredPendingMembers.length})
          </TabsTrigger>
          <TabsTrigger 
            value="verified"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Verified ({verifiedMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {displayMembers.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No members found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Members will appear here'}
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
               {displayMembers.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={index}
                  processingId={processingId}
                  onApprove={handleApprove}
                  onBan={handleBan}
                  onMakeAdmin={handleMakeAdmin}
                  onRevokeAdmin={handleRevokeAdmin}
                  onDeleteUser={isSuperAdmin ? handleDeleteUser : undefined}
                  showTribe={showTribe}
                  tribes={tribes}
                  userRoles={userRoles}
                  onRoleChange={onRoleChange}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MembersSection;
