import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { AppLayout } from '@/components/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { ProfileSetupPage } from '@/pages/ProfileSetupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ResumePage } from '@/pages/ResumePage';
import { SkillGapPage } from '@/pages/SkillGapPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { JobsPage } from '@/pages/JobsPage';
import { Loader2 } from 'lucide-react';

const publicRoutes = ['/', '/login', '/signup'];

function AppRoutes() {
  const { path, navigate } = useRouter();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Public routes
  if (path === '/') return <LandingPage />;
  if (path === '/login') {
    if (user) {
      navigate('/dashboard');
      return null;
    }
    return <AuthPage mode="login" />;
  }
  if (path === '/signup') {
    if (user) {
      navigate('/dashboard');
      return null;
    }
    return <AuthPage mode="signup" />;
  }

  // Protected routes — require authentication
  if (!user) {
    navigate('/login');
    return null;
  }

  // Profile setup — allowed without completed profile
  if (path === '/profile-setup') return <ProfileSetupPage />;

  // All other protected routes require a profile
  // If profile is missing basic info, redirect to setup
  const needsProfileSetup = !profile?.branch && !profile?.target_role_id;

  if (path === '/dashboard') return <AppLayout><DashboardPage /></AppLayout>;
  if (path === '/resume') return <AppLayout><ResumePage /></AppLayout>;
  if (path === '/skill-gap') return <AppLayout><SkillGapPage /></AppLayout>;
  if (path === '/roadmap') return <AppLayout><RoadmapPage /></AppLayout>;
  if (path === '/progress') return <AppLayout><ProgressPage /></AppLayout>;
  if (path === '/jobs') return <AppLayout><JobsPage /></AppLayout>;

  // Default redirect
  navigate('/dashboard');
  return null;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </RouterProvider>
  );
}
