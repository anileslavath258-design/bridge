import { useState, type FormEvent } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export function AuthPage({ mode }: { mode: 'signup' | 'login' }) {
  const { signUp, signIn } = useAuth();
  const { navigate } = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignup) {
      if (!fullName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, fullName.trim());
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/profile-setup');
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left panel — branding */}
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white lg:flex">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">CareerBridge</span>
            </button>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold leading-tight">
              {isSignup
                ? 'Your dream career starts here'
                : 'Welcome back to your journey'}
            </h2>
            <p className="mt-4 max-w-md text-blue-100">
              {isSignup
                ? 'Build a recruiter-ready resume, discover skill gaps, and follow a personalized roadmap to your target role.'
                : 'Pick up where you left off — check your ATS score, continue your learning path, and track your progress.'}
            </p>
            <div className="mt-8 space-y-3">
              {['ATS-scored resume building', 'Skill gap analysis with 10+ roles', 'Personalized learning roadmaps'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-blue-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-sm text-blue-200">Trusted by students preparing for their first job</p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">CareerBridge</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isSignup ? 'Create your account' : 'Log in to continue'}
            </h1>
            <p className="mt-2 text-slate-600">
              {isSignup ? 'Start preparing for your dream job today' : 'Welcome back — let\'s keep building'}
            </p>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isSignup && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create Account'
                    : 'Log In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="font-semibold text-blue-600 hover:text-blue-700">
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/signup')} className="font-semibold text-blue-600 hover:text-blue-700">
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
