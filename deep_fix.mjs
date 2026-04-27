
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function deepFix() {
  try {
    await client.connect();
    console.log('Performing DEEP ROOT CAUSE repair...');

    const queries = [
      // 1. Reset Global Database Settings
      "ALTER DATABASE postgres SET search_path TO public, extensions;",
      
      // 2. Fix Roles (Standard Supabase)
      "ALTER ROLE authenticated SET search_path = public, extensions;",
      "ALTER ROLE anon SET search_path = public, extensions;",
      "ALTER ROLE authenticator SET search_path = public, extensions;",
      
      // 3. Reset Permissions (No more touching 'auth' schema manually)
      "REVOKE ALL ON SCHEMA auth FROM anon, authenticated, authenticator;",
      "GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;",
      "GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;",
      
      // 4. Force Table Visibility
      "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      "GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      
      // 5. Disable RLS for the demo tables
      "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.tpo_profiles DISABLE ROW LEVEL SECURITY;"
    ];

    for (const q of queries) {
      try {
        await client.query(q);
        console.log(`✅ ${q.substring(0, 50)}...`);
      } catch (e) {
        console.warn(`⚠️ ${q.substring(0, 50)}... -> ${e.message}`);
      }
    }

    console.log('🚀 DEEP REPAIR COMPLETE! Please refresh and try login.');
  } catch (err) {
    console.error('❌ Repair failed:', err.message);
  } finally {
    await client.end();
  }
}

deepFix();
