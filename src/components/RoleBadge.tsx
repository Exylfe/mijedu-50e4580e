import { Crown, GraduationCap, BadgeCheck } from 'lucide-react';

type RoleType = 'super_admin' | 'tribe_admin' | 'vip_brand' | 'user' | null;

interface RoleBadgeProps {
  role: RoleType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const RoleBadge = ({ role, size = 'sm', showLabel = false, className = '' }: RoleBadgeProps) => {
  if (!role || role === 'user') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSize = sizeClasses[size];
  const labelSize = labelSizeClasses[size];

  const roleConfig = {
    super_admin: {
      icon: Crown,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/20',
      label: 'Super Admin'
    },
    tribe_admin: {
      icon: GraduationCap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20',
      label: 'Tribe Admin'
    },
    vip_brand: {
      icon: BadgeCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      label: 'Verified Shop'
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig];
  if (!config) return null;

  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bgColor} ${className}`}>
        <Icon className={`${iconSize} ${config.color}`} />
        <span className={`${labelSize} font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <span title={config.label} className={`inline-flex ${className}`}>
      <Icon className={`${iconSize} ${config.color}`} />
    </span>
  );
};

export default RoleBadge;
