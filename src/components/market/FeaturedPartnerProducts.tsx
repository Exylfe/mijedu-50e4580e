import { motion } from 'framer-motion';
import { Landmark, Wifi, ShieldCheck, BadgeCheck, Handshake, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const featuredProducts = [
  {
    id: 'azure-finance',
    route: '/market/azure-finance',
    brand: 'Azure Finance',
    brandAccent: '217 91% 60%',
    brandIcon: Landmark,
    badgeLabel: 'NBM Partner',
    badgeIcon: BadgeCheck,
    title: 'NBM Student Blue Account',
    subtitle: 'Build your Tribe Credit Score',
    highlight: 'Zero monthly fees',
    cta: 'Open Account',
  },
  {
    id: 'verde-network',
    route: '/market/verde-network',
    brand: 'Verde Network',
    brandAccent: '142 71% 45%',
    brandIcon: Wifi,
    badgeLabel: 'Verified',
    badgeIcon: BadgeCheck,
    title: 'Tribe Exclusive Data Deal',
    subtitle: '2GB High-Speed + Unlimited Night',
    highlight: 'MK 500',
    cta: 'Get Bundle',
  },
  {
    id: 'beacon-bank',
    route: '/market/beacon-bank',
    brand: 'Beacon Bank',
    brandAccent: '220 60% 30%',
    brandIcon: ShieldCheck,
    badgeLabel: 'Partner',
    badgeIcon: Handshake,
    title: 'Instant Campus Tech Loan',
    subtitle: 'Interest-free Student Laptop Loans',
    highlight: 'From MK 0/month',
    cta: 'Check Eligibility',
  },
];

const FeaturedPartnerProducts = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary">
          <span className="text-xs font-bold text-primary-foreground">Featured Partners</span>
        </div>
        <span className="text-xs text-muted-foreground">Exclusive Products</span>
      </div>

      <div className="flex flex-col gap-3">
        {featuredProducts.map((product, i) => (
          <motion.button
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(product.route)}
            className="w-full rounded-2xl bg-card border-2 overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{
              borderColor: `hsl(${product.brandAccent} / 0.35)`,
              boxShadow: `0 0 20px hsl(${product.brandAccent} / 0.1)`,
            }}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Brand Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${product.brandAccent} / 0.15), hsl(${product.brandAccent} / 0.05))` }}
              >
                <product.brandIcon className="w-7 h-7" style={{ color: `hsl(${product.brandAccent})` }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{product.brand}</span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                    style={{
                      background: `hsl(${product.brandAccent} / 0.12)`,
                      color: `hsl(${product.brandAccent})`,
                    }}
                  >
                    <product.badgeIcon className="w-2 h-2" />
                    {product.badgeLabel}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">{product.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{product.subtitle}</p>
                <p className="text-xs font-bold mt-1" style={{ color: `hsl(${product.brandAccent})` }}>
                  {product.highlight}
                </p>
              </div>

              {/* Arrow */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `hsl(${product.brandAccent} / 0.1)` }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: `hsl(${product.brandAccent})` }} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FeaturedPartnerProducts;
