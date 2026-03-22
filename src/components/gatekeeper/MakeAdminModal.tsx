import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Star, Building2, X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  user_id: string;
  nickname: string;
  tribe: string;
}

interface Tribe {
  id: string;
  name: string;
  type: string;
}

interface Brand {
  id: string;
  brand_name: string;
}

interface MakeAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  tribes: Tribe[];
  brands?: Brand[];
  onConfirm: (role: 'super_admin' | 'tribe_admin' | 'vip_brand', tribeOrBrand?: string) => void;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
}

const allRoles = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full access to all tribes and system settings',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    superOnly: true,
  },
  {
    id: 'tribe_admin',
    label: 'Tribe Admin',
    description: 'Manage members and content for a specific tribe',
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    superOnly: false,
  },
  {
    id: 'vip_brand',
    label: 'Brand Admin',
    description: 'Manage brand products, banners, and analytics',
    icon: Star,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    superOnly: true,
  },
];

const MakeAdminModal = ({
  isOpen,
  onClose,
  member,
  tribes,
  brands = [],
  onConfirm,
  isLoading = false,
  isSuperAdmin = false,
}: MakeAdminModalProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedTribe, setSelectedTribe] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const handleConfirm = () => {
    if (!selectedRole) return;
    
    if (selectedRole === 'tribe_admin' && !selectedTribe) return;
    
    const tribeOrBrand = selectedRole === 'tribe_admin' 
      ? selectedTribe 
      : selectedRole === 'vip_brand' 
      ? selectedBrand 
      : undefined;
    
    onConfirm(selectedRole as 'super_admin' | 'tribe_admin' | 'vip_brand', tribeOrBrand);
  };

  const handleClose = () => {
    setSelectedRole(null);
    setSelectedTribe('');
    setSelectedBrand('');
    onClose();
  };

  const canConfirm = selectedRole && (
    selectedRole !== 'tribe_admin' || selectedTribe
  );

  return (
    <AnimatePresence>
      {isOpen && member && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div 
              className="rounded-2xl border border-border/50 overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Assign Admin Role</h2>
                    <p className="text-xs text-muted-foreground">
                      for {member.nickname}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Which admin role should <span className="font-medium text-foreground">{member.nickname}</span> have?
                </p>

                {/* Role Selection */}
                <div className="space-y-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;

                    return (
                      <motion.button
                        key={role.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                          isSelected 
                            ? `${role.bgColor} ${role.borderColor}` 
                            : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          role.bgColor
                        )}>
                          <Icon className={cn('w-5 h-5', role.color)} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className={cn(
                            'font-medium text-sm',
                            isSelected ? role.color : 'text-foreground'
                          )}>
                            {role.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected 
                            ? `${role.borderColor.replace('border-', 'bg-').replace('/30', '')} border-transparent` 
                            : 'border-border'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Tribe Selection (for tribe_admin) */}
                <AnimatePresence>
                  {selectedRole === 'tribe_admin' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Select Tribe
                        </label>
                        <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                          <SelectTrigger className="w-full bg-muted/30 border-border/50">
                            <SelectValue placeholder="Choose a tribe..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border z-[60]">
                            {tribes.map((tribe) => (
                              <SelectItem key={tribe.id} value={tribe.name}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  {tribe.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/30 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!canConfirm || isLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MakeAdminModal;
