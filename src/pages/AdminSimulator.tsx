import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Shield, Store, Users, Sparkles, Play, ArrowLeft,
  Building2, Radio, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs, SimulatedRole } from '@/contexts/ViewAsContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AdaptiveLogo from '@/components/AdaptiveLogo';

interface Tribe {
  id: string;
  name: string;
  type: string;
}

const AdminSimulator = () => {
  const { isSuperAdmin, isLoading } = useAuth();
  const { startSimulation, isSimulating, stopSimulation } = useViewAs();
  const navigate = useNavigate();
  
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>(null);
  const [selectedTribe, setSelectedTribe] = useState<string>('');
  const [loadingTribes, setLoadingTribes] = useState(true);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/');
      return;
    }

    const fetchTribes = async () => {
      const { data } = await supabase
        .from('tribes')
        .select('id, name, type')
        .eq('is_visible', true)
        .order('type')
        .order('name');
      if (data) setTribes(data);
      setLoadingTribes(false);
    };
    
    if (isSuperAdmin) {
      fetchTribes();
    }
  }, [isSuperAdmin, isLoading, navigate]);

  const collegeTribes = tribes.filter(t => t.type === 'college');
  const mediaTribes = tribes.filter(t => t.type === 'media');

  const handleLaunchSimulation = () => {
    if (!selectedRole) return;
    
    const tribe = selectedRole === 'tribe_admin' ? selectedTribe : null;
    startSimulation(selectedRole, tribe);
    
    // Navigate to the appropriate dashboard
    if (selectedRole === 'tribe_admin') {
      navigate('/creator-studio');
    } else if (selectedRole === 'vip_brand') {
      navigate('/brand-hub');
    } else {
      navigate('/feed');
    }
  };

  const handleResetSimulation = () => {
    stopSimulation();
    setSelectedRole(null);
    setSelectedTribe('');
  };

  const roleOptions = [
    { 
      role: 'user' as SimulatedRole, 
      label: 'Regular User', 
      description: 'View as a standard verified user',
      icon: Users, 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50'
    },
    { 
      role: 'tribe_admin' as SimulatedRole, 
      label: 'Tribe Admin', 
      description: 'Manage a specific college or media hub',
      icon: Shield, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      role: 'vip_brand' as SimulatedRole, 
      label: 'Brand / Shop', 
      description: 'View as an official partner or shop',
      icon: Store, 
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
  ];

  const canLaunch = selectedRole && (selectedRole !== 'tribe_admin' || selectedTribe);

  if (isLoading || loadingTribes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/gatekeeper')}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <AdaptiveLogo size="w-9 h-9" />
            <div>
              <h1 className="text-base font-bold text-foreground">Simulator Hub</h1>
              <p className="text-[10px] text-muted-foreground">Super Admin Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-medium text-foreground">Super</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">View-As Simulator</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Experience the app as different user roles without affecting any data
          </p>
        </motion.div>

        {/* Currently Simulating Banner */}
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-amber-500/30 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Simulation Active</p>
                      <p className="text-xs text-amber-600">UI is showing simulated view</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetSimulation}
                    className="border-amber-500/30 text-amber-700 hover:bg-amber-100"
                  >
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Select Role
              </CardTitle>
              <CardDescription className="text-xs">
                Choose which role you want to simulate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roleOptions.map((option) => (
                <button
                  key={option.role}
                  onClick={() => {
                    setSelectedRole(option.role);
                    if (option.role !== 'tribe_admin') {
                      setSelectedTribe('');
                    }
                  }}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedRole === option.role
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${option.bgColor} flex items-center justify-center`}>
                      <option.icon className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedRole === option.role && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tribe Selection (for Tribe Admin) */}
        {selectedRole === 'tribe_admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Select Tribe
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose which tribe to administrate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTribe} onValueChange={setSelectedTribe}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tribe..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {collegeTribes.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          Colleges
                        </div>
                        {collegeTribes.map(tribe => (
                          <SelectItem key={tribe.id} value={tribe.name}>
                            {tribe.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {mediaTribes.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 mt-2">
                          <Radio className="w-3 h-3" />
                          Media Hubs
                        </div>
                        {mediaTribes.map(tribe => (
                          <SelectItem key={tribe.id} value={tribe.name}>
                            {tribe.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Launch Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleLaunchSimulation}
            disabled={!canLaunch}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Launch Simulation
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            This only changes UI behavior. No database operations are affected.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminSimulator;
