
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runSteps() {
  try {
    await client.connect();
    
    // STEP 1
    console.log('\n--- STEP 1: CURRENT STATE ---');
    const step1 = await client.query(`
      SELECT 
        u.id, u.email, u.created_at,
        CASE WHEN i.id IS NOT NULL THEN '✅ has identity' ELSE '❌ NO identity' END as identity
      FROM auth.users u
      LEFT JOIN auth.identities i ON i.user_id = u.id
      WHERE u.email = 'git2022119@gitjaipur.com'
    `);
    console.table(step1.rows);

    // STEP 2
    console.log('\n--- STEP 2: FORCE WIPE ---');
    await client.query(`
      DO $$
      DECLARE v_id UUID;
      BEGIN
        SELECT id INTO v_id FROM auth.users WHERE email = 'git2022119@gitjaipur.com';
        
        IF v_id IS NOT NULL THEN
          DELETE FROM auth.identities     WHERE user_id::text = v_id::text;
          DELETE FROM auth.sessions       WHERE user_id::text = v_id::text;
          DELETE FROM auth.refresh_tokens WHERE user_id::text = v_id::text;
          DELETE FROM public.student_profiles WHERE user_id::text = v_id::text;
          DELETE FROM public.profiles         WHERE id::text = v_id::text;
          DELETE FROM auth.users              WHERE id::text = v_id::text;
          RAISE NOTICE 'Fully deleted: %', v_id;
        END IF;
      END $$;
    `);
    console.log('✅ Wipe complete.');

    // STEP 3
    console.log('\n--- STEP 3: VERIFICATION ---');
    const step3 = await client.query("SELECT COUNT(*) as should_be_zero FROM auth.users WHERE email = 'git2022119@gitjaipur.com'");
    console.table(step3.rows);

  } catch (err) {
    console.error('❌ Operation failed:', err.message);
  } finally {
    await client.end();
  }
}

runSteps();
