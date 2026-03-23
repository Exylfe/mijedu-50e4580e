import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Building2, 
  Sparkles, 
  Settings, 
  LayoutDashboard,
  ChevronRight,
  X,
  UserPlus,
  FlaskConical,
  ClipboardCheck,
  GraduationCap,
  Activity,
  Store,
  AlertTriangle,
  Bug,
  MessageSquareText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  action?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface GatekeeperSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isSuperAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
  onCreateAccount?: () => void;
  adminTribe?: string | null;
}

const GatekeeperSidebar = ({
  activeSection,
  onSectionChange,
  isSuperAdmin,
  isOpen,
  onClose,
  pendingCount = 0,
  onCreateAccount,
  adminTribe
}: GatekeeperSidebarProps) => {
  const navigate = useNavigate();

  // Tribe admin sees ONLY: Overview, Members, Moderation
  // Super admin sees everything
  const mainNavItems: NavItem[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: LayoutDashboard 
    },
    { 
      id: 'members', 
      label: 'User Control', 
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    // Moderation is available to both tribe_admin and super_admin
    { 
      id: 'moderation', 
      label: 'Moderation Queue', 
      icon: AlertTriangle,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    // === SUPER ADMIN ONLY sections below ===
    ...(isSuperAdmin ? [
      { id: 'tribes', label: 'Tribe Management', icon: Building2 },
      { id: 'brand-centre', label: 'Brand Centre', icon: TrendingUp },
      { id: 'ads', label: 'Banners & Ads', icon: Sparkles },
      { id: 'student-shops', label: 'Student Shops', icon: Store },
      { id: 'activity', label: 'Activity', icon: Activity },
      { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
      { id: 'error-logs', label: 'Error Logs', icon: Bug },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] : []),
  ];

  const toolsItems: NavItem[] = [
    // Verification Station for all admins
    { 
      id: 'verification-station', 
      label: 'Verification Station', 
      icon: Shield,
      badge: pendingCount > 0 ? pendingCount : undefined,
      action: () => navigate('/verification-station')
    },
    // Tribe Admin Hub for tribe admins (not super admins, they use Executive Console)
    ...(!isSuperAdmin && adminTribe ? [
      { 
        id: 'tribe-admin-hub', 
        label: 'Tribe Admin Hub', 
        icon: GraduationCap,
        action: () => navigate(`/tribe-admin/${encodeURIComponent(adminTribe)}`)
      },
    ] : []),
    // Super admin tools
    ...(isSuperAdmin ? [
      { 
        id: 'executive-console', 
        label: 'Executive Console', 
        icon: ClipboardCheck,
        action: () => navigate('/executive-console')
      },
      { 
        id: 'post-management', 
        label: 'Post Management', 
        icon: ClipboardCheck,
        action: () => navigate('/post-management')
      },
      { 
        id: 'simulator', 
        label: 'Simulator Lab', 
        icon: FlaskConical,
        action: () => navigate('/admin/simulator')
      },
    ] : []),
  ];

  const navSections: NavSection[] = [
    { title: 'Dashboard', items: mainNavItems },
    ...(toolsItems.length > 0 ? [{ title: 'Tools', items: toolsItems }] : []),
  ];

  const handleItemClick = (id: string) => {
    onSectionChange(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-50 flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Gatekeeper</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {isSuperAdmin ? 'Super Admin' : 'Tribe Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
              {navSections.map((section, sectionIndex) => (
                <div key={section.title} className={cn(sectionIndex > 0 && 'mt-4')}>
                  <p className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;

                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (sectionIndex * section.items.length + index) * 0.03 }}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                              onClose();
                            } else {
                              handleItemClick(item.id);
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                            isActive 
                              ? 'bg-gradient-to-r from-primary/20 to-secondary/10 text-primary shadow-sm' 
                              : 'text-foreground hover:bg-muted/50'
                          )}
                        >
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                            isActive 
                              ? 'bg-gradient-to-br from-primary to-secondary shadow-md' 
                              : 'bg-muted/50'
                          )}>
                            <Icon className={cn(
                              'w-4 h-4',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                            )} />
                          </div>
                          <span className={cn(
                            'flex-1 text-left text-sm font-medium',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold animate-pulse">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={cn(
                            'w-4 h-4 transition-transform',
                            isActive ? 'text-primary rotate-90' : 'text-muted-foreground/50'
                          )} />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/30">
              <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Pro Tip:</span>{' '}
                  Use the Simulator Lab to test different user views.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default GatekeeperSidebar;
