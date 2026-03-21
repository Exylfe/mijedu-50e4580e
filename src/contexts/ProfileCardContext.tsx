import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfileCardState {
  userId: string | null;
  isOpen: boolean;
}

interface ProfileCardContextType {
  state: ProfileCardState;
  openProfileCard: (userId: string) => void;
  closeProfileCard: () => void;
}

const ProfileCardContext = createContext<ProfileCardContextType | undefined>(undefined);

export function ProfileCardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfileCardState>({ userId: null, isOpen: false });

  const openProfileCard = useCallback((userId: string) => {
    setState({ userId, isOpen: true });
  }, []);

  const closeProfileCard = useCallback(() => {
    setState({ userId: null, isOpen: false });
  }, []);

  return (
    <ProfileCardContext.Provider value={{ state, openProfileCard, closeProfileCard }}>
      {children}
    </ProfileCardContext.Provider>
  );
}

export function useProfileCard() {
  const context = useContext(ProfileCardContext);
  if (!context) throw new Error('useProfileCard must be used within ProfileCardProvider');
  return context;
}
