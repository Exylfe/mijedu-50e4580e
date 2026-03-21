import { GraduationCap } from 'lucide-react';

interface AcademicLevelBadgeProps {
  level: string | null | undefined;
  size?: 'sm' | 'md';
}

const levelAbbreviations: Record<string, string> = {
  'Year 1': 'Yr 1',
  'Year 2': 'Yr 2',
  'Year 3': 'Yr 3',
  'Year 4': 'Yr 4',
  'Year 5': 'Yr 5',
  'Postgraduate': 'PG',
};

// Color-coded system: Freshmen (Blue), Finalists (Gold), Postgrads (Purple)
const getLevelColors = (level: string) => {
  switch (level) {
    case 'Year 1':
    case 'Year 2':
      // Freshmen - Blue
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
        icon: 'text-blue-500',
      };
    case 'Year 3':
      // Mid-year - Teal
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-600',
        border: 'border-teal-500/20',
        icon: 'text-teal-500',
      };
    case 'Year 4':
    case 'Year 5':
      // Finalists - Gold
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20',
        icon: 'text-amber-500',
      };
    case 'Postgraduate':
      // Postgrads - Purple
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-500/20',
        icon: 'text-purple-500',
      };
    default:
      return {
        bg: 'bg-primary/10',
        text: 'text-primary',
        border: 'border-primary/20',
        icon: 'text-primary',
      };
  }
};

const AcademicLevelBadge = ({ level, size = 'sm' }: AcademicLevelBadgeProps) => {
  if (!level) return null;

  const abbreviation = levelAbbreviations[level] || level;
  const colors = getLevelColors(level);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border} text-[10px] font-semibold`}>
        {abbreviation}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${colors.bg} ${colors.text} ${colors.border} text-xs font-semibold`}>
      <GraduationCap className={`w-3 h-3 ${colors.icon}`} />
      {abbreviation}
    </span>
  );
};

export default AcademicLevelBadge;
