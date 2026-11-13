import request from 'supertest';
import { jest } from '@jest/globals';

// ── Mock the database module before app.js is imported ──────────────────────
// jest.unstable_mockModule is the ESM-native API (the project uses "type":"module").
// It must appear before any dynamic import of the module under test.
const mockQuery = jest.fn();
jest.unstable_mockModule('../db.js', () => ({
  default: { query: mockQuery },
  pool:    { query: mockQuery },
}));

// Dynamic imports AFTER the mock is registered so app.js receives the fake pool.
const { default: pool } = await import('../db.js');

const API_KEY_HEADER = 'am-api-key';
const VALID_API_KEY = 'test-key-123';
process.env.API_KEY = VALID_API_KEY;
const { default: app } = await import('../app.js');

// ── Shared fixture data ──────────────────────────────────────────────────────
const fakeVenueRow = {
  id: 'v_001',
  slug: 'kenyatta-national-hospital',
  name: 'Kenyatta National Hospital',
  area: 'Westlands',
  address: 'Hospital Rd',
  category: 'hospital',
  isCivic: false,
  ramp: true,
  lift: false,
  accessibleToilet: true,
  accessibleParking: true,
  tactilePaving: false,
  wideCorridors: true,
  audioAssistance: false,
  staffAssistance: true,
  lat: '-1.3000',
  lng: '36.8167',
  addedAt: '2026-01-01T00:00:00.000Z',
  isSeeded: true,
};

const fakeReportRow = {
  id: 'r_001',
  venueId: 'v_001',
  rating: 4,
  description: 'Good access',
  visitedAt: '2026-06-01',
  submittedAt: '2026-06-02T00:00:00.000Z',
  ramp: true,
  lift: false,
  accessibleToilet: true,
  accessibleParking: true,
  tactilePaving: false,
  wideCorridors: true,
  audioAssistance: false,
  staffAssistance: true,
};

function apiGet(path) {
  return request(app).get(path).set(API_KEY_HEADER, VALID_API_KEY);
}

function apiPost(path) {
  return request(app).post(path).set(API_KEY_HEADER, VALID_API_KEY);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /api/venues ──────────────────────────────────────────────────────────

describe('GET /api/venues', () => {
  it('happy path: returns 200 and an array of venues matching the contract shape', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await apiGet('/api/venues');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const venue = res.body[0];
    expect(venue).toHaveProperty('id');
    expect(venue).toHaveProperty('slug');
    expect(venue).toHaveProperty('name');
    expect(venue).toHaveProperty('accessibility');
    expect(typeof venue.accessibility.ramp).toBe('boolean');
    expect(typeof venue.accessibility.lift).toBe('boolean');
    // Contract does NOT list isSeeded — confirm it is not leaking through
    expect(venue).not.toHaveProperty('isSeeded');
  });

  it('filters by category', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await apiGet('/api/venues?category=hospital');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(v => v.category === 'hospital')).toBe(true);
  });

  it('filters by area', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await apiGet('/api/venues?area=Westlands');

    expect(res.status).toBe(200);
    expect(res.body.every(v => v.area === 'Westlands')).toBe(true);
  });

  it('filters by accessible=true (ramp + accessibleToilet + accessibleParking all true)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await apiGet('/api/venues?accessible=true');

    expect(res.status).toBe(200);
    expect(res.body.every(v =>
      v.accessibility.ramp === true &&
      v.accessibility.accessibleToilet === true &&
      v.accessibility.accessibleParking === true
    )).toBe(true);
  });

  it('edge case: a category with no matches returns an empty array, not an error', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await apiGet('/api/venues?category=nonexistentcategory123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── GET /api/venues/:slug ────────────────────────────────────────────────────

describe('GET /api/venues/:slug', () => {
  it('happy path: returns 200 with full venue details for a real slug', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await apiGet('/api/venues/kenyatta-national-hospital');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('kenyatta-national-hospital');
    expect(res.body).toHaveProperty('coordinates');
    expect(typeof res.body.coordinates.lat).toBe('number');
    expect(typeof res.body.coordinates.lng).toBe('number');
    expect(res.body).toHaveProperty('addedAt');
  });

  it('not-found case: returns 404 with an error message for a slug that does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await apiGet('/api/venues/this-slug-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});

// ── GET /api/venues/:slug/rating ─────────────────────────────────────────────

describe('GET /api/venues/:slug/rating', () => {
  it('happy path: returns 200 with averageRating and totalReports for a venue with reports', async () => {
    // First query fetches the venue, second fetches its reports
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'v_001', slug: 'kenyatta-national-hospital' }] })
      .mockResolvedValueOnce({ rows: [{ rating: 4 }, { rating: 5 }] });

    const res = await apiGet('/api/venues/kenyatta-national-hospital/rating');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slug', 'kenyatta-national-hospital');
    expect(typeof res.body.averageRating).toBe('number');
    expect(typeof res.body.totalReports).toBe('number');
    expect(res.body.totalReports).toBeGreaterThan(0);
  });

  it('not-found case: returns 404 for a nonexistent slug', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await apiGet('/api/venues/nonexistent-slug/rating');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('edge case: a venue with zero reports returns averageRating 0', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'v_new', slug: 'new-venue' }] })
      .mockResolvedValueOnce({ rows: [] }); // no reports yet

    const res = await apiGet('/api/venues/new-venue/rating');

    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBe(0);
    expect(res.body.totalReports).toBe(0);
  });
});

