import request from 'supertest';
import app from '../app.js';
import pool from '../db.js';

describe('GET /api/reports', () => {
  it('happy path: returns 200 and an array of reports matching the contract shape', async () => {
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

describe('POST /api/reports', () => {
  // Arrange helper — creates a fresh venue to attach reports to,
  // so tests don't depend on hardcoded/seeded IDs that might not exist
  async function createTestVenue() {
    const venue = {
      name: 'Report Test Venue ' + Date.now() + Math.random(),
      area: 'Test Area',
      address: '1 Test Rd',
      category: 'other',
      accessibility: {
        ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
        tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
      },
      coordinates: { lat: -1.29, lng: 36.82 },
    };
    const res = await request(app).post('/api/venues').send(venue);
    return res.body.id;
  }

  const validReport = (venueId) => ({
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
    // Arrange
    const venueId = await createTestVenue();
    const report = validReport(venueId);

    // Act
    const res = await request(app).post('/api/reports').send(report);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.venueId).toBe(venueId);
    expect(res.body.rating).toBe(4);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('submittedAt');
    expect(typeof res.body.accessibility.staffAssistance).toBe('boolean');
  });

  it('validation rejection: 400 when venueId is missing', async () => {
    const { venueId, ...invalid } = validReport('irrelevant');

    const res = await request(app).post('/api/reports').send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('validation rejection: 400 when rating is out of range', async () => {
    const venueId = await createTestVenue();
    const report = { ...validReport(venueId), rating: 9 };

    const res = await request(app).post('/api/reports').send(report);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when rating has the wrong type', async () => {
    const venueId = await createTestVenue();
    const report = { ...validReport(venueId), rating: 'four' };

    const res = await request(app).post('/api/reports').send(report);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when visitedAt is missing', async () => {
    const venueId = await createTestVenue();
    const { visitedAt, ...invalid } = validReport(venueId);

    const res = await request(app).post('/api/reports').send(invalid);

    expect(res.status).toBe(400);
  });

  it('not-found case: returns 404 when venueId does not correspond to a real venue', async () => {
    const report = validReport('v_does_not_exist_' + Date.now());

    const res = await request(app).post('/api/reports').send(report);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

});
afterAll(async () => {
    await pool.end();
});