import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume, type SkillAnalysis, type Roadmap, type ScoreEntry } from '@/lib/supabase';
import {
  FileText,
  Target,
  Map,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  Award,
  CheckCircle2,
  Circle,
  Loader2,
  FileSearch,
} from 'lucide-react';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [role, setRole] = useState<JobRole | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [resumeRes, analysisRes, roadmapRes, scoresRes] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('skill_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('roadmaps').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('score_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ]);

      const r = resumeRes.data as Resume | null;
      setResume(r);
      setAnalysis(analysisRes.data as SkillAnalysis | null);
      setRoadmap(roadmapRes.data as Roadmap | null);
      setScoreHistory(scoresRes.data as ScoreEntry[] ?? []);

      if (profile?.target_role_id) {
        const { data: roleData } = await supabase
          .from('job_roles')
          .select('*')
          .eq('id', profile.target_role_id)
          .maybeSingle();
        setRole(roleData as JobRole | null);
      }
      setLoading(false);
    })();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const atsScore = analysis?.ats_score ?? 0;
  const roadmapSteps = roadmap?.steps ?? [];
  const completedSteps = roadmapSteps.filter((s) => s.completed).length;
  const totalSteps = roadmapSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const latestScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : atsScore;

  const resumeComplete = !!(resume && (resume.skills.length > 0 || resume.projects.length > 0));

  const quickActions = [
    {
      icon: FileText,
      title: 'Update Resume',
      desc: 'Add skills, projects, and experience',
      path: '/resume',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: FileSearch,
      title: 'Run ATS Analysis',
      desc: 'Check your resume against a job role',
      path: '/ats-analyzer',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: Target,
      title: 'View Skill Gap',
      desc: analysis ? `${analysis.missing_skills.length} skills to learn` : 'Run skill analysis',
      path: '/skill-gap',
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="mt-1 text-slate-600">Here's your career prep overview</p>
      </div>

      {/* Profile + ATS Score cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{profile?.full_name || 'Student'}</p>
              <p className="truncate text-sm text-slate-500">{profile?.branch || 'No branch set'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {profile?.college && (
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400">College:</span>
                <span className="truncate">{profile.college}</span>
              </div>
            )}
            {profile?.year && (
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400">Graduation:</span>
                <span>{profile.year}</span>
              </div>
            )}
            {role && (
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400">Target:</span>
                <span className="font-medium text-blue-600">{role.title}</span>
              </div>
            )}
          </div>
          {!profile?.target_role_id && (
            <button
              onClick={() => navigate('/profile-setup')}
              className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Complete your profile
            </button>
          )}
        </div>

        {/* ATS Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Current ATS Score</p>
            <Award className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${latestScore >= 70 ? 'text-emerald-600' : latestScore >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
              {latestScore}
            </span>
            <span className="text-lg text-slate-400">/ 100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${latestScore >= 70 ? 'bg-emerald-500' : latestScore >= 40 ? 'bg-amber-500' : 'bg-slate-300'}`}
              style={{ width: `${latestScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {latestScore >= 70 ? 'Strong match — keep it up!' : latestScore >= 40 ? 'Good progress — keep building' : 'Start building your resume'}
          </p>
        </div>

        {/* Resume Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Resume Status</p>
            <FileText className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            {resumeComplete ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-lg font-semibold text-slate-900">Resume Built</span>
              </>
            ) : (
              <>
                <Circle className="h-6 w-6 text-slate-300" />
                <span className="text-lg font-semibold text-slate-400">Not Built</span>
              </>
            )}
          </div>
          {resume && (
            <div className="mt-3 flex gap-3 text-xs text-slate-500">
              <span>{resume.skills.length} skills</span>
              <span>•</span>
              <span>{resume.projects.length} projects</span>
              <span>•</span>
              <span>{resume.internships.length} experiences</span>
            </div>
          )}
          <button
            onClick={() => navigate('/ats-analyzer')}
            className="mt-3 w-full rounded-lg bg-indigo-50 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Run ATS Analysis →
          </button>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Learning Progress</p>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{progressPct}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {totalSteps > 0 ? `${completedSteps} of ${totalSteps} roadmap steps completed` : 'No roadmap yet'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{action.title}</p>
                <p className="text-sm text-slate-500">{action.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </button>
          );
        })}
      </div>

      {/* Roadmap preview */}
      {roadmap && totalSteps > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Roadmap Progress</h2>
            <button
              onClick={() => navigate('/roadmap')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {roadmapSteps.slice(0, 5).map((step) => (
              <div key={step.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 flex-shrink-0 text-slate-300" />
                )}
                <span className={`text-sm ${step.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {step.skill}
                </span>
                <span className="ml-auto text-xs text-slate-400">{step.duration_weeks}w</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!resume && !analysis && !roadmap && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Get started in 3 steps</p>
          <p className="mt-1 text-slate-500">Build your resume, analyze your skills, and create a learning plan.</p>
          <button
            onClick={() => navigate('/resume')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Build your resume
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
