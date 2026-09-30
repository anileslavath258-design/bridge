/*
# ATS Analyses Table

## 1. New Table

### ats_analyses
Stores detailed ATS resume analysis results with sub-scores.
- id (uuid, PK)
- user_id (uuid, FK auth.users, DEFAULT auth.uid())
- role_id (uuid, FK job_roles, nullable)
- job_description (text, pasted JD if custom)
- ats_score (int 0-100, overall)
- keyword_score (int 0-100, keyword match)
- skills_score (int 0-100, skills match)
- formatting_score (int 0-100, formatting checks)
- section_score (int 0-100, resume section completeness)
- matched_keywords (text[])
- missing_keywords (text[])
- matched_skills (text[])
- missing_skills (text[])
- suggestions (text[])
- created_at (timestamptz)

## 2. Security — RLS
Owner-scoped CRUD via auth.uid() = user_id with DEFAULT auth.uid().

## 3. Index
- ats_analyses(user_id) for latest analysis lookup
*/

CREATE TABLE IF NOT EXISTS ats_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES job_roles(id) ON DELETE CASCADE,
  job_description text DEFAULT '',
  ats_score int NOT NULL DEFAULT 0,
  keyword_score int NOT NULL DEFAULT 0,
  skills_score int NOT NULL DEFAULT 0,
  formatting_score int NOT NULL DEFAULT 0,
  section_score int NOT NULL DEFAULT 0,
  matched_keywords text[] DEFAULT '{}',
  missing_keywords text[] DEFAULT '{}',
  matched_skills text[] DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  suggestions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ats_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ats" ON ats_analyses;
CREATE POLICY "select_own_ats" ON ats_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ats" ON ats_analyses;
CREATE POLICY "insert_own_ats" ON ats_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ats" ON ats_analyses;
CREATE POLICY "delete_own_ats" ON ats_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ats_analyses_user_id ON ats_analyses(user_id);