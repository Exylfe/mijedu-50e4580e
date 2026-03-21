import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Handshake, Laptop, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';

const BeaconBankPage = () => {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState([300000]);
  const [months, setMonths] = useState([12]);

  const monthly = Math.round(loanAmount[0] / months[0]);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/market')} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Instant Campus Tech Loan</h1>
        </div>
      </motion.div>

      {/* Partner Badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'hsl(220 60% 30% / 0.1)' }}>
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'hsl(220 60% 30%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(220 60% 30%)' }}>Partnered with Beacon Bank</span>
          <Handshake className="w-3.5 h-3.5" style={{ color: 'hsl(220 60% 30%)' }} />
        </div>
      </motion.div>

      {/* Loan Calculator */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="px-4 pt-6">
        <div className="rounded-2xl p-5 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Loan Eligibility Calculator</h2>
          </div>

          {/* Loan Amount */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-muted-foreground">Loan Amount</span>
              <span className="text-lg font-bold text-foreground">MK {loanAmount[0].toLocaleString()}</span>
            </div>
            <Slider value={loanAmount} onValueChange={setLoanAmount} min={50000} max={800000} step={10000} className="w-full" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">MK 50,000</span>
              <span className="text-[10px] text-muted-foreground">MK 800,000</span>
            </div>
          </div>

          {/* Repayment Period */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-muted-foreground">Repayment Period</span>
              <span className="text-lg font-bold text-foreground">{months[0]} months</span>
            </div>
            <Slider value={months} onValueChange={setMonths} min={3} max={24} step={1} className="w-full" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">3 months</span>
              <span className="text-[10px] text-muted-foreground">24 months</span>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, hsl(220 60% 30% / 0.08), hsl(280 100% 65% / 0.05))' }}>
            <p className="text-xs text-muted-foreground mb-1">Monthly Repayment</p>
            <p className="text-2xl font-bold text-foreground">MK {monthly.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">0% interest for students</p>
          </div>
        </div>
      </motion.div>

      {/* Laptop icon */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="px-4 pt-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(220 60% 30% / 0.1)' }}>
            <Laptop className="w-5 h-5" style={{ color: 'hsl(220 60% 30%)' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Interest-free Student Laptop Loans</p>
            <p className="text-xs text-muted-foreground">For verified Tribe members only</p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="px-4 pt-8">
        <button className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary shadow-lg active:scale-[0.98] transition-transform">
          Apply for Laptop Financing
        </button>
      </motion.div>
    </div>
  );
};

export default BeaconBankPage;
