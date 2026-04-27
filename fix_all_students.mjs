// ============================================================
// CAMPUS CONNECT PRO — FIX ALL STUDENT AUTH RECORDS
// Uses Supabase Admin API — bypasses broken SQL RPC entirely
//
// HOW TO RUN:
//   node fix_all_students.mjs
//
// REQUIREMENTS:
//   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file
//   (Supabase Dashboard → Settings → API → service_role key)
// ============================================================

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────
const envPath = join(__dirname, '.env.local');
const env = {};
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && val) env[key] = val;
    }
  });
}

const SUPABASE_URL      = env.VITE_SUPABASE_URL      || 'https://mmqfunfadlqytrrzaqbn.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const PG_CONN           = 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres';

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('    Add it to .env.local:  SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.error('    Find it at: Supabase Dashboard → Settings → API → service_role\n');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────

/** Generate login email from roll number */
const toEmail = (roll) => `${roll.trim().toLowerCase()}@gitjaipur.com`;

/** Generate default password: first4(name) + @ + year */
const toPassword = (name, academicYear) => {
  const first4 = name.trim().toLowerCase().slice(0, 4);
  const year   = academicYear.trim().slice(0, 4);
  return `${first4}@${year}`;
};

// ── Main ─────────────────────────────────────────────────────

const pgClient = new Client({ connectionString: PG_CONN, ssl: { rejectUnauthorized: false } });
const supabase  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log('\n🔧  Campus Connect Pro — Student Auth Fixer');
  console.log('='.repeat(50));

  await pgClient.connect();
  console.log('✅  Connected to PostgreSQL\n');

  // 1. Load all students from student_profiles
  const { rows: students } = await pgClient.query(`
    SELECT sp.user_id, sp.name, sp.email, sp.roll_number, sp.department,
           sp.academic_year, sp.section, sp.cgpa
    FROM public.student_profiles sp
    ORDER BY sp.created_at ASC
  `);

  if (students.length === 0) {
    console.log('⚠️   No students found in student_profiles. Add students via TPO dashboard first,');
    console.log('    then re-run this script. (Their public records will already be there.)\n');
    await pgClient.end();
    return;
  }

  console.log(`📋  Found ${students.length} student(s) to process:\n`);

  let fixed = 0, skipped = 0, failed = 0;

  for (const s of students) {
    const email    = toEmail(s.roll_number);
    const password = toPassword(s.name, s.academic_year || '2022');
    const label    = `${s.name} (${s.roll_number})`;

    process.stdout.write(`   Processing ${label} ... `);

    try {
      // ── Step A: Wipe any broken auth record for this email ──
      // Get the ID first
      const { rows: existingUser } = await pgClient.query('SELECT id FROM auth.users WHERE email = $1', [email]);
      
      if (existingUser.length > 0) {
        const v_id = existingUser[0].id;
        await pgClient.query('DELETE FROM auth.identities WHERE user_id = $1', [v_id]);
        await pgClient.query('DELETE FROM auth.sessions WHERE user_id = $1', [v_id]);
        await pgClient.query('DELETE FROM auth.refresh_tokens WHERE user_id = $1', [v_id]);
        await pgClient.query('DELETE FROM auth.users WHERE id = $1', [v_id]);
      }

      // ── Step B: Create via Admin API (guaranteed correct) ──
      const { data, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role:          'student',
          name:          s.name,
          roll_number:   s.roll_number,
          academic_year: s.academic_year || '',
          department:    s.department    || '',
        }
      });

      if (createErr) throw new Error(createErr.message);
      const newId = data.user.id;

      // ── Step C: Sync public.profiles to new auth ID ──
      // (student_profiles already has the old user_id — update it)
      await pgClient.query(`
        INSERT INTO public.profiles (id, name, email, role)
        VALUES ($1, $2, $3, 'student')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
      `, [newId, s.name, email]);

      // Update student_profiles to point to the new auth UUID
      await pgClient.query(`
        UPDATE public.student_profiles
        SET user_id = $1
        WHERE roll_number = $2;
      `, [newId, s.roll_number]);

      // Remove the stale old profile row (old UUID, now orphaned)
      if (s.user_id !== newId) {
        await pgClient.query(`
          DELETE FROM public.profiles WHERE id = $1;
        `, [s.user_id]);
      }

      console.log(`✅  FIXED  →  ${email}  /  ${password}`);
      fixed++;

    } catch (err) {
      console.log(`❌  FAILED  →  ${err.message}`);
      failed++;
    }
  }

  // ── Summary ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log(`✅  Fixed:   ${fixed}`);
  if (skipped) console.log(`⏭️   Skipped: ${skipped}`);
  if (failed)  console.log(`❌  Failed:  ${failed}`);
  console.log('='.repeat(50));

  if (fixed > 0) {
    console.log('\n🎉  All students can now log in!');
    console.log('    Roll Number  →  Password formula:');
    console.log('    first 4 letters of name (lowercase) + @ + joining year');
    console.log('    Example: "Diva Mittal" joined 2022  →  diva@2022\n');
  }

  await pgClient.end();
}

run().catch(async (err) => {
  console.error('\n❌  Unexpected error:', err.message);
  await pgClient.end().catch(() => {});
  process.exit(1);
});
