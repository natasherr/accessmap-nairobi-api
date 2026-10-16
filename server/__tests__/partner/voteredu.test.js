import request from 'supertest';

// The contract's `servers` URL, including /api, so every path below
// matches a path in Voter Edu's openapi.yaml character for character.
const API = process.env.PARTNER_API_URL || 'http://localhost:5000/api';

// POST tests that actually create a review change THEIR database and their
// average ratings. They only run when we explicitly opt in (and have told them).
const writeTest = process.env.ALLOW_PARTNER_WRITES === 'true' ? it : it.skip;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const OPTIONAL_CANDIDATE_FIELDS = [
  'initials', 'party', 'description', 'experience', 'vision',
  'fiscal', 'agriculture', 'governance', 'cost_of_living',
];

// Every error response in the contract is { code: string, message: string }.
// The exact code values appear only as examples in the contract, so we assert the shape.
function expectContractError(res) {
  expect(res.body).toHaveProperty('code');
  expect(res.body).toHaveProperty('message');
  expect(typeof res.body.code).toBe('string');
  expect(typeof res.body.message).toBe('string');
}

function expectCandidateShape(c) {
  // Required by the contract
  expect(typeof c.id).toBe('string');
  expect(typeof c.name).toBe('string');
  expect(c).toHaveProperty('average_rating'); // required, but nullable
  if (c.average_rating !== null) {
    expect(typeof c.average_rating).toBe('number');
    expect(c.average_rating).toBeGreaterThanOrEqual(0);
    expect(c.average_rating).toBeLessThanOrEqual(5);
  }
  expect(Number.isInteger(c.review_count)).toBe(true);
  expect(c.review_count).toBeGreaterThanOrEqual(0);

  // Optional and nullable: if present and not null, must be a string
  for (const field of OPTIONAL_CANDIDATE_FIELDS) {
    if (c[field] !== undefined && c[field] !== null) {
      expect(typeof c[field]).toBe('string');
    }
  }
}

function expectReviewShape(r) {
  expect(Number.isInteger(r.id)).toBe(true);
  expect(typeof r.candidate_id).toBe('string');
  expect(typeof r.user).toBe('string');
  expect(Number.isInteger(r.rating)).toBe(true);
  expect(r.rating).toBeGreaterThanOrEqual(1);
  expect(r.rating).toBeLessThanOrEqual(5);
  expect(typeof r.text).toBe('string');
  expect(r.date).toMatch(DATE_ONLY); // contract says format: date, not a timestamp
}

// Arrange: get a real candidate id from their API instead of assuming one exists
let candidateId;

beforeAll(async () => {
  let res;
  try {
    // Fixed: changed from '/api/candidates' to '/candidates' to prevent double /api/api pathing
    res = await request(API).get('/candidates');
  } catch (err) {
    throw new Error(
      `Cannot reach Voter Edu API at ${API} (${err.code}). Is their server running and is PARTNER_API_URL correct?`
    );
  }
  if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) {
    throw new Error(`GET /candidates returned status ${res.status} with no usable list, so the other tests cannot be arranged.`);
  }
  candidateId = res.body[0].id;
});

describe('GET /candidates', () => {
  it('returns 200 and a JSON array of candidates', async () => {
    const res = await request(API).get('/candidates');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('every candidate matches the Candidate schema', async () => {
    const res = await request(API).get('/candidates');

    res.body.forEach(expectCandidateShape);
  });
});

describe('GET /candidates/:candidateId', () => {
  it('returns 200 and the matching candidate', async () => {
    const res = await request(API).get(`/candidates/${candidateId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(candidateId);
    expectCandidateShape(res.body);
  });

  it('returns 404 with a { code, message } error for an unknown candidate', async () => {
    const res = await request(API).get('/candidates/this-candidate-does-not-exist');

    expect(res.status).toBe(404);
    expectContractError(res);
  });
});

describe('GET /candidates/:candidateId/reviews', () => {
  it('returns 200 and reviews that match the Review schema', async () => {
    const res = await request(API).get(`/candidates/${candidateId}/reviews`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(r => {
      expectReviewShape(r);
      expect(r.candidate_id).toBe(candidateId);
    });
  });

  it('minRating=4 only returns reviews rated 4 or higher', async () => {
    const res = await request(API).get(`/candidates/${candidateId}/reviews?minRating=4`);

    expect(res.status).toBe(200);
    res.body.forEach(r => expect(r.rating).toBeGreaterThanOrEqual(4));
  });

  it('a filtered list is never longer than the unfiltered list (edge: minRating=5)', async () => {
    const all = await request(API).get(`/candidates/${candidateId}/reviews`);
    const filtered = await request(API).get(`/candidates/${candidateId}/reviews?minRating=5`);

    expect(filtered.status).toBe(200);
    expect(filtered.body.length).toBeLessThanOrEqual(all.body.length);
    filtered.body.forEach(r => expect(r.rating).toBe(5));
  });

  it.each(['0', '6', 'abc', '3.5'])(
    'rejects invalid minRating=%s with 400 and a { code, message } error',
    async (bad) => {
      const res = await request(API).get(`/candidates/${candidateId}/reviews?minRating=${bad}`);

      expect(res.status).toBe(400);
      expectContractError(res);
    }
  );

  it('returns 404 with a { code, message } error for an unknown candidate', async () => {
    const res = await request(API).get('/candidates/this-candidate-does-not-exist/reviews');

    expect(res.status).toBe(404);
    expectContractError(res);
  });
});

describe('POST /candidates/:candidateId/reviews', () => {
  const validBody = {
    user: 'AUTOMATED TEST - Team 12 (AccessMap Nairobi)',
    rating: 4,
    text: 'Automated contract test from Team 12 - safe to delete.',
  };

  // ── Rejections: nothing should be written if their API follows the contract ──

  it.each([
    ['rating is missing', { text: 'some text' }],
    ['text is missing', { rating: 4 }],
    ['rating is above 5', { rating: 9, text: 'some text' }],
    ['rating is below 1', { rating: 0, text: 'some text' }],
    ['rating is not an integer', { rating: 'five', text: 'some text' }],
  ])('returns 400 when %s', async (_label, body) => {
    const res = await request(API).post(`/candidates/${candidateId}/reviews`).send(body);

    expect(res.status).toBe(400);
    expectContractError(res);
  });

  it('returns 404 for an unknown candidate (valid body)', async () => {
    const res = await request(API)
      .post('/candidates/this-candidate-does-not-exist/reviews')
      .send(validBody);

    expect(res.status).toBe(404);
    expectContractError(res);
  });

  // ── Real writes: these change THEIR database. Opt in with ALLOW_PARTNER_WRITES=true ──

  writeTest('returns 201 and the created review, which is then retrievable', async () => {
    const res = await request(API).post(`/candidates/${candidateId}/reviews`).send(validBody);

    expect(res.status).toBe(201);
    expectReviewShape(res.body);
    expect(res.body.candidate_id).toBe(candidateId);
    expect(res.body.user).toBe(validBody.user);
    expect(res.body.rating).toBe(validBody.rating);
    expect(res.body.text).toBe(validBody.text);

    // Re-fetch to confirm the write really happened, not just that the API said so
    const list = await request(API).get(`/candidates/${candidateId}/reviews`);
    expect(list.body.some(r => r.id === res.body.id)).toBe(true);
  });

  writeTest('defaults user to "Anonymous Voter" when user is omitted', async () => {
    const { user, ...bodyWithoutUser } = validBody;

    const res = await request(API).post(`/candidates/${candidateId}/reviews`).send(bodyWithoutUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toBe('Anonymous Voter');
  });
});