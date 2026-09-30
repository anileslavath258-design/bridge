import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  full_name: string;
  college: string;
  branch: string;
  year: number | null;
  interests: string[];
  target_role_id: string | null;
  created_at: string;
  updated_at: string;
};

export type JobRole = {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  category: string;
  created_at: string;
};

export type EducationEntry = {
  degree: string;
  institution: string;
  year: string;
  cgpa: string;
};

export type ProjectEntry = {
  title: string;
  description: string;
  technologies: string;
  link: string;
};

export type InternshipEntry = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

export type Resume = {
  id: string;
  user_id: string;
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  internships: InternshipEntry[];
  achievements: string[];
  raw_text: string;
  created_at: string;
  updated_at: string;
};

export type SkillAnalysis = {
  id: string;
  user_id: string;
  role_id: string;
  matched_skills: string[];
  partial_skills: string[];
  missing_skills: string[];
  ats_score: number;
  suggestions: string[];
  created_at: string;
};

export type RoadmapStep = {
  id: string;
  skill: string;
  description: string;
  resource_name: string;
  resource_url: string;
  duration_weeks: number;
  completed: boolean;
};

export type Roadmap = {
  id: string;
  user_id: string;
  role_id: string;
  steps: RoadmapStep[];
  created_at: string;
  updated_at: string;
};

export type ScoreEntry = {
  id: string;
  user_id: string;
  score: number;
  label: string;
  created_at: string;
};
