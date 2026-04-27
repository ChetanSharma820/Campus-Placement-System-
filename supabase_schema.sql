-- ============================================================
-- CAMPUS CONNECT PRO — CLEAN DATABASE SCHEMA
-- DESTRUCTIVE: Drops and recreates everything from scratch
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix search path issues for Supabase roles (Standard Supabase Setup)
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;
-- Note: auth schema usage is managed internally by Supabase

-- ============================================================
-- STEP 1: DROP EXISTING TABLES (order matters for foreign keys)
-- ============================================================
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.academic_config CASCADE;
DROP TABLE IF EXISTS public.tpo_profiles CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.create_student_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.create_student_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_student_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- 1. Core Profiles Table (maps to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tpo', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student Profiles
CREATE TABLE public.student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  department TEXT,
  academic_year TEXT,
  section TEXT,
  cgpa NUMERIC(4,2) DEFAULT 0.0,
  phone TEXT,
  bio TEXT,
  profile_photo TEXT,
  banner_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  gender TEXT,
  placement_status TEXT DEFAULT 'Unplaced' CHECK (placement_status IN ('Placed', 'Unplaced', 'Debarred')),
  placed_package TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  experiences JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  semester_wise_sgpa JSONB DEFAULT '{}'::jsonb,
  tenth_percentage NUMERIC(5,2) DEFAULT 0.0,
  twelfth_percentage NUMERIC(5,2) DEFAULT 0.0,
  total_backlogs INT DEFAULT 0,
  active_backlogs INT DEFAULT 0,
  current_year TEXT,
  resume_url TEXT,
  password_changed BOOLEAN DEFAULT FALSE,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TPO Profiles
CREATE TABLE public.tpo_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Academic Config (Years & Sections)
CREATE TABLE public.academic_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year TEXT NOT NULL UNIQUE,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Companies
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Jobs / Placement Drives
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  roles JSONB DEFAULT '[]'::jsonb,
  domain TEXT,
  package TEXT,
  location TEXT,
  deadline DATE,
  logo TEXT,
  description TEXT,
  full_description TEXT,
  min_cgpa NUMERIC(4,2) DEFAULT 0.0,
  max_backlogs INT DEFAULT 0,
  allowed_branches JSONB DEFAULT '[]'::jsonb,
  is_visible BOOLEAN DEFAULT TRUE,
  hr_name TEXT,
  hr_email TEXT,
  hr_contact TEXT,
  company_address TEXT,
  status TEXT DEFAULT 'active',
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Applications (Placement Actions)
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  student_section TEXT,
  student_year TEXT,
  student_branch TEXT,
  student_cgpa NUMERIC(4,2),
  status TEXT DEFAULT 'Applied',
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  interview_date TIMESTAMPTZ,
  hiring_reason TEXT,
  cover_letter TEXT,
  custom_answers JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

-- 8. Announcements
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('job', 'drive', 'company', 'placement', 'general')),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  author TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: SECURITY CONFIGURATION
-- ============================================================

-- Disable RLS for rapid development/demonstration
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpo_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role;

-- ============================================================
-- STEP 4: REALTIME (safe, checks before adding)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'student_profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'jobs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'announcements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END $$;

-- ============================================================
-- STEP 5: RPC — CREATE STUDENT ACCOUNT
-- Auto-generates email: rollnumber@gitjaipur.com
-- Auto-generates password: first4chars@joinYear
-- Example: "Shubham Sharma", "2022-2026" => password: shub@2022
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_student_account(
  p_roll_number TEXT,
  p_name TEXT,
  p_email TEXT,
  p_department TEXT,
  p_academic_year TEXT,
  p_section TEXT,
  p_cgpa NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_generated_email TEXT;
  v_generated_password TEXT;
BEGIN
  v_generated_email := LOWER(TRIM(p_roll_number)) || '@gitjaipur.com';
  v_generated_password := LOWER(SUBSTRING(TRIM(p_name) FROM 1 FOR 4))
                          || '@'
                          || SUBSTRING(TRIM(p_academic_year) FROM 1 FOR 4);

  -- 1. Check for existing user by roll number in profiles
  SELECT user_id INTO v_user_id FROM public.student_profiles WHERE roll_number = p_roll_number;

  -- 2. If not found in profiles, check for existing user by email in auth.users
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_generated_email;
  END IF;

  -- 3. If STILL not found, create the auth.users record
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_generated_email, crypt(v_generated_password, gen_salt('bf', 10)),
      NOW(), NOW(), NOW(),
      jsonb_build_object('role','student','name',p_name,'roll_number',p_roll_number,'academic_year',p_academic_year),
      '{"provider":"email","providers":["email"]}'::jsonb, false, false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, 
      jsonb_build_object('sub', v_user_id::text, 'email', v_generated_email),
      'email', v_generated_email, NULL, NOW(), NOW()
    );
  END IF;

  -- 4. Upsert into public.users
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (v_user_id, p_name, v_generated_email, 'student')
  ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email;

  -- 5. Upsert into public.student_profiles
  INSERT INTO public.student_profiles (
    user_id, name, email, roll_number, department, academic_year, section, cgpa
  ) VALUES (
    v_user_id, p_name, v_generated_email,
    p_roll_number, p_department, p_academic_year, p_section, p_cgpa
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    academic_year = EXCLUDED.academic_year,
    section = EXCLUDED.section,
    cgpa = EXCLUDED.cgpa;

  RETURN v_user_id;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create/update student %: %', p_roll_number, SQLERRM;
END;
$$;

-- ============================================================
-- STEP 4: PERMISSIONS
-- ============================================================

-- Ensure the API roles can access the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to all tables for authenticated users (TPOs and Students)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execution on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated, anon;

-- ============================================================
-- DONE! All tables created fresh.
-- NEXT STEPS:
-- 1. Go to Authentication > Users > Add User
--    Email: admin@123.com | Password: Admin@pass | Auto-confirm ON
-- 2. Run the admin metadata SQL (provided separately)
-- ============================================================
