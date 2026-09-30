import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume } from '@/lib/supabase';
import { analyzeSkills } from '@/lib/analysis';
import {
  Loader2,
  Briefcase,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from 'lucide-react';

type JobMatch = {
  role: JobRole;
  matchPct: number;
  matched: string[];
  missing: string[];
  partial: string[];
};

export function JobsPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [rolesRes, resumeRes] = await Promise.all([
        supabase.from('job_roles').select('*').order('title'),
        supabase.from('resumes').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      const rolesData = rolesRes.data as JobRole[] ?? [];
      const resumeData = resumeRes.data as Resume | null;
      setRoles(rolesData);
      setResume(resumeData);

      if (resumeData) {
        const computed = rolesData
          .map((role) => {
            const analysis = analyzeSkills(resumeData.skills, role);
            return {
              role,
              matchPct: analysis.atsScore,
              matched: analysis.matched,
              missing: analysis.missing,
              partial: analysis.partial,
            };
          })
          .sort((a, b) => b.matchPct - a.matchPct);
        setMatches(computed);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleApply = (roleId: string) => {
    setAppliedJobs((prev) => new Set(prev).add(roleId));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!resume || resume.skills.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Job Recommendations</h1>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-900">Build your resume first</p>
          <p className="mt-1 text-slate-500">Add your skills in the resume builder to see matched job recommendations.</p>
          <button
            onClick={() => navigate('/resume')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Go to Resume Builder
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Job Recommendations</h1>
        <p className="mt-1 text-slate-600">Roles matched to your profile based on your current skills</p>
      </div>

      {/* Best match highlight */}
      {matches.length > 0 && matches[0].matchPct > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-emerald-50 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Your best match</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{matches[0].role.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{matches[0].role.category} • {matches[0].matched.length} of {matches[0].role.required_skills.length} skills matched</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{matches[0].matchPct}%</p>
              <p className="text-xs text-slate-400">match</p>
            </div>
          </div>
        </div>
      )}

      {/* Job cards */}
      <div className="space-y-4">
        {matches.map((match) => {
          const isApplied = appliedJobs.has(match.role.id);
          const isTarget = profile?.target_role_id === match.role.id;
          return (
            <div
              key={match.role.id}
              className={`rounded-2xl border bg-white p-6 transition-all hover:shadow-md ${
                isTarget ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Briefcase className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{match.role.title}</h3>
                      <p className="text-sm text-slate-400">{match.role.category}</p>
                    </div>
                    {isTarget && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Target Role
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">{match.role.description}</p>

                  {/* Skill breakdown */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {match.matched.slice(0, 4).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> {s}
                      </span>
                    ))}
                    {match.partial.slice(0, 2).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> {s}
                      </span>
                    ))}
                    {match.missing.slice(0, 3).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        <XCircle className="h-3 w-3" /> {s}
                      </span>
                    ))}
                    {(match.matched.length + match.partial.length + match.missing.length) > 9 && (
                      <span className="text-xs text-slate-400">+{match.matched.length + match.partial.length + match.missing.length - 9} more</span>
                    )}
                  </div>
                </div>

                {/* Match % + Apply */}
                <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-end">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${match.matchPct >= 70 ? 'text-emerald-600' : match.matchPct >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {match.matchPct}%
                    </div>
                    <p className="text-xs text-slate-400">match</p>
                  </div>
                  <button
                    onClick={() => handleApply(match.role.id)}
                    disabled={isApplied}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      isApplied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isApplied ? 'Applied!' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Missing skills callout */}
              {match.missing.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Key skills to learn: {match.missing.slice(0, 5).join(', ')}
                  {match.missing.length > 5 && ` +${match.missing.length - 5} more`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply note */}
      {appliedJobs.size > 0 && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          You've applied to {appliedJobs.size} {appliedJobs.size === 1 ? 'role' : 'roles'}. This is a demo — applications aren't sent to real employers.
        </div>
      )}
    </div>
  );
}
