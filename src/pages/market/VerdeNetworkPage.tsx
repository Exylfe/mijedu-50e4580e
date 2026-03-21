import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, BadgeCheck, Zap, Moon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerdeNetworkPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/market')} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Tribe Exclusive Data Deal</h1>
        </div>
      </motion.div>

      {/* Partner Badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'hsl(142 71% 45% / 0.1)' }}>
          <Wifi className="w-3.5 h-3.5" style={{ color: 'hsl(142 71% 45%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(142 71% 45%)' }}>Partnered with Verde Network</span>
          <BadgeCheck className="w-3.5 h-3.5" style={{ color: 'hsl(142 71% 45%)' }} />
        </div>
      </motion.div>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="px-4 pt-6">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, hsl(142 71% 45% / 0.12), hsl(142 71% 45% / 0.04))' , border: '1px solid hsl(142 71% 45% / 0.2)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'hsl(142 71% 45% / 0.15)' }}>
            <Wifi className="w-8 h-8" style={{ color: 'hsl(142 71% 45%)' }} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">MK 500</h2>
          <p className="text-xs text-muted-foreground">Exclusive for Verified Students</p>
        </div>
      </motion.div>

      {/* Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="px-4 pt-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">What's Included</h2>
        <div className="flex flex-col gap-3">
          {[
            { icon: Zap, text: '2GB High-Speed Data', sub: 'Valid for 7 days' },
            { icon: Moon, text: 'Unlimited Night Browsing', sub: '12AM - 6AM daily' },
            { icon: Shield, text: 'Student Verified Only', sub: 'Tribe members get priority' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(142 71% 45% / 0.1)' }}>
                <item.icon className="w-5 h-5" style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="px-4 pt-8">
        <button className="w-full py-3.5 rounded-full text-sm font-semibold text-white shadow-lg active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 60% 40%))' }}>
          Purchase Bundle — MK 500
        </button>
      </motion.div>
    </div>
  );
};

export default VerdeNetworkPage;
