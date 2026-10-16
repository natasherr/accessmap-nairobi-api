import request from 'supertest';
import app from '../app.js';
import pool from '../db.js';

describe('GET /api/venues', () => {
  it('happy path: returns 200 and an array of venues matching the contract shape', async () => {
    // Act
    const res = await request(app).get('/api/venues');

    // Assert — strong assertions, not just status
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
    // Contract does NOT list isSeeded — confirm it's genuinely not leaking through
    expect(venue).not.toHaveProperty('isSeeded');
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/venues?category=hospital');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(v => v.category === 'hospital')).toBe(true);
  });

  it('filters by area', async () => {
    const res = await request(app).get('/api/venues?area=Westlands');

    expect(res.status).toBe(200);
    expect(res.body.every(v => v.area === 'Westlands')).toBe(true);
  });

  it('filters by accessible=true (ramp + accessibleToilet + accessibleParking all true)', async () => {
    const res = await request(app).get('/api/venues?accessible=true');

    expect(res.status).toBe(200);
    expect(res.body.every(v =>
      v.accessibility.ramp === true &&
      v.accessibility.accessibleToilet === true &&
      v.accessibility.accessibleParking === true
    )).toBe(true);
  });

  it('edge case: a category with no matches returns an empty array, not an error', async () => {
    const res = await request(app).get('/api/venues?category=nonexistentcategory123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/venues/:slug', () => {
  it('happy path: returns 200 with full venue details for a real slug', async () => {
    const res = await request(app).get('/api/venues/kenyatta-national-hospital');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('kenyatta-national-hospital');
    expect(res.body).toHaveProperty('coordinates');
    expect(typeof res.body.coordinates.lat).toBe('number');
    expect(typeof res.body.coordinates.lng).toBe('number');
    expect(res.body).toHaveProperty('addedAt');
  });

  it('not-found case: returns 404 with an error message for a slug that does not exist', async () => {
    const res = await request(app).get('/api/venues/this-slug-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});

describe('GET /api/venues/:slug/rating', () => {
  it('happy path: returns 200 with averageRating and totalReports for a venue with reports', async () => {
    const res = await request(app).get('/api/venues/kenyatta-national-hospital/rating');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slug', 'kenyatta-national-hospital');
    expect(typeof res.body.averageRating).toBe('number');
    expect(typeof res.body.totalReports).toBe('number');
    expect(res.body.totalReports).toBeGreaterThan(0);
  });

  it('not-found case: returns 404 for a nonexistent slug', async () => {
    const res = await request(app).get('/api/venues/nonexistent-slug/rating');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('edge case: a freshly created venue with zero reports returns averageRating 0', async () => {
    // Arrange — create a brand new venue with no reports yet
    const newVenue = {
      name: 'Rating Edge Case Venue ' + Date.now(),
      area: 'Test Area',
      address: '1 Test Rd',
      category: 'other',
      accessibility: {
        ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
        tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
      },
      coordinates: { lat: -1.29, lng: 36.82 },
    };
    const createRes = await request(app).post('/api/venues').send(newVenue);
    const slug = createRes.body.slug;

    // Act
    const res = await request(app).get(`/api/venues/${slug}/rating`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBe(0);
    expect(res.body.totalReports).toBe(0);
  });
});

describe('GET /api/venues/:venueId/reports', () => {
  it('happy path: returns 200 and an array of reports for a venue that has reports', async () => {
    const res = await request(app).get('/api/venues/v_001/reports');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('edge case: a venueId with no reports returns an empty array, not an error', async () => {
    const res = await request(app).get('/api/venues/v_does_not_exist/reports');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/venues', () => {
  const validVenue = () => ({
    name: 'Test Venue ' + Date.now() + Math.random(),
    area: 'Test Area',
    address: '123 Test St',
    category: 'other',
    accessibility: {
      ramp: true, lift: false, accessibleToilet: true, accessibleParking: true,
      tactilePaving: false, wideCorridors: true, audioAssistance: false, staffAssistance: true,
    },
    coordinates: { lat: -1.29, lng: 36.82 },
  });

  it('happy path: returns 201 and the created venue matching the contract shape', async () => {
    const venue = validVenue();

    const res = await request(app).post('/api/venues').send(venue);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(venue.name);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('slug');
    expect(res.body.accessibility.ramp).toBe(true);
    expect(res.body.coordinates.lat).toBe(venue.coordinates.lat);
  });

  it('validation rejection: 400 when name is missing', async () => {
    const { name, ...invalid } = validVenue();

    const res = await request(app).post('/api/venues').send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('validation rejection: 400 when area is missing', async () => {
    const { area, ...invalid } = validVenue();

    const res = await request(app).post('/api/venues').send(invalid);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when accessibility is missing entirely', async () => {
    const { accessibility, ...invalid } = validVenue();

    const res = await request(app).post('/api/venues').send(invalid);

    expect(res.status).toBe(400);
  });

  it('validation rejection: 400 when an accessibility field has the wrong type', async () => {
    const venue = validVenue();
    venue.accessibility.ramp = 'yes'; // should be boolean

    const res = await request(app).post('/api/venues').send(venue);

    expect(res.status).toBe(400);
  });

  it('duplicate rejection: 409 when posting the same name+area twice', async () => {
    const venue = validVenue();

    const first = await request(app).post('/api/venues').send(venue);
    const second = await request(app).post('/api/venues').send(venue);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('existing');
    expect(second.body.existing.name).toBe(venue.name);
  });
});
afterAll(async () => {
    await pool.end();
});