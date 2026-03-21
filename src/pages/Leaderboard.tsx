import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import StudentPointsCard from '@/components/points/StudentPointsCard';
import IndividualLeaderboard from '@/components/points/IndividualLeaderboard';
import TribeLeaderboard from '@/components/points/TribeLeaderboard';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<'home' | 'discover' | 'chat' | 'market'>('discover');

  const handleNavClick = (item: 'home' | 'discover' | 'chat' | 'market') => {
    setActiveNav(item);
    const routes = { home: '/feed', discover: '/explore', chat: '/tribe-feed', market: '/market' };
    navigate(routes[item]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Leaderboard</h1>
            <p className="text-xs text-muted-foreground">Top contributors on Mijedu</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Current user's points card */}
        <StudentPointsCard />

        {/* Leaderboard tabs */}
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="individual" className="gap-1.5">
              <Trophy className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="tribe" className="gap-1.5">
              <Users className="w-4 h-4" />
              Tribes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="individual" className="mt-4">
            <IndividualLeaderboard />
          </TabsContent>
          <TabsContent value="tribe" className="mt-4">
            <TribeLeaderboard />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav activeItem={activeNav} onItemClick={handleNavClick} />
    </div>
  );
};

export default Leaderboard;
