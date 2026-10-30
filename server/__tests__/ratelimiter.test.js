import { jest } from '@jest/globals';
import { rateLimiter } from '../ratelimiter.js';

describe('rateLimiter', () => {
  it('allows 100 requests per key and rejects the 101st within the minute', () => {
    const middleware = rateLimiter({ windowMs: 60_000, max: 100 });
    const req = { apiKey: 'consumer-key', ip: '127.0.0.1' };
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    for (let count = 0; count < 100; count += 1) {
      middleware(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(100);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(100);
    expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Too many requests',
      retryAfter: expect.any(Number),
    });
    expect(res.json.mock.calls[0][0].retryAfter).toBeGreaterThan(0);
    expect(res.json.mock.calls[0][0].retryAfter).toBeLessThanOrEqual(60);
  });
});
