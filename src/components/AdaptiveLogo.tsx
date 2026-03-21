interface AdaptiveLogoProps {
  size?: string;
  className?: string;
}

import mijeduLogo from '@/assets/mijedu-logo.png';

const AdaptiveLogo = ({ size = 'w-10 h-10', className = '' }: AdaptiveLogoProps) => {
  return (
    <div className={`${size} rounded-full bg-background flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={mijeduLogo}
        alt="Mijedu"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default AdaptiveLogo;
