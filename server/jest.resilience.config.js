export default {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/resilientFetch.test.js',
    '**/__tests__/partnerResilience.test.js',
    '**/__tests__/monitoring.test.js',
  ],
  testTimeout: 15000,
};
