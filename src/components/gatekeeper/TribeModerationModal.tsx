import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  X, 
  VolumeX, 
  Clock, 
  EyeOff, 
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Tribe {
  id: string;
  name: string;
  type: string;
  is_visible: boolean;
}

type ModerationAction = 'mute' | 'suspend' | 'takedown' | 'delete';

interface TribeModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tribe: Tribe | null;
  onConfirm: (action: ModerationAction, reason?: string) => void;
  isLoading?: boolean;
}

const actions = [
  {
    id: 'mute' as ModerationAction,
    label: 'Mute Tribe',
    description: 'Members cannot create new posts temporarily',
    icon: VolumeX,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    severity: 'warning',
  },
  {
    id: 'suspend' as ModerationAction,
    label: 'Suspend Tribe',
    description: 'Temporarily block all tribe activities',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    severity: 'warning',
  },
  {
    id: 'takedown' as ModerationAction,
    label: 'Take Down',
    description: 'Hide tribe from public view',
    icon: EyeOff,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/30',
    severity: 'danger',
  },
  {
    id: 'delete' as ModerationAction,
    label: 'Delete Tribe',
    description: 'Permanently remove tribe and all data',
    icon: Trash2,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    severity: 'critical',
  },
];

const TribeModerationModal = ({
  isOpen,
  onClose,
  tribe,
  onConfirm,
  isLoading = false,
}: TribeModerationModalProps) => {
  const [selectedAction, setSelectedAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (!selectedAction) return;
    onConfirm(selectedAction, reason);
  };

  const handleClose = () => {
    setSelectedAction(null);
    setReason('');
    setConfirmText('');
    onClose();
  };

  const selectedActionData = actions.find(a => a.id === selectedAction);
  const requiresConfirmation = selectedAction === 'delete';
  const canConfirm = selectedAction && (!requiresConfirmation || confirmText === tribe?.name);

  return (
    <AnimatePresence>
      {isOpen && tribe && (
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
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto max-h-[85vh] overflow-y-auto"
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Administrative Actions</h2>
                    <p className="text-xs text-muted-foreground">
                      {tribe.name}
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
                {/* Warning Banner */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    These actions will affect all members of <strong>{tribe.name}</strong>. 
                    Some actions cannot be undone.
                  </p>
                </div>

                {/* Action Selection */}
                <div className="space-y-2">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    const isSelected = selectedAction === action.id;

                    return (
                      <motion.button
                        key={action.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedAction(action.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                          isSelected 
                            ? `${action.bgColor} ${action.borderColor}` 
                            : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          action.bgColor
                        )}>
                          <Icon className={cn('w-5 h-5', action.color)} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className={cn(
                            'font-medium text-sm',
                            isSelected ? action.color : 'text-foreground'
                          )}>
                            {action.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected 
                            ? `${action.bgColor.replace('bg-', 'bg-').replace('/10', '')} border-transparent` 
                            : 'border-border'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Reason Input */}
                <AnimatePresence>
                  {selectedAction && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Reason (optional)
                          </label>
                          <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Provide a reason for this action..."
                            className="bg-muted/30 border-border/50 resize-none"
                            rows={2}
                          />
                        </div>

                        {/* Delete Confirmation */}
                        {requiresConfirmation && (
                          <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                            <label className="text-sm font-medium text-destructive mb-2 block">
                              Type "{tribe.name}" to confirm deletion
                            </label>
                            <input
                              type="text"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder={tribe.name}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-destructive/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                            />
                          </div>
                        )}
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
                  variant={selectedActionData?.severity === 'critical' ? 'destructive' : 'default'}
                  className={cn(
                    'flex-1',
                    selectedActionData?.severity !== 'critical' && 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
                  )}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    selectedActionData?.label || 'Confirm'
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

export default TribeModerationModal;
