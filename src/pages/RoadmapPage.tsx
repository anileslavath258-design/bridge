import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume, type Roadmap, type RoadmapStep } from '@/lib/supabase';
import { analyzeSkills, generateRoadmap } from '@/lib/analysis';
import {
  Loader2,
  Map,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
} from 'lucide-react';

export function RoadmapPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [role, setRole] = useState<JobRole | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [resumeRes, roadmapRes] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('roadmaps').select('*').eq('user_id', user.id).maybeSingle(),
      ]);
      setResume(resumeRes.data as Resume | null);
      setRoadmap(roadmapRes.data as Roadmap | null);

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

  const generate = async () => {
    if (!user || !role || !resume) return;
    setGenerating(true);

    const analysis = analyzeSkills(resume.skills, role);
    const steps = generateRoadmap(analysis.missing, role.id);
    const totalWeeks = steps.reduce((sum, s) => sum + s.duration_weeks, 0);

    const payload = {
      user_id: user.id,
      role_id: role.id,
      steps: steps as unknown as Record<string, unknown>[],
      updated_at: new Date().toISOString(),
    };

    if (roadmap) {
      const { data } = await supabase.from('roadmaps').update(payload).eq('id', roadmap.id).select('*').single();
      if (data) setRoadmap(data as Roadmap);
    } else {
      const { data } = await supabase.from('roadmaps').insert(payload).select('*').single();
      if (data) setRoadmap(data as Roadmap);
    }

    setGenerating(false);
  };

  const toggleStep = async (stepId: string) => {
    if (!roadmap || !user) return;
    const updatedSteps = roadmap.steps.map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    setRoadmap({ ...roadmap, steps: updatedSteps });

    await supabase
      .from('roadmaps')
      .update({ steps: updatedSteps as unknown as Record<string, unknown>[], updated_at: new Date().toISOString() })
      .eq('id', roadmap.id);

    // If a step was completed, also add the skill to resume and record score
    const step = roadmap.steps.find((s) => s.id === stepId);
    if (step && !step.completed && resume) {
      // Mark as completed — add skill to resume
      if (!resume.skills.includes(step.skill)) {
        const newSkills = [...resume.skills, step.skill];
        setResume({ ...resume, skills: newSkills });
        await supabase.from('resumes').update({ skills: newSkills, updated_at: new Date().toISOString() }).eq('id', resume.id);

        // Recalculate score
        if (role) {
          const newAnalysis = analyzeSkills(newSkills, role);
          await supabase.from('score_history').insert({
            user_id: user.id,
            score: newAnalysis.atsScore,
            label: `Completed: ${step.skill}`,
          });
        }
      }
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Learning Roadmap</h1>
        <EmptyState
          title="Set a target role first"
          desc="Select a target job role to generate a learning roadmap."
          actionLabel="Set target role"
          onAction={() => navigate('/profile-setup')}
        />
      </div>
    );
  }

  if (!resume || resume.skills.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Learning Roadmap</h1>
        <EmptyState
          title="Build your resume first"
          desc="Add your current skills in the resume builder so we can identify what you need to learn."
          actionLabel="Go to Resume Builder"
          onAction={() => navigate('/resume')}
        />
      </div>
    );
  }

  const steps = roadmap?.steps ?? [];
  const completed = steps.filter((s) => s.completed).length;
  const totalWeeks = steps.reduce((sum, s) => sum + s.duration_weeks, 0);
  const progressPct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  if (!roadmap || steps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Roadmap</h1>
          <p className="mt-1 text-slate-600">Your personalized plan for {role.title}</p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <Map className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-900">Generate your roadmap</p>
          <p className="mt-1 text-slate-500">
            We'll create a step-by-step learning plan based on the skills you're missing for {role.title}.
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate Roadmap'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Roadmap</h1>
          <p className="mt-1 text-slate-600">Your plan for {role.title}</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Regenerate
        </button>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Overall Progress</p>
            <p className="text-sm text-slate-500">{completed} of {steps.length} skills completed</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{progressPct}%</p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {totalWeeks} weeks total
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="space-y-1">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex gap-4 pb-6">
                {/* Step number / check */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    step.completed
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 bg-white text-slate-400 hover:border-blue-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{idx + 1}</span>
                  )}
                </button>

                {/* Content */}
                <div className={`flex-1 rounded-xl border p-4 transition-all ${step.completed ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${step.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {step.skill}
                        </h3>
                        {step.completed && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <Award className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{step.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href={step.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          {step.resource_name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {step.duration_weeks} {step.duration_weeks === 1 ? 'week' : 'weeks'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!step.completed && (
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Mark as complete →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {completed === steps.length && steps.length > 0 && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 p-5 text-center">
            <Award className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-2 text-lg font-bold text-slate-900">All skills completed!</p>
            <p className="mt-1 text-sm text-slate-600">Your resume has been automatically updated with all new skills. Check your new ATS score!</p>
            <button
              onClick={() => navigate('/progress')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              View Progress
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, desc, actionLabel, onAction }: { title: string; desc: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Map className="mx-auto h-12 w-12 text-slate-300" />
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
