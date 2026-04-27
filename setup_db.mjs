import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envPath = join(__dirname, '.env.local');
const env = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
  });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://mmqfunfadlqytrrzaqbn.supabase.co';
// Priority: Process Environment -> .env.local
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const pgClient = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  if (!SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    console.log('Please set it in your environment or add it to .env.local as SUPABASE_SERVICE_ROLE_KEY=...');
    console.log('You can find this in Supabase Dashboard -> Settings -> API');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    console.log('Connecting to PostgreSQL...');
    await pgClient.connect();

    // 1. Reset database search path to default (Repairing previous ALTER DATABASE)
    console.log('Resetting global search path to default...');
    await pgClient.query(`ALTER DATABASE postgres RESET search_path;`);
    
    // Set search path for current session
    console.log('Setting session search path...');
    await pgClient.query(`SET search_path TO public, auth, extensions;`);

    // 2. Run schema (Fresh tables)
    console.log('Refreshing schema...');
    const sql = readFileSync(join(__dirname, 'supabase_schema.sql'), 'utf-8');
    await pgClient.query(sql);

    // 3. Clean up admin@123.com
    const email = 'admin@123.com';
    console.log(`Cleaning up user: ${email}`);
    
    // Delete from public tables (PG Client)
    await pgClient.query(`DELETE FROM public.tpo_profiles WHERE email = $1`, [email]);
    await pgClient.query(`DELETE FROM public.profiles WHERE email = $1`, [email]);
    
    // Delete from auth tables via SQL as a "Hard Reset" to fix potential corruption
    // This is safe because we are about to recreate it via the Admin API
    // Delete from auth tables via SQL as a "Hard Reset"
    console.log('Performing deep cleanup of auth entries...');
    await pgClient.query(`DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = $1 OR email LIKE '%@gitjaipur.com')`, [email]);
    await pgClient.query(`DELETE FROM auth.users WHERE email = $1 OR email LIKE '%@gitjaipur.com'`, [email]);

    // 4. Create admin user via Admin API
    console.log('Creating Admin user via Supabase Admin API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Admin@pass',
      email_confirm: true,
      user_metadata: { role: 'tpo', name: 'TPO Admin' }
    });

    if (authError) {
      console.error('❌ Auth API Error:', authError.message);
      if (authError.status) console.error('Status:', authError.status);
      throw authError;
    }
    
    const userId = authData.user.id;
    console.log(`✅ User created in auth.users with ID: ${userId}`);

    // 5. Sync to public tables
    console.log('Syncing to public tables...');
    const { error: userError } = await supabase.from('profiles').insert({
      id: userId,
      name: 'TPO Admin',
      email: email,
      role: 'tpo'
    });
    if (userError) throw userError;

    const { error: profileError } = await supabase.from('tpo_profiles').insert({
      user_id: userId,
      name: 'TPO Admin',
      email: email,
      department: 'TPO Office'
    });
    if (profileError) throw profileError;

    console.log('\n🚀 DATABASE FULLY CONFIGURED!');
    console.log('Login Email: admin@123.com (or Admin@123)');
    console.log('Password: Admin@pass');

  } catch (err) {
    console.error('❌ Error during database setup:', err.message);
    if (err.details) console.error('Details:', err.details);
  } finally {
    await pgClient.end();
  }
}

run();

