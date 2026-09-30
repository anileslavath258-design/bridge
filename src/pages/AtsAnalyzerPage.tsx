import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume, type AtsAnalysis } from '@/lib/supabase';
import { analyzeAts } from '@/lib/analysis';
import {
  Loader2,
  FileSearch,
  ChevronDown,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Award,
} from 'lucide-react';

export function AtsAnalyzerPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [result, setResult] = useState<AtsAnalysis | null>(null);
  const [resumeSource, setResumeSource] = useState<'saved' | 'paste'>('saved');
  const [pastedResume, setPastedResume] = useState('');

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [useCustomJD, setUseCustomJD] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [rolesRes, resumeRes] = await Promise.all([
        supabase.from('job_roles').select('*').order('title'),
        supabase.from('resumes').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      setRoles(rolesRes.data as JobRole[] ?? []);
      setResume(resumeRes.data as Resume | null);

      if (profile?.target_role_id) {
        setSelectedRoleId(profile.target_role_id);
        const { data: roleData } = await supabase
          .from('job_roles')
          .select('*')
          .eq('id', profile.target_role_id)
          .maybeSingle();
        if (roleData) {
          setJobDescription((roleData as JobRole).description);
        }
      }

      // Load latest ATS analysis
      const { data: lastAnalysis } = await supabase
        .from('ats_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastAnalysis) {
        setResult(lastAnalysis as AtsAnalysis);
        setHasAnalyzed(true);
      }

      setLoading(false);
    })();
  }, [user, profile]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const handleAnalyze = async () => {
    if (!user) return;
    setAnalyzing(true);

    const role = selectedRole;
    const jdText = useCustomJD ? jobDescription : (role?.description ?? jobDescription);

    // Build resume data for analysis
    const resumeData = resume ?? {
      education: [],
      skills: [],
      projects: [],
      internships: [],
      achievements: [],
      raw_text: pastedResume,
    };

    const rawText = resumeSource === 'paste' ? pastedResume : (resume?.raw_text ?? '');
    const analysisResult = analyzeAts(resumeData, rawText, role, jdText);

    const { data } = await supabase
      .from('ats_analyses')
      .insert({
        user_id: user.id,
        role_id: role?.id ?? null,
        job_description: jdText,
        ats_score: analysisResult.atsScore,
        keyword_score: analysisResult.keywordScore,
        skills_score: analysisResult.skillsScore,
        formatting_score: analysisResult.formattingScore,
        section_score: analysisResult.sectionScore,
        matched_keywords: analysisResult.matchedKeywords,
        missing_keywords: analysisResult.missingKeywords,
        matched_skills: analysisResult.matchedSkills,
        missing_skills: analysisResult.missingSkills,
        suggestions: analysisResult.suggestions,
      })
      .select('*')
      .single();

    if (data) {
      setResult(data as AtsAnalysis);

      // Also record in score_history for the progress graph
      await supabase.from('score_history').insert({
        user_id: user.id,
        score: analysisResult.atsScore,
        label: `ATS Analysis${role ? ` — ${role.title}` : ''}`,
      });
    }

    setHasAnalyzed(true);
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ATS Resume Analyzer</h1>
        <p className="mt-1 text-slate-600">Check how well your resume matches a role</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Step 1: Select Target Role */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">1</div>
              <h2 className="font-semibold text-slate-900">Select Target Role</h2>
            </div>
            <div className="relative">
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  const role = roles.find((r) => r.id === e.target.value);
                  if (role && !useCustomJD) {
                    setJobDescription(role.description);
                  }
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Choose a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title} — {role.category}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
            {selectedRole && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedRole.required_skills.slice(0, 6).map((s) => (
                  <span key={s} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {s}
                  </span>
                ))}
                {selectedRole.required_skills.length > 6 && (
                  <span className="text-xs text-slate-400">+{selectedRole.required_skills.length - 6} more</span>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Job Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">2</div>
                <h2 className="font-semibold text-slate-900">Job Description</h2>
              </div>
              <button
                onClick={() => setUseCustomJD(!useCustomJD)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {useCustomJD ? 'Use role default' : 'Paste custom JD'}
              </button>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {!useCustomJD && selectedRole && (
              <p className="mt-2 text-xs text-slate-400">
                Using default JD for {selectedRole.title}. Click "Paste custom JD" to use your own.
              </p>
            )}
          </div>

          {/* Step 3: Resume Source */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">3</div>
              <h2 className="font-semibold text-slate-900">Resume</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setResumeSource('saved')}
                className={`flex flex-1 items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  resumeSource === 'saved'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText className={`h-5 w-5 ${resumeSource === 'saved' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${resumeSource === 'saved' ? 'text-blue-700' : 'text-slate-600'}`}>Use My Resume</p>
                  <p className="text-xs text-slate-400">
                    {resume ? `${resume.skills.length} skills, ${resume.projects.length} projects` : 'No resume yet'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => setResumeSource('paste')}
                className={`flex flex-1 items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  resumeSource === 'paste'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Upload className={`h-5 w-5 ${resumeSource === 'paste' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${resumeSource === 'paste' ? 'text-blue-700' : 'text-slate-600'}`}>Paste Resume</p>
                  <p className="text-xs text-slate-400">Paste your resume text</p>
                </div>
              </button>
            </div>
            {resumeSource === 'paste' && (
              <textarea
                value={pastedResume}
                onChange={(e) => setPastedResume(e.target.value)}
                placeholder="Paste your full resume text here..."
                rows={6}
                className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            )}
            {resumeSource === 'saved' && !resume && (
              <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                You haven't built a resume yet.{' '}
                <button onClick={() => navigate('/resume')} className="font-semibold underline">
                  Build it now
                </button>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!selectedRoleId && !useCustomJD) || (resumeSource === 'paste' && !pastedResume.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!hasAnalyzed && !result && (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
              <FileSearch className="h-14 w-14 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-900">Your ATS Results</p>
              <p className="mt-1 text-sm text-slate-500">
                Select a role, add a job description, and click "Analyze Resume" to see your detailed ATS score breakdown.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Overall Score */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Award className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Your ATS Score</h3>
                </div>

                <div className="mt-6 flex flex-col items-center">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={result.ats_score >= 70 ? '#10b981' : result.ats_score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(result.ats_score / 100) * 327} 327`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-4xl font-bold ${result.ats_score >= 70 ? 'text-emerald-600' : result.ats_score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {result.ats_score}
                      </span>
                      <span className="text-xs text-slate-400">out of 100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-semibold text-slate-900">Score Breakdown</h3>
                <div className="space-y-4">
                  <ScoreBar label="Keyword Match" score={result.keyword_score} icon={<FileSearch className="h-4 w-4" />} />
                  <ScoreBar label="Skills Match" score={result.skills_score} icon={<CheckCircle2 className="h-4 w-4" />} />
                  <ScoreBar label="Sections" score={result.section_score} icon={<FileText className="h-4 w-4" />} />
                  <ScoreBar label="Formatting" score={result.formatting_score} icon={<Award className="h-4 w-4" />} />
                </div>
              </div>

              {/* Matched & Missing Skills */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-semibold text-slate-900">Skills Analysis</h3>

                {result.matched_skills.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">Matched Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched_skills.map((s) => (
                        <span key={s} className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.missing_skills.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-sm font-medium text-rose-700">Missing Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_skills.map((s) => (
                        <span key={s} className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.missing_keywords.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700">Missing Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_keywords.filter((k) => !result.missing_skills.includes(k)).slice(0, 10).map((k) => (
                        <span key={k} className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Improvement Suggestions</h3>
                </div>
                <ol className="space-y-2.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/resume')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Improve My Resume
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const textColor = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
