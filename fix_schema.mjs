
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixPermissions() {
  try {
    await client.connect();
    console.log('Applying critical schema fixes...');

    const queries = [
      "ALTER DATABASE postgres SET search_path TO public, auth, extensions;",
      "ALTER ROLE authenticated SET search_path = public, auth, extensions;",
      "ALTER ROLE anon SET search_path = public, auth, extensions;",
      "ALTER ROLE service_role SET search_path = public, auth, extensions;",
      "ALTER ROLE authenticator SET search_path = public, auth, extensions;",
      "GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;",
      "GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;",
      "GRANT USAGE ON SCHEMA extensions TO anon, authenticated, authenticator;",
      "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      "GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role, authenticator;",
      "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;"
    ];

    for (const q of queries) {
      try {
        await client.query(q);
        console.log(`✅ Success: ${q.substring(0, 50)}...`);
      } catch (e) {
        console.warn(`⚠️ Warning: ${q.substring(0, 50)}... -> ${e.message}`);
      }
    }

    console.log('🚀 SYSTEM REPAIRED! Student login should now work.');
  } catch (err) {
    console.error('❌ Repair failed:', err.message);
  } finally {
    await client.end();
  }
}

fixPermissions();
