import crypto from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { checkApiKey } from '../middleware.js';
import { monitor, statsHandler } from '../monitoring.js';

const app = express();
app.use(monitor);
const apiRoutes = express.Router();
apiRoutes.get('/items/:id', (req, res) => {
  if (req.params.id === 'missing') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ id: req.params.id });
});
app.use('/api', checkApiKey, apiRoutes);
app.get('/api/stats', checkApiKey, statsHandler);

describe('request monitoring', () => {
  let originalApiKey;
  let log;

  beforeAll(() => {
    originalApiKey = process.env.API_KEY;
    process.env.API_KEY = 'monitor-test-key';
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = originalApiKey;
  });

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('logs the path without its query and fingerprints a valid key', async () => {
    await request(app)
      .get('/api/items/123?email=private@example.com')
      .set('am-api-key', 'monitor-test-key');

    const entry = JSON.parse(log.mock.calls[0][0]);
    const expectedHash = crypto.createHash('sha256')
      .update('monitor-test-key')
      .digest('hex')
      .slice(0, 6);

    expect(entry).toMatchObject({
      method: 'GET',
      path: '/api/items/123',
      status: 200,
      caller: `key-${expectedHash}`,
    });
    expect(entry.ms).toEqual(expect.any(Number));
    expect(log.mock.calls[0][0]).not.toContain('private@example.com');
    expect(log.mock.calls[0][0]).not.toContain('monitor-test-key');
  });

  it('logs rejected requests before the API key check without recording a key', async () => {
    await request(app).get('/api/stats');

    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({
      method: 'GET',
      path: '/api/stats',
      status: 401,
      caller: 'none',
    });
  });

  it('reports request totals and groups ids under the route pattern', async () => {
    const before = await request(app)
      .get('/api/stats')
      .set('am-api-key', 'monitor-test-key');

    await request(app)
      .get('/api/items/missing')
      .set('am-api-key', 'monitor-test-key');

    const after = await request(app)
      .get('/api/stats')
      .set('am-api-key', 'monitor-test-key');

    expect(after.body.total).toBe(before.body.total + 2);
    expect(after.body.clientErrors).toBeGreaterThanOrEqual(before.body.clientErrors + 1);
    expect(after.body.routes['GET /api/items/:id']).toMatchObject({
      clientErrors: expect.any(Number),
      serverErrors: expect.any(Number),
      count: expect.any(Number),
      avgMs: expect.any(Number),
      maxMs: expect.any(Number),
    });
    expect(after.body.routes['GET /api/items/:id'].clientErrors).toBeGreaterThanOrEqual(1);
    expect(after.body.errorRatePercent).toEqual(expect.any(Number));
  });
});