// ── GET /api/venues/:venueId/reports ─────────────────────────────────────────

describe('GET /api/venues/:venueId/reports', () => {
  it('happy path: returns 200 and an array of reports for a venue that has reports', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeReportRow] });

    const res = await apiGet('/api/venues/v_001/reports');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('edge case: a venueId with no reports returns an empty array, not an error', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await apiGet('/api/venues/v_does_not_exist/reports');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── POST /api/venues ─────────────────────────────────────────────────────────

describe('POST /api/venues', () => {
  const validVenue = () => ({
    name: 'Test Venue Alpha',
    area: 'Test Area',
    address: '123 Test St',
    category: 'other',
    accessibility: {
      ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
      tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
    },
    coordinates: { lat: -1.29, lng: 36.82 },
  });

  // Inserted row the DB "returns" after a successful POST
  const insertedRow = {
    id: 'v_099',
    slug: 'test-venue-alpha',
    name: 'Test Venue Alpha',
    area: 'Test Area',
    address: '123 Test St',
    category: 'other',
    isCivic: false,
    ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
    tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
    lat: '-1.29', lng: '36.82',
    addedAt: '2026-11-01T00:00:00.000Z',
    isSeeded: false,
  };

  it('happy path: returns 201 and the created venue matching the contract shape', async () => {
    // dupCheck → no duplicate, maxId → next id, insert → row
    mockQuery
      .mockResolvedValueOnce({ rows: [] })                        // dup check
      .mockResolvedValueOnce({ rows: [{ max_num: 98 }] })        // MAX id
      .mockResolvedValueOnce({ rows: [insertedRow] });            // INSERT RETURNING

    const venue = validVenue();
    const res = await apiPost('/api/venues').send(venue);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(venue.name);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('slug');
    expect(res.body.accessibility.ramp).toBe(true);
    expect(res.body.coordinates.lat).toBe(venue.coordinates.lat);
  });

  it('validation rejection: 400 when name is missing', async () => {
    const { name, ...invalid } = validVenue();

    const res = await apiPost('/api/venues').send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('validation rejection: 400 when area is missing', async () => {
    const { area, ...invalid } = validVenue();

    const res = await apiPost('/api/venues').send(invalid);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when accessibility is missing entirely', async () => {
    const { accessibility, ...invalid } = validVenue();

    const res = await apiPost('/api/venues').send(invalid);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when an accessibility field has the wrong type', async () => {
    const venue = validVenue();
    venue.accessibility.ramp = 'yes'; // should be boolean

    const res = await apiPost('/api/venues').send(venue);

    expect(res.status).toBe(400);
  });

  it('duplicate rejection: 409 when posting a venue that already exists', async () => {
    // dupCheck → existing row found
    mockQuery.mockResolvedValueOnce({ rows: [insertedRow] });

    const res = await apiPost('/api/venues').send(validVenue());

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('existing');
    expect(res.body.existing.name).toBe(insertedRow.name);
  });
});

// ── API key authentication ───────────────────────────────────────────────────

describe('API key authentication', () => {
  it('allows the public health check without an API key', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toBe('AccessMap API is running');
  });

  it('allows venue reads without an am-api-key header', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await request(app).get('/api/venues');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts a request with a valid am-api-key header and returns 200', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await request(app)
      .get('/api/venues')
      .set(API_KEY_HEADER, VALID_API_KEY);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('requires an API key for write requests', async () => {
    const res = await request(app).post('/api/venues').send({});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'API Key not found');
  });

  it('allows venue reads with an invalid am-api-key header', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeVenueRow] });

    const res = await request(app)
      .get('/api/venues')
      .set(API_KEY_HEADER, 'not-a-real-key');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
