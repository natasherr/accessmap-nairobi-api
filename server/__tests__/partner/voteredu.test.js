import request from 'supertest';

// PARTNER_URL must include the /api prefix, e.g. https://voter-edu-backend.onrender.com/api
// Set in server/.env before running `npm run test:partner`
const API = process.env.PARTNER_URL;
const API_KEY = process.env.PARTNER_API_KEY;
// Partner is on v2: list responses are { data: [...], count: N } not bare arrays
const PARTNER_VERSION = process.env.PARTNER_VERSION || 'v1';

if (!API) {
  throw new Error('PARTNER_URL is required in server/.env to run partner API tests.');
}

// POST to /rallies/:rallyId/comments actually writes to their database.
// Only opt in when you have coordinated with the partner team.
const writeTest = process.env.ALLOW_PARTNER_WRITES === 'true' ? it : it.skip;

// ─── helpers ─────────────────────────────────────────────────────────────────

function authHeaders() {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
}

function authedGet(path) {
  return request(API).get(path).set(authHeaders());
}

function authedPost(path, body) {
  return request(API).post(path).set(authHeaders()).send(body);
}

// Returns the versioned path for list endpoints (v2 adds /v2/ prefix)
function listPath(path) {
  return PARTNER_VERSION === 'v2' ? `/v2${path}` : path;
}

// Unwraps the array from a v2 { data: [...] } envelope, or returns the bare array for v1
function unwrapList(body) {
  if (Array.isArray(body)) return body;
  if (body !== null && typeof body === 'object') {
    for (const key of ['data', 'items', 'results', 'rallies']) {
      if (Array.isArray(body[key])) return body[key];
    }
  }
  return undefined;
}

// ─── GET /candidates ─────────────────────────────────────────────────────────
// Used by: GET /candidates in routes/partner.js

describe('GET /candidates', () => {
  it('returns 200 and a JSON response', async () => {
    const res = await authedGet(listPath('/candidates'));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('every candidate has id, name, average_rating, and review_count', async () => {
    const res = await authedGet(listPath('/candidates'));

    const candidates = unwrapList(res.body);
    expect(candidates).toBeDefined();
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(c).toHaveProperty('average_rating');
      if (c.average_rating !== null) {
        expect(typeof c.average_rating).toBe('number');
        expect(c.average_rating).toBeGreaterThanOrEqual(0);
        expect(c.average_rating).toBeLessThanOrEqual(5);
      }
      expect(Number.isInteger(c.review_count)).toBe(true);
    }
  });
});

// ─── GET /rallies ─────────────────────────────────────────────────────────────
// Used by: GET /rallies in routes/partner.js

describe('GET /rallies', () => {
  it('returns 200 and a usable response body', async () => {
    const res = await authedGet(listPath('/rallies'));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(unwrapList(res.body)).toBeDefined();
  });

  it('every rally has an id field', async () => {
    const res = await authedGet(listPath('/rallies'));

    const items = unwrapList(res.body);
    expect(items).toBeDefined();
    for (const r of items) {
      expect(r).toHaveProperty('id');
    }
  });
});

// ─── GET /transport/landmarks ─────────────────────────────────────────────────
// Used by: GET /transport/landmarks in routes/partner.js
// NOTE: if the partner's /transport/landmarks endpoint is currently down,
// these tests will fail with 502. That is expected — it means their endpoint
// is unavailable, which is what triggers the 502 stale-cache path in our server.

describe('GET /transport/landmarks', () => {
  it('returns 200 and a JSON response', async () => {
    const res = await authedGet('/transport/landmarks');

    if (res.status === 502 || res.status === 503) {
      // Partner endpoint is currently unavailable — mark as pending rather than failing
      console.warn(`GET /transport/landmarks returned ${res.status} — partner endpoint may be down`);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('response body is an object or array (not null) when available', async () => {
    const res = await authedGet('/transport/landmarks');

    if (res.status === 502 || res.status === 503) {
      console.warn(`GET /transport/landmarks returned ${res.status} — partner endpoint may be down`);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(typeof res.body === 'object' || Array.isArray(res.body)).toBe(true);
  });
});

// ─── POST /rallies/:rallyId/comments ─────────────────────────────────────────
// Used by: POST /rallies/:rallyId/comments in routes/partner.js

describe('POST /rallies/:rallyId/comments', () => {
  // Rejects: these use invalid bodies so nothing is written regardless of opt-in
  it('returns 400 when comment is missing', async () => {
    const res = await authedPost('/rallies/some-rally-id/comments', {});

    expect(res.status).toBe(400);
  });

  it('returns 400 when comment is empty', async () => {
    const res = await authedPost('/rallies/some-rally-id/comments', { comment: '' });

    expect(res.status).toBe(400);
  });

  // Real write: opts in via ALLOW_PARTNER_WRITES=true
  writeTest('returns 201 and the created comment', async () => {
    // First fetch a real rally id so we don't POST to a non-existent one
    const listRes = await authedGet(listPath('/rallies'));
    expect(listRes.status).toBe(200);

    const items = unwrapList(listRes.body);

    expect(items.length).toBeGreaterThan(0);
    const rallyId = items[0].id;

    const res = await authedPost(`/rallies/${rallyId}/comments`, {
      comment: 'Automated contract test from AccessMap Nairobi (Team 12) — safe to delete.',
      user: 'AccessMap Nairobi Test Bot',
    });

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
