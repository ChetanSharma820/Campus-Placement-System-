import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- Triggers in AUTH schema ---');
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth'
    `);
    console.table(triggers.rows);

    console.log('\n--- Triggers in PUBLIC schema ---');
    const publicTriggers = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_schema = 'public'
    `);
    console.table(publicTriggers.rows);

    console.log('\n--- Existing Users in auth.users ---');
    const users = await client.query(`SELECT email, confirmed_at, last_sign_in_at FROM auth.users`);
    console.table(users.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
