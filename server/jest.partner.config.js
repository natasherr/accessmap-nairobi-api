import 'dotenv/config'; // loads PARTNER_API_URL and ALLOW_PARTNER_WRITES from server/.env

export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/partner/**/*.test.js'],
  // Their server may be slow to answer (free hosting wakes up from sleep)
  testTimeout: 30000,
};