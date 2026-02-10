// @ts-ignore
import { Pool, PoolConfig, PoolClient } from 'pg';

// Configuration should come from environment variables
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/health_pwa',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a singleton pool instance
export const pool = new Pool(poolConfig);

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Helper to get a client from the pool (for transactions)
export async function getClient() {
  const client = await pool.connect() as PoolClient & { lastQuery?: any[] };
  const query = client.query;
  const release = client.release;
  
  // Monkey patch query to log
  // @ts-ignore
  client.query = (...args) => {
    client.lastQuery = args;
    // @ts-ignore
    return query.apply(client, args);
  };

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${JSON.stringify(client.lastQuery)}`);
  }, 5000);

  const releaseChecker = (err?: any) => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release(err);
  };

  client.release = releaseChecker;
  return client;
}
