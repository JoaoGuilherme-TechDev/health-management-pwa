
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:lk284102rea@localhost:5432/health_pwa';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    
    console.log("Existing Indexes:");
    res.rows.forEach(row => {
      console.log(`[${row.tablename}] ${row.indexname}: ${row.indexdef}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
