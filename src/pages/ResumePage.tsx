import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole, type Resume, type EducationEntry, type ProjectEntry, type InternshipEntry } from '@/lib/supabase';
import { analyzeSkills, generateResumeSuggestions } from '@/lib/analysis';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  FileText,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';

const emptyEducation: EducationEntry = { degree: '', institution: '', year: '', cgpa: '' };
const emptyProject: ProjectEntry = { title: '', description: '', technologies: '', link: '' };
const emptyInternship: InternshipEntry = { company: '', role: '', duration: '', description: '' };

export function ResumePage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [role, setRole] = useState<JobRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [education, setEducation] = useState<EducationEntry[]>([emptyEducation]);
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([emptyProject]);
  const [internships, setInternships] = useState<InternshipEntry[]>([emptyInternship]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const r = data as Resume;
        setResumeId(r.id);
        setEducation(r.education?.length ? r.education : [emptyEducation]);
        setSkills(r.skills ?? []);
        setProjects(r.projects?.length ? r.projects : [emptyProject]);
        setInternships(r.internships?.length ? r.internships : [emptyInternship]);
        setAchievements(r.achievements ?? []);
      }

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSavedMsg(false);

    const cleanedEducation = education.filter((e) => e.degree || e.institution);
    const cleanedProjects = projects.filter((p) => p.title);
    const cleanedInternships = internships.filter((i) => i.company || i.role);

    const payload = {
      user_id: user.id,
      education: cleanedEducation,
      skills,
      projects: cleanedProjects,
      internships: cleanedInternships,
      achievements,
      raw_text: '',
      updated_at: new Date().toISOString(),
    };

    let result;
    if (resumeId) {
      result = await supabase.from('resumes').update(payload).eq('id', resumeId);
    } else {
      result = await supabase.from('resumes').insert(payload).select('id').single();
      if (result.data) setResumeId(result.data.id);
    }

    if (!result.error) {
      // Run analysis if role is set
      if (role) {
        const analysisResult = analyzeSkills(skills, role);
        const { error: aErr } = await supabase.from('skill_analyses').insert({
          user_id: user.id,
          role_id: role.id,
          matched_skills: analysisResult.matched,
          partial_skills: analysisResult.partial,
          missing_skills: analysisResult.missing,
          ats_score: analysisResult.atsScore,
          suggestions: analysisResult.suggestions,
        });
        if (!aErr) {
          // Record score history
          await supabase.from('score_history').insert({
            user_id: user.id,
            score: analysisResult.atsScore,
            label: 'Resume updated',
          });
        }
      }
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }
    setSaving(false);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addAchievement = () => {
    const trimmed = achievementInput.trim();
    if (trimmed) {
      setAchievements([...achievements, trimmed]);
      setAchievementInput('');
    }
  };

  const removeAchievement = (idx: number) => {
    setAchievements(achievements.filter((_, i) => i !== idx));
  };

  // Live ATS score
  const liveAnalysis = role ? analyzeSkills(skills, role) : null;
  const liveSuggestions = role
    ? generateResumeSuggestions(
        { skills, projects: projects.filter((p) => p.title), internships: internships.filter((i) => i.company), education: education.filter((e) => e.degree), achievements },
        role
      )
    : [];

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
        <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-900">Set a target role first</p>
          <p className="mt-1 text-slate-500">Select a target job role in your profile to get ATS scoring and skill suggestions.</p>
          <button
            onClick={() => navigate('/profile-setup')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Set target role
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
          <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
          <p className="mt-1 text-slate-600">Build your resume and get live ATS feedback for {role.title}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save & Analyze'}
        </button>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Resume saved and analyzed! Your ATS score has been updated.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form sections — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Education */}
          <Section title="Education" icon={<Award className="h-5 w-5" />}>
            {education.map((edu, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Degree (e.g. B.Tech)"
                  value={edu.degree}
                  onChange={(e) => {
                    const next = [...education];
                    next[i] = { ...edu, degree: e.target.value };
                    setEducation(next);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const next = [...education];
                    next[i] = { ...edu, institution: e.target.value };
                    setEducation(next);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  placeholder="Year (e.g. 2027)"
                  value={edu.year}
                  onChange={(e) => {
                    const next = [...education];
                    next[i] = { ...edu, year: e.target.value };
                    setEducation(next);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="CGPA (e.g. 8.5)"
                    value={edu.cgpa}
                    onChange={(e) => {
                      const next = [...education];
                      next[i] = { ...edu, cgpa: e.target.value };
                      setEducation(next);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {education.length > 1 && (
                    <button
                      onClick={() => setEducation(education.filter((_, idx) => idx !== i))}
                      className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <AddButton onClick={() => setEducation([...education, emptyEducation])} label="Add education" />
          </Section>

          {/* Skills */}
          <Section title="Skills" icon={<Sparkles className="h-5 w-5" />}>
            <div className="flex gap-2">
              <input
                placeholder="Type a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={addSkill}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const isMatched = liveAnalysis?.matched.includes(skill);
                  return (
                    <span
                      key={skill}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        isMatched
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isMatched && <CheckCircle2 className="h-3 w-3" />}
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-0.5 text-slate-400 hover:text-red-500">
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {role && skills.length === 0 && (
              <p className="text-xs text-slate-400">
                Tip: Add skills from the target role like {role.required_skills.slice(0, 4).join(', ')}
              </p>
            )}
          </Section>

          {/* Projects */}
          <Section title="Projects" icon={<FileText className="h-5 w-5" />}>
            {projects.map((proj, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Project {i + 1}</span>
                  {projects.length > 1 && (
                    <button
                      onClick={() => setProjects(projects.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  placeholder="Project title"
                  value={proj.title}
                  onChange={(e) => {
                    const next = [...projects];
                    next[i] = { ...proj, title: e.target.value };
                    setProjects(next);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <textarea
                  placeholder="Description (what you built, impact, your role)"
                  value={proj.description}
                  onChange={(e) => {
                    const next = [...projects];
                    next[i] = { ...proj, description: e.target.value };
                    setProjects(next);
                  }}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Technologies (e.g. React, Node.js, MongoDB)"
                    value={proj.technologies}
                    onChange={(e) => {
                      const next = [...projects];
                      next[i] = { ...proj, technologies: e.target.value };
                      setProjects(next);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    placeholder="Link (GitHub / demo)"
                    value={proj.link}
                    onChange={(e) => {
                      const next = [...projects];
                      next[i] = { ...proj, link: e.target.value };
                      setProjects(next);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            ))}
            <AddButton onClick={() => setProjects([...projects, emptyProject])} label="Add project" />
          </Section>

          {/* Internships */}
          <Section title="Internships & Experience" icon={<Award className="h-5 w-5" />}>
            {internships.map((intern, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Experience {i + 1}</span>
                  {internships.length > 1 && (
                    <button
                      onClick={() => setInternships(internships.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Company"
                    value={intern.company}
                    onChange={(e) => {
                      const next = [...internships];
                      next[i] = { ...intern, company: e.target.value };
                      setInternships(next);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    placeholder="Role"
                    value={intern.role}
                    onChange={(e) => {
                      const next = [...internships];
                      next[i] = { ...intern, role: e.target.value };
                      setInternships(next);
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <input
                  placeholder="Duration (e.g. 3 months, Summer 2025)"
                  value={intern.duration}
                  onChange={(e) => {
                    const next = [...internships];
                    next[i] = { ...intern, duration: e.target.value };
                    setInternships(next);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <textarea
                  placeholder="What you did and achieved"
                  value={intern.description}
                  onChange={(e) => {
                    const next = [...internships];
                    next[i] = { ...intern, description: e.target.value };
                    setInternships(next);
                  }}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            ))}
            <AddButton onClick={() => setInternships([...internships, emptyInternship])} label="Add experience" />
          </Section>

          {/* Achievements */}
          <Section title="Achievements & Certifications" icon={<Sparkles className="h-5 w-5" />}>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Winner of Smart India Hackathon 2025"
                value={achievementInput}
                onChange={(e) => setAchievementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAchievement();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={addAchievement}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {achievements.length > 0 && (
              <div className="space-y-2">
                {achievements.map((ach, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="flex-1">{ach}</span>
                    <button onClick={() => removeAchievement(i)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ATS sidebar — 1 col */}
        <div className="space-y-4">
          {/* ATS Score Card */}
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Live ATS Score</h3>
            </div>

            {liveAnalysis && (
              <>
                <div className="mt-5 flex flex-col items-center">
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke={liveAnalysis.atsScore >= 70 ? '#10b981' : liveAnalysis.atsScore >= 40 ? '#f59e0b' : '#cbd5e1'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(liveAnalysis.atsScore / 100) * 327} 327`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-bold ${liveAnalysis.atsScore >= 70 ? 'text-emerald-600' : liveAnalysis.atsScore >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {liveAnalysis.atsScore}
                      </span>
                      <span className="text-xs text-slate-400">out of 100</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Matched
                    </span>
                    <span className="font-semibold text-slate-900">{liveAnalysis.matched.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <AlertCircle className="h-4 w-4" /> Partial
                    </span>
                    <span className="font-semibold text-slate-900">{liveAnalysis.partial.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <AlertCircle className="h-4 w-4" /> Missing
                    </span>
                    <span className="font-semibold text-slate-900">{liveAnalysis.missing.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Suggestions */}
          {liveSuggestions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Suggestions</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {liveSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download */}
          <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Download Resume (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
