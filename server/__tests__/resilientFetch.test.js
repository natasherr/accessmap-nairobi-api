import { jest } from '@jest/globals';
import {
  clearPartnerResponseCache,
  fetchPartnerJson,
  fetchWithRetry,
} from '../resilientFetch.js';

const response = (status, body = [], headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe('fetchWithRetry', () => {
  let originalFetch;
  let warn;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    warn.mockRestore();
  });

  it('retries retryable server failures twice, then returns a successful response', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(502))
      .mockResolvedValueOnce(response(200, [{ id: 'rally-1' }]));

    const result = await fetchWithRetry('https://partner.test/rallies', {}, {
      delayMs: 0,
    });

    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable client errors', async () => {
    globalThis.fetch.mockResolvedValue(response(401));

    const result = await fetchWithRetry('https://partner.test/rallies', {}, {
      delayMs: 0,
    });

    expect(result.status).toBe(401);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries network failures, but stops after the configured retry count', async () => {
    globalThis.fetch.mockRejectedValue(new TypeError('fetch failed'));

    await expect(fetchWithRetry('https://partner.test/rallies', {}, {
      retries: 2,
      delayMs: 0,
    })).rejects.toThrow('fetch failed');

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('sets a timeout signal on each partner request', async () => {
    globalThis.fetch.mockResolvedValue(response(200));

    await fetchWithRetry('https://partner.test/rallies', {}, {
      timeoutMs: 1_500,
    });

    const options = globalThis.fetch.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts a request at its timeout', async () => {
    globalThis.fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));

    await expect(fetchWithRetry('https://partner.test/rallies', {}, {
      timeoutMs: 5,
      retries: 0,
    })).rejects.toMatchObject({ name: 'TimeoutError' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('honors a numeric Retry-After value, capped at five seconds', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response(429, [], { 'Retry-After': '8' }))
      .mockResolvedValueOnce(response(200));

    const originalSetTimeout = globalThis.setTimeout;
    const waits = [];
    globalThis.setTimeout = (callback, ms, ...args) => {
      waits.push(ms);
      return originalSetTimeout(callback, 0, ...args);
    };

    try {
      await fetchWithRetry('https://partner.test/rallies', {}, { retries: 1 });
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }

    expect(waits).toContain(5_000);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('never retries a write request', async () => {
    globalThis.fetch.mockResolvedValue(response(503));

    const result = await fetchWithRetry('https://partner.test/rallies', {
      method: 'POST',
    }, { delayMs: 0 });

    expect(result.status).toBe(503);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchPartnerJson fallback cache', () => {
  let originalFetch;
  let error;

  beforeEach(() => {
    clearPartnerResponseCache();
    originalFetch = globalThis.fetch;
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    error.mockRestore();
    clearPartnerResponseCache();
  });

  it('returns last-known-good data with stale metadata after an upstream failure', async () => {
    globalThis.fetch.mockResolvedValueOnce(response(200, [{ id: 'rally-1' }]));
    const current = await fetchPartnerJson('https://partner.test/rallies', {}, {
      retries: 0,
      cacheKey: 'rallies',
    });

    globalThis.fetch.mockResolvedValueOnce(response(503));
    const fallback = await fetchPartnerJson('https://partner.test/rallies', {}, {
      retries: 0,
      cacheKey: 'rallies',
    });

    expect(current).toMatchObject({ stale: false, data: [{ id: 'rally-1' }] });
    expect(fallback).toEqual({ ...current, stale: true });
  });

  it('retries if the response body times out before it is read', async () => {
    globalThis.fetch
      .mockImplementationOnce((_url, { signal }) => Promise.resolve({
        ok: true,
        status: 200,
        json: () => new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
      }))
      .mockResolvedValueOnce(response(200, [{ id: 'rally-2' }]));

    const result = await fetchPartnerJson('https://partner.test/rallies', {}, {
      timeoutMs: 5,
      retries: 1,
      delayMs: 0,
      cacheKey: 'body-timeout',
      validate: Array.isArray,
    });

    expect(result.data).toEqual([{ id: 'rally-2' }]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when the partner fails before any good response has been cached', async () => {
    globalThis.fetch.mockResolvedValue(response(503));

    await expect(fetchPartnerJson('https://partner.test/rallies', {}, {
      retries: 0,
      cacheKey: 'empty-cache',
    })).rejects.toThrow('Partner data unavailable');
  });
});
