import 'dotenv/config';

// Sends a small mix of requests to the AccessMap API.
// Run from server: node traffic.js
const API_URL = (
  process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');
const API_BASE = `${API_URL}/api`;
const KEY = process.env.API_KEY?.split(',')[0].trim();
const N = Number(process.env.N || 60);

if (!KEY) {
  throw new Error('Set API_KEY in server/.env before running traffic.js');
}

const mix = [
  { method: 'GET', path: '/venues', key: true },
  { method: 'GET', path: '/venues?accessible=maybe', key: true },
  { method: 'GET', path: '/venues/no-such-venue/civic', key: true },
  { method: 'GET', path: '/venues/no-such-venue/civic', key: false },
  { method: 'GET', path: '/not-a-route', key: true },
  { method: 'GET', path: '/partner/rallies', key: true },
];

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const counts = {};
  for (let i = 0; i < N; i++) {
    const route = mix[Math.floor(Math.random() * mix.length)];
    try {
      const response = await fetch(API_BASE + route.path, {
        method: route.method,
        headers: route.key ? { 'am-api-key': KEY } : {},
      });
      counts[response.status] = (counts[response.status] || 0) + 1;
    } catch {
      counts.failed = (counts.failed || 0) + 1;
    }
    await pause(50);
  }
  console.log('\n=== Traffic Summary ===');
  console.table(
    Object.entries(counts).map(([status, requests]) => ({ status, requests }))
  );

  const statsResponse = await fetch(`${API_BASE}/stats`, {
    headers: { 'am-api-key': KEY },
  });
  if (!statsResponse.ok) {
    throw new Error(`Could not read /api/stats (HTTP ${statsResponse.status})`);
  }
  const stats = await statsResponse.json();

  console.log('\n=== API Stats ===');
  console.log(`Total requests: ${stats.total}`);
  console.log(`Client errors (4xx): ${stats.clientErrors}`);
  console.log(`Server errors (5xx): ${stats.serverErrors}`);
  console.log(`Server error rate: ${stats.errorRatePercent}%`);
  console.log(`Average response time: ${stats.avgMs} ms`);

  console.log('\n=== Requests by Route ===');
  console.table(
    Object.entries(stats.routes).map(([route, values]) => ({
      route,
      ...values,
    }))
  );
})();
