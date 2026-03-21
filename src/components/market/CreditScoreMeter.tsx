import { useEffect, useState } from 'react';

interface CreditScoreMeterProps {
  score: number;
  maxScore: number;
}

const CreditScoreMeter = ({ score, maxScore }: CreditScoreMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = score / maxScore;
  const circumference = 2 * Math.PI * 54; // radius 54
  const strokeDashoffset = circumference * (1 - percentage * 0.75); // 270° arc

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreLabel = (s: number) => {
    if (s >= 750) return 'Excellent';
    if (s >= 650) return 'Good';
    if (s >= 550) return 'Fair';
    return 'Building';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Background arc */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
          />
          {/* Neon gradient arc */}
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(280 100% 65%)" />
              <stop offset="50%" stopColor="hsl(217 91% 60%)" />
              <stop offset="100%" stopColor="hsl(170 80% 50%)" />
            </linearGradient>
          </defs>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px hsl(217 91% 60% / 0.6))',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {animatedScore}
          </span>
          <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        </div>
      </div>
      <span
        className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.15), hsl(280 100% 65% / 0.15))',
          color: 'hsl(217 91% 60%)',
        }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
};

export default CreditScoreMeter;
