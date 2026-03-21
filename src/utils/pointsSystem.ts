// Points level system - points are stored as decimals in DB
export interface PointsLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  badge: string;
}

export const LEVELS: PointsLevel[] = [
  { level: 1, title: 'Newcomer', minPoints: 0, maxPoints: 5, color: 'text-muted-foreground', badge: '🌱' },
  { level: 2, title: 'Active Member', minPoints: 5, maxPoints: 20, color: 'text-blue-500', badge: '⭐' },
  { level: 3, title: 'Contributor', minPoints: 20, maxPoints: 50, color: 'text-emerald-500', badge: '🔥' },
  { level: 4, title: 'Rising Star', minPoints: 50, maxPoints: 100, color: 'text-amber-500', badge: '💫' },
  { level: 5, title: 'Campus Legend', minPoints: 100, maxPoints: 250, color: 'text-purple-500', badge: '👑' },
  { level: 6, title: 'Elite', minPoints: 250, maxPoints: 500, color: 'text-pink-500', badge: '💎' },
  { level: 7, title: 'Mijedu Icon', minPoints: 500, maxPoints: Infinity, color: 'text-yellow-500', badge: '🏆' },
];

export const PERKS = [
  { threshold: 5, label: 'Custom Bio', icon: '✏️' },
  { threshold: 20, label: 'Priority Feed', icon: '📌' },
  { threshold: 50, label: 'Exclusive Badge', icon: '🎖️' },
  { threshold: 100, label: 'Room Creator', icon: '🚪' },
  { threshold: 250, label: 'Verified Priority', icon: '⚡' },
  { threshold: 500, label: 'Legend Status', icon: '🏆' },
];

export function getLevel(points: number): PointsLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(points: number): number {
  const level = getLevel(points);
  if (level.maxPoints === Infinity) return 100;
  const range = level.maxPoints - level.minPoints;
  return Math.min(100, ((points - level.minPoints) / range) * 100);
}

export function getUnlockedPerks(points: number) {
  return PERKS.filter(p => points >= p.threshold);
}

export function getNextPerk(points: number) {
  return PERKS.find(p => points < p.threshold) || null;
}
