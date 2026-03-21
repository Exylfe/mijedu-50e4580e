import { motion } from 'framer-motion';
import { BadgeCheck, Handshake, Landmark, ShieldCheck, Wifi, Smartphone, CreditCard, Laptop } from 'lucide-react';

const demoBrands = [
  {
    name: 'Verde Network',
    accent: '142 71% 45%',
    badgeLabel: 'Verified',
    badgeIcon: BadgeCheck,
    icon: Wifi,
    deal: 'Student Tribe 2GB Bundle',
    price: 'MK 500',
    subline: null,
    cta: null,
  },
  {
    name: 'Ruby Connect',
    accent: '0 72% 51%',
    badgeLabel: 'Partner',
    badgeIcon: Handshake,
    icon: Smartphone,
    deal: '50% Bonus on first Campus Top-up',
    price: null,
    subline: null,
    cta: null,
  },
  {
    name: 'Azure Finance',
    accent: '217 91% 60%',
    badgeLabel: null,
    badgeIcon: null,
    icon: Landmark,
    deal: null,
    price: null,
    subline: 'Build your Tribe Credit Score',
    cta: 'Open Student Blue Account',
  },
  {
    name: 'Beacon Bank',
    accent: '220 60% 30%',
    badgeLabel: null,
    badgeIcon: null,
    icon: ShieldCheck,
    deal: null,
    price: null,
    subline: 'Interest-free Student Laptop Loans',
    cta: 'Check Loan Eligibility',
  },
];

const DemoBrandPartners = () => {
  return (
    <div className="px-4 mb-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary">
            <span className="text-xs font-bold text-primary-foreground">VIP Brand Shops</span>
          </div>
          <span className="text-xs text-muted-foreground">Exclusive Partners</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {demoBrands.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl bg-card border-2 overflow-hidden flex flex-col"
              style={{
                borderColor: `hsl(${brand.accent} / 0.45)`,
                boxShadow: `0 0 16px hsl(${brand.accent} / 0.12)`,
              }}
            >
              {/* Header */}
              <div
                className="px-3 pt-3 pb-2 flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, hsl(${brand.accent} / 0.08), transparent)` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${brand.accent} / 0.15)` }}
                >
                  <brand.icon className="w-4.5 h-4.5" style={{ color: `hsl(${brand.accent})` }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{brand.name}</p>
                  {brand.badgeLabel && brand.badgeIcon && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5 mt-0.5"
                      style={{
                        background: `hsl(${brand.accent} / 0.12)`,
                        color: `hsl(${brand.accent})`,
                      }}
                    >
                      <brand.badgeIcon className="w-2.5 h-2.5" />
                      {brand.badgeLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-3 pb-3 flex-1 flex flex-col justify-between gap-2">
                {brand.deal && (
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{brand.deal}</p>
                    {brand.price && (
                      <p className="text-sm font-bold mt-0.5" style={{ color: `hsl(${brand.accent})` }}>
                        {brand.price}
                      </p>
                    )}
                  </div>
                )}
                {brand.subline && (
                  <p className="text-[11px] text-muted-foreground leading-tight">{brand.subline}</p>
                )}
                {brand.cta && (
                  <button
                    className="mt-auto w-full py-1.5 rounded-full text-[11px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `hsl(${brand.accent})` }}
                  >
                    {brand.cta}
                  </button>
                )}
                {!brand.cta && (
                  <button
                    className="mt-auto w-full py-1.5 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: `hsl(${brand.accent} / 0.12)`,
                      color: `hsl(${brand.accent})`,
                    }}
                  >
                    View Deal
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoBrandPartners;
