import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume, type SkillAnalysis } from '@/lib/supabase';
import { analyzeSkills } from '@/lib/analysis';
import {
  Loader2,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export function SkillGapPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [role, setRole] = useState<JobRole | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [resumeRes, analysisRes] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('skill_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setResume(resumeRes.data as Resume | null);
      setAnalysis(analysisRes.data as SkillAnalysis | null);

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

  const runAnalysis = async () => {
    if (!user || !role || !resume) return;
    setAnalyzing(true);
    const result = analyzeSkills(resume.skills, role);

    const { data } = await supabase
      .from('skill_analyses')
      .insert({
        user_id: user.id,
        role_id: role.id,
        matched_skills: result.matched,
        partial_skills: result.partial,
        missing_skills: result.missing,
        ats_score: result.atsScore,
        suggestions: result.suggestions,
      })
      .select('*')
      .single();

    if (data) setAnalysis(data as SkillAnalysis);
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Skill Gap Analysis</h1>
        <EmptyState
          title="Set a target role first"
          desc="Select a target job role to see your skill gaps."
          actionLabel="Set target role"
          onAction={() => navigate('/profile-setup')}
        />
      </div>
    );
  }

  if (!resume || resume.skills.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Skill Gap Analysis</h1>
        <EmptyState
          title="Build your resume first"
          desc="Add your skills in the resume builder to run a skill gap analysis."
          actionLabel="Go to Resume Builder"
          onAction={() => navigate('/resume')}
        />
      </div>
    );
  }

  const matched = analysis?.matched_skills ?? [];
  const partial = analysis?.partial_skills ?? [];
  const missing = analysis?.missing_skills ?? [];
  const atsScore = analysis?.ats_score ?? 0;
  const total = role.required_skills.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skill Gap Analysis</h1>
          <p className="mt-1 text-slate-600">
            Comparing your skills against <span className="font-medium text-blue-600">{role.title}</span>
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {analyzing ? 'Analyzing...' : 'Re-run Analysis'}
        </button>
      </div>

      {/* Score overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <ScoreCard label="ATS Score" value={atsScore.toString()} sub="out of 100" color={atsScore >= 70 ? 'emerald' : atsScore >= 40 ? 'amber' : 'slate'} />
        <ScoreCard label="Matched" value={matched.length.toString()} sub={`of ${total} required`} color="emerald" icon={<CheckCircle2 className="h-4 w-4" />} />
        <ScoreCard label="Partial" value={partial.length.toString()} sub="partially matched" color="amber" icon={<AlertTriangle className="h-4 w-4" />} />
        <ScoreCard label="Missing" value={missing.length.toString()} sub="need to learn" color="rose" icon={<XCircle className="h-4 w-4" />} />
      </div>

      {/* Visual comparison */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-slate-900">Skill Comparison</h2>
        <p className="mb-5 text-sm text-slate-500">Your current skills vs. what {role.title} requires</p>

        <div className="space-y-6">
          {/* Matched */}
          <SkillGroup
            title="Matched Skills"
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="emerald"
            skills={matched}
            emptyMsg="No matching skills yet — add relevant skills to your resume."
          />

          {/* Partial */}
          <SkillGroup
            title="Partially Matched"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="amber"
            skills={partial}
            emptyMsg="No partially matched skills."
          />

          {/* Missing */}
          <SkillGroup
            title="Missing Skills"
            icon={<XCircle className="h-5 w-5" />}
            color="rose"
            skills={missing}
            emptyMsg="You have all the required skills — amazing!"
          />
        </div>
      </div>

      {/* Suggestions */}
      {analysis?.suggestions && analysis.suggestions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Recommendations</h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA to roadmap */}
      {missing.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Ready to close the gap?</h3>
              <p className="mt-1 text-sm text-slate-600">Generate a personalized learning roadmap for the {missing.length} skills you need.</p>
            </div>
            <button
              onClick={() => navigate('/roadmap')}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              Generate Roadmap
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, desc, actionLabel, onAction }: { title: string; desc: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Target className="mx-auto h-12 w-12 text-slate-300" />
      <p className="mt-4 text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-slate-500">{desc}</p>
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ScoreCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-400',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        {icon && <span className={colorMap[color]}>{icon}</span>}
        <span className={`text-3xl font-bold ${colorMap[color]}`}>{value}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function SkillGroup({ title, icon, color, skills, emptyMsg }: { title: string; icon: React.ReactNode; color: string; skills: string[]; emptyMsg: string }) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  };
  const c = colorMap[color];
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={c.text}>{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">({skills.length})</span>
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${c.bg} ${c.text} ring-1 ${c.ring}`}>
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">{emptyMsg}</p>
      )}
    </div>
  );
}
