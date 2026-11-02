import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import partnerRoutes from '../routes/partner.js';
import { clearPartnerResponseCache } from '../resilientFetch.js';

const app = express();
app.use('/api/partner', partnerRoutes);

const jsonResponse = (status, data) =>
  new Response(JSON.stringify(data), { status });

describe('GET /api/partner/rallies resilience contract', () => {
  let originalFetch;
  let originalPartnerUrl;
  let originalPartnerKey;
  let warn;
  let error;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalPartnerUrl = process.env.PARTNER_URL;
    originalPartnerKey = process.env.PARTNER_API_KEY;
    process.env.PARTNER_URL = 'https://group11.example/api';
    process.env.PARTNER_API_KEY = 'test-partner-key';
    globalThis.fetch = jest.fn();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
    clearPartnerResponseCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalPartnerUrl === undefined) delete process.env.PARTNER_URL;
    else process.env.PARTNER_URL = originalPartnerUrl;
    if (originalPartnerKey === undefined) delete process.env.PARTNER_API_KEY;
    else process.env.PARTNER_API_KEY = originalPartnerKey;
    warn.mockRestore();
    error.mockRestore();
    clearPartnerResponseCache();
  });

  it('returns live rallies in the response envelope and keeps the key server-side', async () => {
    globalThis.fetch.mockResolvedValue(jsonResponse(200, [{ id: 'rally-1' }]));

    const response = await request(app).get('/api/partner/rallies');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [{ id: 'rally-1' }],
      stale: false,
    });
    expect(response.body.asOf).toEqual(expect.any(String));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://group11.example/api/rallies',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-partner-key' }),
      })
    );
  });

  it('returns last-known-good rallies as stale after exhausted upstream failures', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(200, [{ id: 'rally-1' }]));
    const liveResponse = await request(app).get('/api/partner/rallies');

    globalThis.fetch.mockResolvedValue(jsonResponse(503, { message: 'Unavailable' }));
    const staleResponse = await request(app).get('/api/partner/rallies');

    expect(liveResponse.status).toBe(200);
    expect(staleResponse.status).toBe(200);
    expect(staleResponse.body).toEqual({
      ...liveResponse.body,
      stale: true,
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });

  it('returns 502 if upstream fails before any good response is cached', async () => {
    globalThis.fetch.mockResolvedValue(jsonResponse(503, { message: 'Unavailable' }));

    const response = await request(app).get('/api/partner/rallies');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      message: 'Voter Edu data is temporarily unavailable.',
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('does not cache a malformed rally response as last-known-good data', async () => {
    globalThis.fetch.mockResolvedValue(jsonResponse(200, { message: 'not rally data' }));

    const response = await request(app).get('/api/partner/rallies');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      message: 'Voter Edu data is temporarily unavailable.',
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
