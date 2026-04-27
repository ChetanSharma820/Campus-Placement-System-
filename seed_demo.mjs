
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Chetan%40820%23@db.mmqfunfadlqytrrzaqbn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    await client.connect();
    console.log('Seeding demonstration data...');

    // 1. Seed Companies
    const companies = [
      ['Google', 'google.com', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'],
      ['Microsoft', 'microsoft.com', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg'],
      ['Amazon', 'amazon.com', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'],
      ['Meta', 'meta.com', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'],
      ['Netflix', 'netflix.com', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg']
    ];

    for (const [name, domain, logo] of companies) {
      await client.query(
        'INSERT INTO public.companies (name, domain, logo) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [name, domain, logo]
      );
    }

    // 2. Seed Jobs (Drives)
    const jobs = [
      ['Google', 'Associate Software Engineer', '18.5 LPA', 'active', '2024-12-30', 'Sundar Pichai', 'hr@google.com'],
      ['Microsoft', 'SDE-1 (Azure)', '16.2 LPA', 'active', '2024-11-15', 'Satya Nadella', 'jobs@microsoft.com'],
      ['Amazon', 'Cloud Support Associate', '12.0 LPA', 'active', '2025-01-10', 'Andy Jassy', 'hiring@amazon.com'],
      ['Netflix', 'Senior UI Engineer', '45.0 LPA', 'active', '2024-10-05', 'Reed Hastings', 'talent@netflix.com'],
      ['Meta', 'Product Manager', '22.0 LPA', 'active', '2024-09-20', 'Mark Zuckerberg', 'pm@meta.com'],
      // Old Drives (Past Deadlines)
      ['Google', 'Summer Intern 2023', '80k/mo', 'completed', '2023-05-01', 'HR Team', 'interns@google.com'],
      ['Microsoft', 'Engage 2023', 'Mentorship', 'completed', '2023-06-15', 'University Relations', 'engage@microsoft.com']
    ];

    for (const [comp, role, pkg, status, deadline, hr, email] of jobs) {
      await client.query(
        `INSERT INTO public.jobs (
          company_name, role, package, status, deadline, hr_name, hr_email, 
          roles, allowed_branches, is_visible
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        ON CONFLICT DO NOTHING`,
        [comp, role, pkg, status, deadline, hr, email, JSON.stringify([role]), JSON.stringify(['All']), true]
      );
    }

    console.log('✅ Demonstration data seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await client.end();
  }
}

seed();
