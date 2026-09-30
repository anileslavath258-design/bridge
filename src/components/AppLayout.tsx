import { type ReactNode } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Target,
  Map,
  TrendingUp,
  Briefcase,
  LogOut,
  GraduationCap,
  FileSearch,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resume', label: 'Resume', icon: FileText },
  { path: '/ats-analyzer', label: 'ATS Analyzer', icon: FileSearch },
  { path: '/skill-gap', label: 'Skill Gap', icon: Target },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { path, navigate } = useRouter();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">CareerBridge</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Student'}</p>
            <p className="text-xs text-slate-500 truncate">{profile?.branch || 'Set up profile'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">CareerBridge</span>
        </div>
        <button onClick={handleSignOut} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = path === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-screen px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
