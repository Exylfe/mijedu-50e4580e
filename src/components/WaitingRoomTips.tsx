import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

const tips = [
  {
    title: 'Stay Authentic',
    description: 'Your Student ID helps us keep the Bwalo safe. Only verified students can join the conversation.',
    emoji: '🛡️',
  },
  {
    title: 'Find Your Tribe',
    description: 'Once verified, explore your Tribe Feed — a space exclusive to your campus community.',
    emoji: '🏛️',
  },
  {
    title: 'Vibe with Posts',
    description: 'Hit the Vibe button to show love for posts that resonate. Top posts unlock Discussion Rooms!',
    emoji: '🔥',
  },
  {
    title: 'Marketplace Awaits',
    description: 'Browse student deals and brand exclusives in the Market. Special offers just for your tribe!',
    emoji: '🛍️',
  },
  {
    title: 'Respect the Space',
    description: 'The Bwalo is built on respect. Keep it real, keep it kind, and report anything that feels off.',
    emoji: '✊',
  },
];

const WaitingRoomTips = () => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goNext = () => setCurrentTip((prev) => (prev + 1) % tips.length);
  const goPrev = () => setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tips for the Bwalo</span>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-4 min-h-[100px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <span className="text-2xl block mb-2">{tips[currentTip].emoji}</span>
            <h4 className="text-sm font-bold text-foreground mb-1">{tips[currentTip].title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{tips[currentTip].description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3">
          <button onClick={goPrev} className="p-1 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex gap-1.5">
            {tips.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTip(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentTip ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <button onClick={goNext} className="p-1 rounded-full hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomTips;
