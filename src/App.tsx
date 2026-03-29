import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ProfileCardProvider } from "@/contexts/ProfileCardContext";
import ProfileCardOverlay from "@/components/ProfileCardOverlay";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { InteractionFeedbackProvider } from "@/components/InteractionFeedback";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import ViewAsSimulator from "@/components/ViewAsSimulator";
import PendingVerificationOverlay from "@/components/PendingVerificationOverlay";
import NetworkStatus from "@/components/NetworkStatus";
import MobileAppShell from "@/components/MobileAppShell";
import PendingVerificationOverlay from "@/components/PendingVerificationOverlay";
import Auth from "./pages/Auth";
import SocietyFeed from "./pages/SocietyFeed";
import Gatekeeper from "./pages/Gatekeeper";
import Market from "./pages/Market";
import TribeFeed from "./pages/TribeFeed";
import Rooms from "./pages/Rooms";
import RoomChat from "./pages/RoomChat";
import BusinessDashboard from "./pages/BusinessDashboard";
import Explore from "./pages/Explore";
import TribePage from "./pages/TribePage";
import BrandPage from "./pages/BrandPage";
import About from "./pages/About";
import Settings from "./pages/Settings";
import AdminSimulator from "./pages/AdminSimulator";
import BrandHub from "./pages/BrandHub";
import CreatorStudio from "./pages/CreatorStudio";
import ProfilePage from "./pages/ProfilePage";
import ExecutiveConsole from "./pages/ExecutiveConsole";
import TribeAdminHub from "./pages/TribeAdminHub";
import VerificationStation from "./pages/VerificationStation";
import Leaderboard from "./pages/Leaderboard";
import OnboardingNotification from "./components/OnboardingNotification";
import AzureFinancePage from "./pages/market/AzureFinancePage";
import VerdeNetworkPage from "./pages/market/VerdeNetworkPage";
import BeaconBankPage from "./pages/market/BeaconBankPage";
import ResetPassword from "./pages/ResetPassword";
import CheckEmail from "./pages/CheckEmail";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AIAssistant from "./pages/AIAssistant";
import ShopOffice from "./pages/ShopOffice";
import TribePending from "./pages/TribePending";
import PostManagement from "./pages/PostManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Root route: authenticated → /feed, otherwise → /auth
const RootRedirect = () => {
  const { user, profile, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (isSuperAdmin) return <Navigate to="/gatekeeper" replace />;
  // If no tribe or not verified, go to pending
  if (!profile?.tribe_id || !profile?.is_verified) return <Navigate to="/pending" replace />;
  return <Navigate to="/feed" replace />;
};

// Protected route for authenticated users (verified OR unverified — overlay handles the rest)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admins bypass verification
  if (!isSuperAdmin && (!profile?.tribe_id || !profile?.is_verified)) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};

// Auth route - redirect if already authenticated
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (isSuperAdmin) return <Navigate to="/gatekeeper" replace />;
    if (!profile?.tribe_id || !profile?.is_verified) return <Navigate to="/pending" replace />;
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

// Admin route - only for tribe_admin and super_admin (platform authority)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

// Brand route - for brand owners (vip_brand role) — also allow super_admin access for management
const BrandRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isVipBrand, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (!isVipBrand && !isSuperAdmin)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isSuperAdmin } = useAuth();
  const { isMaintenanceMode, maintenanceMessage, isLoading } = useMaintenanceMode();

  if (!isLoading && isMaintenanceMode && !isSuperAdmin) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <SocietyFeed />
          </ProtectedRoute>
        }
      />
      {/* Legacy /pending route redirects to /feed (overlay handles it now) */}
      <Route path="/pending" element={<TribePending />} />
      <Route
        path="/gatekeeper"
        element={
          <AdminRoute>
            <Gatekeeper />
          </AdminRoute>
        }
      />
      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tribe-feed"
        element={
          <ProtectedRoute>
            <TribeFeed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Rooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <RoomChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business"
        element={
          <ProtectedRoute>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tribe/:id"
        element={
          <ProtectedRoute>
            <TribePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand/:id"
        element={
          <ProtectedRoute>
            <BrandPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/simulator"
        element={
          <AdminRoute>
            <AdminSimulator />
          </AdminRoute>
        }
      />
      <Route
        path="/brand-hub"
        element={
          <BrandRoute>
            <BrandHub />
          </BrandRoute>
        }
      />
      <Route
        path="/shop-office"
        element={
          <ProtectedRoute>
            <ShopOffice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator-studio"
        element={
          <AdminRoute>
            <CreatorStudio />
          </AdminRoute>
        }
      />
      <Route
        path="/executive-console"
        element={
          <AdminRoute>
            <ExecutiveConsole />
          </AdminRoute>
        }
      />
      <Route
        path="/tribe-admin/:tribeName?"
        element={
          <AdminRoute>
            <TribeAdminHub />
          </AdminRoute>
        }
      />
      <Route
        path="/verification-station"
        element={
          <AdminRoute>
            <VerificationStation />
          </AdminRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route path="/market/azure-finance" element={<ProtectedRoute><AzureFinancePage /></ProtectedRoute>} />
      <Route path="/market/verde-network" element={<ProtectedRoute><VerdeNetworkPage /></ProtectedRoute>} />
      <Route path="/market/beacon-bank" element={<ProtectedRoute><BeaconBankPage /></ProtectedRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/post-management" element={<AdminRoute><PostManagement /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ViewAsProvider>
            <ProfileCardProvider>
              <InteractionFeedbackProvider>
                <ViewAsSimulator />
                <OnboardingNotification />
                <ProfileCardOverlay />
                <AppRoutes />
              </InteractionFeedbackProvider>
            </ProfileCardProvider>
          </ViewAsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
