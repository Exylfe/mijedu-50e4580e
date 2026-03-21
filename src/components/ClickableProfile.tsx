import { useProfileCard } from '@/contexts/ProfileCardContext';

interface ClickableProfileProps {
  userId?: string;
  children: React.ReactNode;
  className?: string;
}

const ClickableProfile = ({ userId, children, className = '' }: ClickableProfileProps) => {
  const { openProfileCard } = useProfileCard();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      openProfileCard(userId);
    }
  };

  if (!userId) {
    return <>{children}</>;
  }

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
    >
      {children}
    </button>
  );
};

export default ClickableProfile;
