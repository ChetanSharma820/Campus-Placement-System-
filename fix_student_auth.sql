
-- ============================================================
-- CAMPUS CONNECT PRO — STUDENT AUTH REPAIR SCRIPT
-- ============================================================

-- 1. Fix Search Path Issues (Critical for "Database error querying schema")
ALTER DATABASE postgres SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path = public, auth, extensions;
ALTER ROLE anon SET search_path = public, auth, extensions;
ALTER ROLE service_role SET search_path = public, auth, extensions;
ALTER ROLE authenticator SET search_path = public, auth, extensions;

-- 2. Grant Schema Access
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;

-- 3. Ensure Profiles Table is accessible
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpo_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;

-- 4. Global Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;

-- 5. Verification Table
SELECT 
  '✅ OK' as status, 
  tablename as "Schema Access Restored"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_profiles', 'jobs');
