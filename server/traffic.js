import 'dotenv/config';

// Sends a small mix of requests to the AccessMap API.
// Run from server: node traffic.js
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const KEY = process.env.API_KEY?.split(',')[0].trim();
const N = Number(process.env.N || 60);

if (!KEY) {
  throw new Error('Set API_KEY in server/.env before running traffic.js');
}

const mix = [
  { method: 'GET', path: '/api/venues', key: true },
  { method: 'GET', path: '/api/venues?accessible=maybe', key: true },
  { method: 'GET', path: '/api/venues/no-such-venue/civic', key: true },
  { method: 'GET', path: '/api/venues/no-such-venue/civic', key: false },
  { method: 'GET', path: '/api/not-a-route', key: true },
  { method: 'GET', path: '/api/partner/rallies', key: true },
];

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const counts = {};
  for (let i = 0; i < N; i++) {
    const route = mix[Math.floor(Math.random() * mix.length)];
    try {
      const response = await fetch(API + route.path, {
        method: route.method,
        headers: route.key ? { 'am-api-key': KEY } : {},
      });
      counts[response.status] = (counts[response.status] || 0) + 1;
    } catch {
      counts.failed = (counts.failed || 0) + 1;
    }
    await pause(50);
  }
  console.log('Status codes received:', counts);

  const statsResponse = await fetch(`${API}/api/stats`, {
    headers: { 'am-api-key': KEY },
  });
  if (!statsResponse.ok) {
    throw new Error(`Could not read /api/stats (HTTP ${statsResponse.status})`);
  }
  console.log('API stats:', await statsResponse.json());
})();
