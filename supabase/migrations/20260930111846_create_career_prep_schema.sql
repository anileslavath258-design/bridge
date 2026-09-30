/*
# Career Prep Platform — Core Schema

Creates the full database backbone for a student career-preparation platform:
student profiles, predefined job roles, resumes, skill-gap analysis,
learning roadmaps, and ATS score history.

## 1. New Tables

### job_roles
Predefined roles with JDs and required skills. Read-only for students; seeded by admin.
- id (uuid, PK)
- title (text)
- description (text, JD)
- required_skills (text[], list of skill names)
- category (text, e.g. "Software", "Data", "Core")
- created_at (timestamptz)

### profiles
Stores student-specific data linked to auth.users.
- id (uuid, PK, references auth.users)
- full_name (text)
- college (text)
- branch (text)
- year (int, graduation year)
- interests (text[])
- target_role_id (uuid, FK to job_roles)
- created_at, updated_at (timestamptz)

### resumes
Structured resume data per user. One active resume per user.
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- education (jsonb)
- skills (text[])
- projects (jsonb)
- internships (jsonb)
- achievements (jsonb)
- raw_text (text)
- created_at, updated_at (timestamptz)

### skill_analyses
Result of comparing user's resume skills to a target role's required skills.
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- role_id (uuid, FK job_roles)
- matched_skills, partial_skills, missing_skills (text[])
- ats_score (int 0-100)
- suggestions (text[])
- created_at (timestamptz)

### roadmaps
Learning plan generated from missing skills.
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- role_id (uuid, FK job_roles)
- steps (jsonb array of {id, skill, description, resource_name, resource_url, duration_weeks, completed})
- created_at, updated_at (timestamptz)

### score_history
Tracks ATS score over time for the progress graph.
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- score (int)
- label (text)
- created_at (timestamptz)

## 2. Security — RLS
All tables have RLS enabled. profiles uses auth.uid() = id.
User-owned tables use auth.uid() = user_id with DEFAULT auth.uid().
job_roles is readable by all authenticated users.

## 3. Indexes
- resumes(user_id), skill_analyses(user_id), roadmaps(user_id), score_history(user_id, created_at)
*/

-- Job roles (predefined reference data) — must exist before profiles FK
CREATE TABLE IF NOT EXISTS job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  required_skills text[] DEFAULT '{}',
  category text DEFAULT 'Software',
  created_at timestamptz DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  college text DEFAULT '',
  branch text DEFAULT '',
  year int,
  interests text[] DEFAULT '{}',
  target_role_id uuid REFERENCES job_roles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  education jsonb DEFAULT '[]'::jsonb,
  skills text[] DEFAULT '{}',
  projects jsonb DEFAULT '[]'::jsonb,
  internships jsonb DEFAULT '[]'::jsonb,
  achievements jsonb DEFAULT '[]'::jsonb,
  raw_text text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Skill gap analyses
CREATE TABLE IF NOT EXISTS skill_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES job_roles(id) ON DELETE CASCADE,
  matched_skills text[] DEFAULT '{}',
  partial_skills text[] DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  ats_score int DEFAULT 0,
  suggestions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES job_roles(id) ON DELETE CASCADE,
  steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Score history
CREATE TABLE IF NOT EXISTS score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/insert/update own profile
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Job roles: readable by all authenticated users
DROP POLICY IF EXISTS "select_job_roles" ON job_roles;
CREATE POLICY "select_job_roles" ON job_roles FOR SELECT
  TO authenticated USING (true);

-- Resumes: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Skill analyses: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_analyses" ON skill_analyses;
CREATE POLICY "select_own_analyses" ON skill_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON skill_analyses;
CREATE POLICY "insert_own_analyses" ON skill_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON skill_analyses;
CREATE POLICY "update_own_analyses" ON skill_analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON skill_analyses;
CREATE POLICY "delete_own_analyses" ON skill_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Roadmaps: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_roadmaps" ON roadmaps;
CREATE POLICY "select_own_roadmaps" ON roadmaps FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_roadmaps" ON roadmaps;
CREATE POLICY "insert_own_roadmaps" ON roadmaps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_roadmaps" ON roadmaps;
CREATE POLICY "update_own_roadmaps" ON roadmaps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_roadmaps" ON roadmaps;
CREATE POLICY "delete_own_roadmaps" ON roadmaps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Score history: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_scores" ON score_history;
CREATE POLICY "select_own_scores" ON score_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scores" ON score_history;
CREATE POLICY "insert_own_scores" ON score_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scores" ON score_history;
CREATE POLICY "delete_own_scores" ON score_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_analyses_user_id ON skill_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON score_history(user_id, created_at);