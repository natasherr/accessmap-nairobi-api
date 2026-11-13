import request from 'supertest';
import { jest } from '@jest/globals';

// ── Mock the database module before app.js is imported ──────────────────────
const mockQuery = jest.fn();
jest.unstable_mockModule('../db.js', () => ({
  default: { query: mockQuery },
  pool:    { query: mockQuery },
}));

const { default: pool } = await import('../db.js');

const TEST_API_KEY = 'test-reports-key';
process.env.API_KEY = TEST_API_KEY;
const { default: app } = await import('../app.js');

function apiPost(path) {
  return request(app)
    .post(path)
    .set('am-api-key', TEST_API_KEY);
}

// ── Shared fixture data ──────────────────────────────────────────────────────
const fakeVenueRow = {
  id: 'v_001',
  slug: 'test-venue',
  name: 'Test Venue',
  area: 'Test Area',
  address: '1 Test Rd',
  category: 'other',
  isCivic: false,
  ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
  tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
  lat: '-1.29', lng: '36.82',
  addedAt: '2026-01-01T00:00:00.000Z',
  isSeeded: false,
};

const fakeReportRow = {
  id: 'r_001',
  venueId: 'v_001',
  rating: 4,
  description: 'Test report',
  visitedAt: '2026-06-15',
  submittedAt: '2026-06-16T00:00:00.000Z',
  ramp: true, lift: true, accessibleToilet: true, accessibleParking: true,
  tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /api/reports ─────────────────────────────────────────────────────────

describe('GET /api/reports', () => {
  it('happy path: returns 200 and an array of reports matching the contract shape', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeReportRow] });

    const res = await request(app).get('/api/reports');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const report = res.body[0];
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('venueId');
    expect(typeof report.rating).toBe('number');
    expect(report).toHaveProperty('accessibility');
    expect(typeof report.accessibility.ramp).toBe('boolean');
  });
});

// ── POST /api/reports ────────────────────────────────────────────────────────

describe('POST /api/reports', () => {
  const validReport = (venueId = 'v_001') => ({
    venueId,
    rating: 4,
    description: 'Test report',
    visitedAt: '2026-06-15',
    accessibility: {
      ramp: true, lift: true, accessibleToilet: true, accessibleParking: true,
      tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
    },
  });

  it('happy path: returns 201 and the created report matching the contract shape', async () => {
    // venueCheck → venue exists, maxId → next id, insert → row
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'v_001' }] })          // venue exists
      .mockResolvedValueOnce({ rows: [{ max_num: 0 }] })            // MAX id
      .mockResolvedValueOnce({ rows: [fakeReportRow] });             // INSERT RETURNING

    const report = validReport('v_001');
    const res = await apiPost('/api/reports').send(report);

    expect(res.status).toBe(201);
    expect(res.body.venueId).toBe('v_001');
    expect(res.body.rating).toBe(4);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('submittedAt');
    expect(typeof res.body.accessibility.staffAssistance).toBe('boolean');
  });

  it('validation rejection: 400 when venueId is missing', async () => {
    const { venueId, ...invalid } = validReport();

    const res = await apiPost('/api/reports').send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('validation rejection: 400 when rating is out of range', async () => {
    const report = { ...validReport(), rating: 9 };

    const res = await apiPost('/api/reports').send(report);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when rating has the wrong type', async () => {
    const report = { ...validReport(), rating: 'four' };

    const res = await apiPost('/api/reports').send(report);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when visitedAt is missing', async () => {
    const { visitedAt, ...invalid } = validReport();

    const res = await apiPost('/api/reports').send(invalid);

    expect(res.status).toBe(400);
  });

  it('not-found case: returns 404 when venueId does not correspond to a real venue', async () => {
    // venueCheck → no rows found
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const report = validReport('v_does_not_exist');
    const res = await apiPost('/api/reports').send(report);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
