import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useNavigate } from 'react-router-dom';

const ViewAsSimulator = () => {
  const { isSuperAdmin } = useAuth();
  const { isSimulating, stopSimulation } = useViewAs();
  const navigate = useNavigate();

  // Only show for actual super admins when simulation is active
  if (!isSuperAdmin || !isSimulating) return null;

  const handleExitSimulation = () => {
    stopSimulation();
    navigate('/admin/simulator');
  };

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={handleExitSimulation}
        className="fixed bottom-20 left-4 z-40 w-10 h-10 rounded-full bg-muted/60 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
        title="Exit Simulation"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    </AnimatePresence>
  );
};

export default ViewAsSimulator;
