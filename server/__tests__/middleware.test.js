import express from 'express';
import request from 'supertest';
import { checkApiKey, isPublicReadRequest } from '../middleware.js';

process.env.API_KEY = 'test-key-1,test-key-2';

const app = express();
app.get('/', (req, res) => res.send('health'));
app.use(checkApiKey);
app.get('/api/data', (req, res) => res.json({ ok: true, apiKey: req.apiKey }));

describe('API key middleware', () => {
  it('allows the health check without an API key', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('health');
  });

  it('rejects API requests without a key, including requests from the frontend origin', async () => {
    const response = await request(app)
      .get('/api/data')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'API Key not found' });
  });

  it('rejects a request with an invalid key', async () => {
    const response = await request(app)
      .get('/api/data')
      .set('am-api-key', 'wrong-key');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'API Key does not match' });
  });

  it('accepts any configured consumer key', async () => {
    const response = await request(app)
      .get('/api/data')
      .set('am-api-key', 'test-key-2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, apiKey: 'test-key-2' });
  });
});

describe('public read-only endpoint policy', () => {
  const publicReadApp = express();
  publicReadApp.use('/api', (req, res, next) => {
    if (isPublicReadRequest(req)) return next();
    return checkApiKey(req, res, next);
  });
  publicReadApp.get('/api/venues', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/venues/:slug', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/venues/:slug/rating', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/venues/:venueId/reports', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/reports', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/partner/rallies', (req, res) => res.sendStatus(200));
  publicReadApp.get('/api/partner/candidates', (req, res) => res.sendStatus(200));
  publicReadApp.post('/api/venues', (req, res) => res.sendStatus(201));

  it.each([
    ['GET', '/api/venues'],
    ['GET', '/api/venues/example-venue'],
    ['GET', '/api/venues/example-venue/rating'],
    ['GET', '/api/venues/v_001/reports'],
    ['GET', '/api/reports'],
    ['GET', '/api/partner/rallies'],
  ])('allows public read %s %s without a key', async (method, path) => {
    const response = await request(publicReadApp)[method.toLowerCase()](path);

    expect(response.status).toBe(200);
  });

  it.each([
    ['GET', '/api/partner/candidates'],
    ['POST', '/api/venues'],
  ])('continues requiring a key for %s %s', async (method, path) => {
    const response = await request(publicReadApp)[method.toLowerCase()](path);

    expect(response.status).toBe(401);
  });
});
