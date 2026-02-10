
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:lk284102rea@localhost:5432/health_pwa';

async function run() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    await client.query("SET client_encoding TO 'UTF8';");
    const sqlPath = process.argv[2];
    if (!sqlPath) {
      console.error('Please provide a SQL file path');
      process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const res = await client.query(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
