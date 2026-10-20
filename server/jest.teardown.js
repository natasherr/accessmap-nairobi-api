// Jest globalTeardown — runs once after ALL test suites have finished.
// Ends the shared pg Pool so the process can exit cleanly.
import pool from './db.js';

export default async function teardown() {
  await pool.end();
}
