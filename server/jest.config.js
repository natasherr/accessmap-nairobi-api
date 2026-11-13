export default {
  testEnvironment: 'node',
  // Automatically reset mock state between every test so one test's setup
  // cannot bleed into the next.
  clearMocks: true,
  // Partner tests call someone else's live server, so they only run via `npm run test:partner`
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/partner/'],
  globalTeardown: './jest.teardown.js',
  testTimeout: 15000,
};