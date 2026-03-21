import { createContext, useContext, useState, ReactNode } from 'react';

export type SimulatedRole = 'user' | 'tribe_admin' | 'vip_brand' | null;

interface ViewAsContextType {
  isSimulating: boolean;
  simulatedRole: SimulatedRole;
  simulatedTribe: string | null;
  startSimulation: (role: SimulatedRole, tribe: string | null) => void;
  stopSimulation: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>(null);
  const [simulatedTribe, setSimulatedTribe] = useState<string | null>(null);

  const startSimulation = (role: SimulatedRole, tribe: string | null) => {
    setIsSimulating(true);
    setSimulatedRole(role);
    setSimulatedTribe(tribe);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulatedRole(null);
    setSimulatedTribe(null);
  };

  return (
    <ViewAsContext.Provider
      value={{
        isSimulating,
        simulatedRole,
        simulatedTribe,
        startSimulation,
        stopSimulation,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}
