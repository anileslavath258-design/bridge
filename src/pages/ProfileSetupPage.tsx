import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type JobRole } from '@/lib/supabase';
import { GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const DOMAINS = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Cloud & DevOps',
  'Cybersecurity',
  'Core Electrical',
  'Core Mechanical',
  'Product Management',
  'UI/UX Design',
];

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Other',
];

export function ProfileSetupPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [customJD, setCustomJD] = useState('');
  const [useCustomJD, setUseCustomJD] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCollege(profile.college || '');
      setBranch(profile.branch || '');
      setYear(profile.year?.toString() || '');
      setInterests(profile.interests || []);
      setTargetRoleId(profile.target_role_id || '');
    }
  }, [profile]);

  useEffect(() => {
    supabase
      .from('job_roles')
      .select('*')
      .order('title')
      .then(({ data }) => {
        setRoles(data as JobRole[] ?? []);
        setLoading(false);
      });
  }, []);

  const toggleInterest = (domain: string) => {
    setInterests((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Not signed in');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setSaving(true);
    const { error: err } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        college: college.trim(),
        branch,
        year: year ? parseInt(year) : null,
        interests,
        target_role_id: useCustomJD ? null : targetRoleId || null,
        updated_at: new Date().toISOString(),
      });

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      await refreshProfile();
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">CareerBridge</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Set up your profile</h1>
          <p className="mt-2 text-slate-600">
            Tell us about yourself so we can tailor your resume analysis and learning roadmap.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology, Delhi"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Graduation Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2027"
                    min="2024"
                    max="2035"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Areas of Interest <span className="text-slate-400">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((domain) => {
                  const selected = interests.includes(domain);
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleInterest(domain)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {selected && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                      {domain}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Role */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Target Job Role</label>
                <button
                  type="button"
                  onClick={() => setUseCustomJD(!useCustomJD)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {useCustomJD ? 'Choose from list' : 'Paste custom JD instead'}
                </button>
              </div>
              {useCustomJD ? (
                <textarea
                  value={customJD}
                  onChange={(e) => setCustomJD(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select a target role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.category})
                    </option>
                  ))}
                </select>
              )}
              {!useCustomJD && targetRoleId && (
                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
                  {(() => {
                    const role = roles.find((r) => r.id === targetRoleId);
                    if (!role) return null;
                    return (
                      <>
                        <p className="text-sm text-slate-600">{role.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {role.required_skills.slice(0, 8).map((skill) => (
                            <span key={skill} className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                              {skill}
                            </span>
                          ))}
                          {role.required_skills.length > 8 && (
                            <span className="text-xs text-slate-400">+{role.required_skills.length - 8} more</span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
