export default {
  testEnvironment: 'node',
  // Partner tests call someone else's live server, so they only run via `npm run test:partner`
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/partner/'],
  globalTeardown: './jest.teardown.js',
  testTimeout: 15000,
};