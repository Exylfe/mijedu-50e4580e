import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, 
  Check, 
  Ban, 
  Shield, 
  Crown, 
  Star,
  UserCog,
  User,
  Eye,
  ChevronDown,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GlassCard from './GlassCard';
import MakeAdminModal from './MakeAdminModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


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

interface MemberCardProps {
  member: Member;
  index: number;
  processingId: string | null;
  onApprove: (member: Member) => void;
  onBan: (member: Member) => void;
  onMakeAdmin: (member: Member, role: string, tribe?: string) => void;
  onRevokeAdmin: (member: Member) => void;
  onDeleteUser?: (member: Member) => void;
  showTribe?: boolean;
  tribes?: Tribe[];
  onRoleChange?: (member: Member, newRole: string) => void;
  userRoles?: Record<string, string>;
  isSuperAdmin?: boolean;
}

const ALL_ROLE_OPTIONS = [
  { value: 'user', label: 'Student', icon: User },
  { value: 'tribe_admin', label: 'Tribe Admin', icon: Shield },
  { value: 'vip_brand', label: 'Brand', icon: Star },
  { value: 'super_admin', label: 'Super Admin', icon: Crown },
];

// Tribe admin can only assign: user, tribe_admin (same tribe)
const TRIBE_ADMIN_ROLE_OPTIONS = [
  { value: 'user', label: 'Student', icon: User },
  { value: 'tribe_admin', label: 'Tribe Admin', icon: Shield },
];

const MemberCard = ({ 
  member, 
  index, 
  processingId, 
  onApprove, 
  onBan, 
  onMakeAdmin,
  onRevokeAdmin,
  onDeleteUser,
  showTribe,
  tribes = [],
  onRoleChange,
  userRoles = {},
  isSuperAdmin = false
}: MemberCardProps) => {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const isProcessing = processingId === member.id;
  const [currentRole, setCurrentRole] = useState<string>('user');
  const [changingRole, setChangingRole] = useState(false);

  useEffect(() => {
    // Get the highest role for this user
    const role = userRoles[member.user_id] || 'user';
    setCurrentRole(role);
  }, [userRoles, member.user_id]);
  // Tribe admin restrictions: can only assign user/tribe_admin, cannot touch super_admin or vip_brand users
  const ROLE_OPTIONS = isSuperAdmin ? ALL_ROLE_OPTIONS : TRIBE_ADMIN_ROLE_OPTIONS;
  const isProtectedUser = !isSuperAdmin && (currentRole === 'super_admin' || currentRole === 'vip_brand');

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    if (isProtectedUser) {
      toast.error('You cannot modify this user\'s role');
      return;
    }
    
    setChangingRole(true);
    
    try {
      // Insert the new role first to ensure user always has a role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: member.user_id,
          role: newRole as any,
          tribe: newRole === 'tribe_admin' ? member.tribe : null
        });

      if (insertError) throw insertError;

      // Only after successful insert, remove old roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.user_id)
        .neq('role', newRole as any);

      // AUTO-CREATE BRAND when promoting to vip_brand
      if (newRole === 'vip_brand') {
        const brandName = member.nickname + "'s Shop";
        await supabase.from('profiles').update({
          brand_name: brandName,
          brand_description: `Official shop for ${member.nickname}`
        }).eq('user_id', member.user_id);

        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', member.user_id)
          .maybeSingle();

        if (!existingBrand) {
          await supabase.from('brands').insert({
            user_id: member.user_id,
            brand_name: brandName,
            is_active: true,
            status: 'approved'
          });
        }
      }

      setCurrentRole(newRole);
      toast.success(`${member.nickname}'s role updated to ${ROLE_OPTIONS.find(r => r.value === newRole)?.label}`);
      onRoleChange?.(member, newRole);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleMakeAdmin = (role: 'super_admin' | 'tribe_admin' | 'vip_brand', tribeOrBrand?: string) => {
    onMakeAdmin(member, role, tribeOrBrand);
    setShowAdminModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <GlassCard hover className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <button 
                onClick={() => navigate(`/profile/${member.user_id}`)}
                className="relative hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                  <span className="text-primary-foreground font-bold text-lg">
                    {member.nickname[0]?.toUpperCase()}
                  </span>
                </div>
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                  member.is_verified ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </button>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/profile/${member.user_id}`)}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {member.nickname}
                  </button>
                  {member.is_verified ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                      Verified
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                      Pending
                    </span>
                  )}
                </div>
                {showTribe && (
                  <p className="text-xs text-primary font-medium">{member.tribe}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {member.tribe_type === 'college' ? 'Student' : 'Creator'} • {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Role Dropdown & Actions */}
            <div className="flex items-center gap-2">
              {/* Inline Role Selector */}
              <Select
                value={currentRole}
                onValueChange={handleRoleChange}
                disabled={changingRole}
              >
                <SelectTrigger className="w-28 h-8 text-xs bg-muted/50 border-border/50">
                  {changingRole ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3" />
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Quick action button */}
              {!member.is_verified ? (
                <Button
                  size="sm"
                  onClick={() => onApprove(member)}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 h-8 px-3"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              ) : null}

              {/* More options menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
                  <DropdownMenuItem onClick={() => navigate(`/profile/${member.user_id}`)}>
                    <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                    View Profile
                  </DropdownMenuItem>
                  
                  {!member.is_verified && (
                    <DropdownMenuItem onClick={() => onApprove(member)}>
                      <Check className="w-4 h-4 mr-2 text-emerald-500" />
                      Approve User
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => setShowAdminModal(true)}>
                    <Crown className="w-4 h-4 mr-2 text-accent-foreground" />
                    Make Admin
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onRevokeAdmin(member)}>
                    <UserCog className="w-4 h-4 mr-2" />
                    Revoke Admin
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem 
                    onClick={() => onBan(member)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban User
                  </DropdownMenuItem>

                  {onDeleteUser && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Make Admin Modal */}
      <MakeAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        member={member}
        tribes={tribes.length > 0 ? tribes : [{ id: member.tribe, name: member.tribe, type: member.tribe_type }]}
        onConfirm={handleMakeAdmin}
        isLoading={isProcessing}
      />
    </>
  );
};

export default MemberCard;
