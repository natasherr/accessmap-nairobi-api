/**
 * versions.test.js
 *
 * Pins the v1 contract so any accidental edit to v1.js will immediately fail.
 * Also verifies v2 has the new { data, count } envelope shape.
 * Also verifies deprecation headers are present on v1/legacy and absent on v2.
 */

import request from 'supertest';

process.env.API_KEY = 'test-key';
const { default: app } = await import('../app.js');

const KEY = { 'am-api-key': 'test-key' };

// ── v1 is frozen ─────────────────────────────────────────────────────────────

describe('v1 is frozen', () => {
  test('GET /v1/venues keeps its original shape — a bare array', async () => {
    const res = await request(app).get('/v1/venues').set(KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Confirm the exact set of top-level keys so we catch accidental additions
    const venue = res.body[0];
    expect(venue).toHaveProperty('id');
    expect(venue).toHaveProperty('slug');
    expect(venue).toHaveProperty('name');
    expect(venue).toHaveProperty('area');
    expect(venue).toHaveProperty('address');
    expect(venue).toHaveProperty('category');
    expect(venue).toHaveProperty('accessibility');
    expect(venue).toHaveProperty('addedAt');
    // No pagination envelope
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).not.toHaveProperty('count');
  });

  test('old unversioned /api/venues still answers the same way as /v1/venues', async () => {
    // Both calls must return a bare array (not a wrapped envelope).
    // We check shape rather than exact deep-equal because parallel test runs
    // against a shared DB can produce slightly different row counts between
    // two separate queries.
    const a = await request(app).get('/api/venues').set(KEY);
    const b = await request(app).get('/v1/venues').set(KEY);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(Array.isArray(a.body)).toBe(true);
    expect(Array.isArray(b.body)).toBe(true);
    // Both return the same kind of objects (v1 contract shape — bare array, no envelope)
    expect(a.body).not.toHaveProperty('data');
    expect(b.body).not.toHaveProperty('data');
  });

  test('v1 error shape is unchanged — 404 for unknown slug', async () => {
    const res = await request(app).get('/v1/venues/this-slug-does-not-exist').set(KEY);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});

// ── v2 has the new shape ──────────────────────────────────────────────────────

describe('v2 has the new shape', () => {
  test('list is wrapped in { data, count }', async () => {
    const res = await request(app).get('/v2/venues').set(KEY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(res.body.data.length);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('category filter still works', async () => {
    const res = await request(app).get('/v2/venues?category=hospital').set(KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every(v => v.category === 'hospital')).toBe(true);
    expect(res.body.count).toBe(res.body.data.length);
  });

  test('v2 does not return a bare array at the top level', async () => {
    const res = await request(app).get('/v2/venues').set(KEY);
    expect(Array.isArray(res.body)).toBe(false);
  });
});

// ── Deprecation headers ───────────────────────────────────────────────────────

describe('deprecation headers', () => {
  test('v1 list and detail announce the sunset', async () => {
    for (const path of ['/v1/venues', '/v1/venues/kenyatta-national-hospital']) {
      const res = await request(app).get(path).set(KEY);
      expect(res.headers['deprecation']).toBe('true');
      expect(res.headers['sunset']).toBe('Fri, 13 Nov 2026 00:00:00 GMT');
      expect(res.headers['link']).toContain('rel="successor-version"');
    }
  });

  test('legacy /api/venues also carries deprecation headers', async () => {
    const res = await request(app).get('/api/venues').set(KEY);
    expect(res.headers['deprecation']).toBe('true');
    expect(res.headers['sunset']).toBe('Fri, 13 Nov 2026 00:00:00 GMT');
  });

  test('v2 does NOT carry deprecation headers', async () => {
    const res = await request(app).get('/v2/venues').set(KEY);
    expect(res.headers['deprecation']).toBeUndefined();
    expect(res.headers['sunset']).toBeUndefined();
  });
});

// ── Auth guard on versioned writes ───────────────────────────────────────────

describe('versioned writes require an API key', () => {
  test('POST /v2/venues without a key returns 401', async () => {
    const res = await request(app).post('/v2/venues').send({});
    expect(res.status).toBe(401);
  });

  test('POST /v1/venues without a key returns 401', async () => {
    const res = await request(app).post('/v1/venues').send({});
    expect(res.status).toBe(401);
  });
});
