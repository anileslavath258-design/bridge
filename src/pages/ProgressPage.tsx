import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type ScoreEntry, type Roadmap } from '@/lib/supabase';
import {
  Loader2,
  TrendingUp,
  Award,
  CheckCircle2,
  Target,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export function ProgressPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [scoresRes, roadmapRes] = await Promise.all([
        supabase.from('score_history').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('roadmaps').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      setScores(scoresRes.data as ScoreEntry[] ?? []);
      setRoadmap(roadmapRes.data as Roadmap | null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const steps = roadmap?.steps ?? [];
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const currentScore = scores.length > 0 ? scores[scores.length - 1].score : 0;
  const firstScore = scores.length > 0 ? scores[0].score : 0;
  const scoreChange = currentScore - firstScore;

  // Build SVG line chart data
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = scores.map((s, i) => ({
    x: padding.left + (scores.length > 1 ? (i / (scores.length - 1)) * innerW : innerW / 2),
    y: padding.top + innerH - (s.score / 100) * innerH,
    score: s.score,
    label: s.label,
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`
    : '';

  // Badges
  const badges = [
    { id: 'first_resume', label: 'First Resume', desc: 'Built your first resume', earned: scores.length > 0, icon: FileText },
    { id: 'score_50', label: 'Getting There', desc: 'ATS score reached 50+', earned: currentScore >= 50, icon: TrendingUp },
    { id: 'score_70', label: 'Strong Match', desc: 'ATS score reached 70+', earned: currentScore >= 70, icon: Award },
    { id: 'first_step', label: 'First Step', desc: 'Completed first roadmap step', earned: completedSteps >= 1, icon: CheckCircle2 },
    { id: 'halfway', label: 'Halfway There', desc: '50% of roadmap completed', earned: progressPct >= 50, icon: Target },
    { id: 'all_done', label: 'Skill Master', desc: 'Completed entire roadmap', earned: totalSteps > 0 && completedSteps === totalSteps, icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progress Tracker</h1>
        <p className="mt-1 text-slate-600">Track your ATS score improvement and learning milestones</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Award className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Current ATS Score</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{currentScore}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Score Improvement</p>
          </div>
          <p className={`mt-3 text-3xl font-bold ${scoreChange > 0 ? 'text-emerald-600' : scoreChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {scoreChange > 0 ? '+' : ''}{scoreChange}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">Roadmap Progress</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{progressPct}%</p>
        </div>
      </div>

      {/* ATS Score Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-slate-900">ATS Score Over Time</h2>
        <p className="mb-5 text-sm text-slate-500">See how your resume quality improves with each update</p>

        {scores.length > 0 ? (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: '400px' }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = padding.top + innerH - (val / 100) * innerH;
                return (
                  <g key={val}>
                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{val}</text>
                  </g>
                );
              })}

              {/* Area */}
              {points.length > 1 && (
                <>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaD} fill="url(#scoreGradient)" />
                </>
              )}

              {/* Line */}
              {points.length > 0 && (
                <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">{p.score}</text>
                  <text x={p.x} y={chartHeight - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">{p.date}</text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <TrendingUp className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">No score history yet</p>
            <p className="text-sm text-slate-400">Save your resume to start tracking your ATS score over time</p>
            <button
              onClick={() => navigate('/resume')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              Go to Resume Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Skill completion chart */}
      {totalSteps > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Skills Completed</h2>
          <p className="mb-5 text-sm text-slate-500">{completedSteps} of {totalSteps} roadmap skills completed</p>

          {/* Bar chart */}
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="w-32 flex-shrink-0 truncate text-sm text-slate-600">{step.skill}</div>
                <div className="flex-1 h-6 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className={`flex h-full items-center justify-end rounded-lg px-2 text-xs font-medium text-white transition-all duration-500 ${
                      step.completed ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    style={{ width: step.completed ? '100%' : '30%' }}
                  >
                    {step.completed ? 'Done' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Achievements & Badges</h2>
        <p className="mb-5 text-sm text-slate-500">Celebrate your milestones as you progress</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  badge.earned
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${badge.earned ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${badge.earned ? 'text-slate-900' : 'text-slate-500'}`}>{badge.label}</p>
                  <p className="text-xs text-slate-400">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
