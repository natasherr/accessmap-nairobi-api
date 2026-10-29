import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Jest tests create records. Refuse to let them use the normal application
// database so test fixtures cannot leak into the venue directory.
const isTestProcess = process.env.NODE_ENV === 'test';
const databaseUrl = isTestProcess
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (isTestProcess && !databaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required for tests. Use a separate seeded test database; refusing to use DATABASE_URL.'
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for remote hosted DBs like Supabase
  }
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Successfully connected to Supabase PostgreSQL at:', res.rows[0].now);
  }
});
export default pool;
