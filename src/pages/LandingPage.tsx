import { useRouter } from '@/context/RouterContext';
import {
  GraduationCap,
  FileText,
  Target,
  Map,
  TrendingUp,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function LandingPage() {
  const { navigate } = useRouter();

  const features = [
    {
      icon: FileText,
      title: 'Resume Builder & Analyzer',
      description: 'Build your resume section by section and get a live ATS score with actionable suggestions.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Target,
      title: 'Skill Gap Analysis',
      description: 'See exactly which skills you have, which you partially know, and which you still need for your target role.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Map,
      title: 'Personalized Learning Roadmap',
      description: 'Get a step-by-step plan with curated resources and timelines for every missing skill.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Watch your ATS score improve over time with visual graphs and milestone tracking.',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      icon: Briefcase,
      title: 'Job Recommendations',
      description: 'Discover roles matched to your profile with match percentages and key skill gaps highlighted.',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: ShieldCheck,
      title: 'Fair & Transparent Hiring',
      description: 'Recruiters see anonymized skill-based profiles — your abilities matter more than your college name.',
      color: 'bg-teal-50 text-teal-600',
    },
  ];

  const stats = [
    { value: '10+', label: 'Job Role Templates' },
    { value: '50+', label: 'Curated Resources' },
    { value: '100%', label: 'Free for Students' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">CareerBridge</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white" />
        <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute left-1/4 top-40 -z-10 h-[300px] w-[300px] rounded-full bg-emerald-100/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              Prepare smarter, not harder
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Prepare for your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                dream job
              </span>{' '}
              from day one
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Build a recruiter-ready resume, discover your skill gaps, and follow a personalized learning
              roadmap — all in one place. No guesswork, just progress.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/signup')}
                className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                I have an account
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to land your first job
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From resume to roadmap — a complete toolkit built for students, by people who've been there.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to job-ready
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Set your target role', desc: 'Pick from 10+ predefined roles or paste a job description. We\'ll extract the required skills instantly.' },
              { step: '02', title: 'Build & analyze', desc: 'Create your resume in the builder. Our ATS analyzer scores it against your target role in real time.' },
              { step: '03', title: 'Learn & improve', desc: 'Follow your personalized roadmap, mark skills as complete, and watch your ATS score climb.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-bold text-blue-100">{item.step}</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-16 text-center shadow-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start your journey today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Join thousands of students who are preparing smarter and landing their dream roles.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
              >
                Create your free account
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4 text-sm text-blue-100">
                {['No credit card needed', 'Free forever', ' Takes 2 minutes'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">CareerBridge</span>
          </div>
          <p className="text-sm text-slate-500">Built for students, powered by data-driven insights.</p>
        </div>
      </footer>
    </div>
  );
}
