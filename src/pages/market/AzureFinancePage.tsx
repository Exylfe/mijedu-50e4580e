import { motion } from 'framer-motion';
import { ArrowLeft, Landmark, BadgeCheck, Shield, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreditScoreMeter from '@/components/market/CreditScoreMeter';

const benefits = [
  { icon: CreditCard, text: 'Zero monthly fees' },
  { icon: Clock, text: 'Instant ATM card issuance' },
  { icon: Shield, text: 'Build your formal credit history' },
];

const AzureFinancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/market')} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">NBM Student Blue Account</h1>
          </div>
        </div>
      </motion.div>

      {/* Partner Badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'hsl(217 91% 60% / 0.1)' }}>
          <Landmark className="w-3.5 h-3.5" style={{ color: 'hsl(217 91% 60%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(217 91% 60%)' }}>Partnered with Azure Finance</span>
          <BadgeCheck className="w-3.5 h-3.5" style={{ color: 'hsl(217 91% 60%)' }} />
        </div>
      </motion.div>

      {/* Credit Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="px-4 pt-8 pb-6 flex justify-center">
        <CreditScoreMeter score={650} maxScore={850} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="px-4 mb-2">
        <p className="text-center text-sm text-muted-foreground">Your estimated Tribe Credit Score</p>
      </motion.div>

      {/* Benefits */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="px-4 pt-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Benefits</h2>
        <div className="flex flex-col gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(217 91% 60% / 0.1)' }}>
                <b.icon className="w-5 h-5" style={{ color: 'hsl(217 91% 60%)' }} />
              </div>
              <span className="text-sm text-foreground">{b.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="px-4 pt-8">
        <button className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(280,100%,65%)] shadow-lg active:scale-[0.98] transition-transform">
          Create Account
        </button>
      </motion.div>
    </div>
  );
};

export default AzureFinancePage;
