import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Eye, EyeOff, Trash2, Plus, Loader2, Users, MoreVertical, Settings, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GlassCard from './GlassCard';
import TribeModerationModal from './TribeModerationModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tribe {
  id: string;
  name: string;
  type: 'college' | 'media';
  is_visible: boolean;
  logo_url: string | null;
}

interface TribeGridProps {
  tribes: Tribe[];
  onRefresh: () => void;
  memberCounts?: Record<string, number>;
  onTribeClick?: (tribeName: string) => void;
}

const TribeGrid = ({ tribes, onRefresh, memberCounts = {}, onTribeClick }: TribeGridProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [newTribeName, setNewTribeName] = useState('');
  const [newTribeType, setNewTribeType] = useState<'college' | 'media'>('college');
  const [addingTribe, setAddingTribe] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignedAdminId, setAssignedAdminId] = useState<string>('');
  const [availableAdmins, setAvailableAdmins] = useState<Array<{ user_id: string; nickname: string }>>([]);
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);

  // Fetch available users who can be admins
  useEffect(() => {
    const fetchAvailableAdmins = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .eq('is_verified', true)
        .order('nickname');
      
      if (data) {
        setAvailableAdmins(data);
      }
    };
    
    if (isDialogOpen) {
      fetchAvailableAdmins();
    }
  }, [isDialogOpen]);

  const toggleVisibility = async (tribe: Tribe) => {
    setProcessingId(tribe.id);
    const { error } = await supabase
      .from('tribes')
      .update({ is_visible: !tribe.is_visible })
      .eq('id', tribe.id);

    if (error) {
      toast.error('Failed to update tribe');
    } else {
      toast.success(`${tribe.name} is now ${tribe.is_visible ? 'hidden' : 'visible'}`);
      onRefresh();
    }
    setProcessingId(null);
  };

  const deleteTribe = async (tribe: Tribe) => {
    if (!confirm(`Delete ${tribe.name}? This cannot be undone.`)) return;
    
    setProcessingId(tribe.id);
    const { error } = await supabase
      .from('tribes')
      .delete()
      .eq('id', tribe.id);

    if (error) {
      toast.error('Failed to delete tribe');
    } else {
      toast.success(`${tribe.name} deleted`);
      onRefresh();
    }
    setProcessingId(null);
  };

  const addTribe = async () => {
    if (!newTribeName.trim()) {
      toast.error('Please enter a tribe name');
      return;
    }

    setAddingTribe(true);
    const { error } = await supabase
      .from('tribes')
      .insert({
        name: newTribeName.trim(),
        type: newTribeType,
        is_visible: true
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('A tribe with this name already exists');
      } else {
        toast.error('Failed to add tribe');
      }
    } else {
    // If an admin is assigned, also create the tribe_admin role
    if (assignedAdminId && assignedAdminId !== 'none') {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: assignedAdminId,
          role: 'tribe_admin',
          tribe: newTribeName.trim()
        });

      if (roleError) {
        console.error('Failed to assign admin:', roleError);
        toast.warning(`Tribe created, but failed to assign admin`);
      } else {
        toast.success(`${newTribeName} added with assigned admin!`);
      }
    } else {
      toast.success(`${newTribeName} added successfully!`);
    }
    
    setNewTribeName('');
    setAssignedAdminId('');
    setIsDialogOpen(false);
    onRefresh();
    }
    setAddingTribe(false);
  };

  const handleModerationAction = async (action: 'mute' | 'suspend' | 'takedown' | 'delete', reason?: string) => {
    if (!selectedTribe) return;

    setProcessingId(selectedTribe.id);

    switch (action) {
      case 'mute':
        toast.success(`${selectedTribe.name} has been muted. New posts are disabled.`);
        break;
      case 'suspend':
        toast.success(`${selectedTribe.name} has been suspended temporarily.`);
        break;
      case 'takedown':
        await supabase
          .from('tribes')
          .update({ is_visible: false })
          .eq('id', selectedTribe.id);
        toast.success(`${selectedTribe.name} has been taken down from public view.`);
        onRefresh();
        break;
      case 'delete':
        await supabase
          .from('tribes')
          .delete()
          .eq('id', selectedTribe.id);
        toast.success(`${selectedTribe.name} has been permanently deleted.`);
        onRefresh();
        break;
    }

    setProcessingId(null);
    setShowModerationModal(false);
    setSelectedTribe(null);
  };

  const openModeration = (tribe: Tribe) => {
    setSelectedTribe(tribe);
    setShowModerationModal(true);
  };

  const colleges = tribes.filter(t => t.type === 'college');
  const mediaHubs = tribes.filter(t => t.type === 'media');

  const TribeCard = ({ tribe, index, variant }: { tribe: Tribe; index: number; variant: 'primary' | 'secondary' }) => (
    <motion.div
      key={tribe.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard 
        hover 
        className={`p-4 cursor-pointer ${!tribe.is_visible ? 'opacity-50' : ''}`}
        onClick={() => onTribeClick?.(tribe.name)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${variant === 'primary' ? 'from-primary/80 to-primary' : 'from-secondary/80 to-secondary'} flex items-center justify-center`}>
            <Building2 className={`w-5 h-5 ${variant === 'primary' ? 'text-primary-foreground' : 'text-secondary-foreground'}`} />
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-background border border-border z-50">
                <DropdownMenuItem onClick={() => toggleVisibility(tribe)}>
                  {tribe.is_visible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Tribe
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Tribe
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModeration(tribe)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Actions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => deleteTribe(tribe)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Tribe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <h4 className="font-semibold text-foreground">{tribe.name}</h4>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{memberCounts[tribe.name] || 0} members</span>
        </div>
        <p className={`text-[10px] mt-1 ${variant === 'primary' ? 'text-primary' : 'text-secondary'}`}>
          Tap to view members →
        </p>
      </GlassCard>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Add Tribe Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Add New Tribe
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Tribe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tribe Name</Label>
              <Input
                value={newTribeName}
                onChange={(e) => setNewTribeName(e.target.value)}
                placeholder="e.g., KUHES"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newTribeType === 'college' ? 'default' : 'outline'}
                  onClick={() => setNewTribeType('college')}
                  className={newTribeType === 'college' ? 'bg-primary' : ''}
                >
                  College
                </Button>
                <Button
                  type="button"
                  variant={newTribeType === 'media' ? 'default' : 'outline'}
                  onClick={() => setNewTribeType('media')}
                  className={newTribeType === 'media' ? 'bg-secondary' : ''}
                >
                  Media Hub
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Assign Admin (Optional)
              </Label>
              <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select an admin..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border max-h-60">
                  <SelectItem value="none">No Admin</SelectItem>
                  {availableAdmins.map((admin) => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      {admin.nickname}
                    </SelectItem>
                   ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                The selected user will be assigned as Tribe Admin for this tribe.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={addTribe} 
              disabled={addingTribe}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              {addingTribe ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Tribe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Colleges Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Colleges ({colleges.length})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {colleges.map((tribe, index) => (
            <TribeCard key={tribe.id} tribe={tribe} index={index} variant="primary" />
          ))}
        </div>
      </div>

      {/* Media Hubs Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-secondary" />
          Media Hubs ({mediaHubs.length})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {mediaHubs.map((tribe, index) => (
            <TribeCard key={tribe.id} tribe={tribe} index={index} variant="secondary" />
          ))}
        </div>
      </div>

      {/* Tribe Moderation Modal */}
      <TribeModerationModal
        isOpen={showModerationModal}
        onClose={() => {
          setShowModerationModal(false);
          setSelectedTribe(null);
        }}
        tribe={selectedTribe}
        onConfirm={handleModerationAction}
        isLoading={!!processingId}
      />
    </div>
  );
};

export default TribeGrid;
