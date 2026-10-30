import crypto from 'crypto';

export function isPublicReadRequest(req) {
  if (req.method !== 'GET') return false;

  const path = `${req.baseUrl || ''}${req.path}`.replace(/\/+$/, '') || '/';
  return path === '/api/venues' ||
    /^\/api\/venues\/[^/]+$/.test(path) ||
    /^\/api\/venues\/[^/]+\/rating$/.test(path) ||
    /^\/api\/venues\/[^/]+\/reports$/.test(path) ||
    path === '/api/reports' ||
    path === '/api/partner/rallies';
}

export function checkApiKey(req, res, next) {
  const configuredKeys = (process.env.API_KEY || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const key = req.header('am-api-key');
  if (!key) return res.status(401).json({ error: 'API Key not found' });

  const matches = configuredKeys.some(configuredKey => {
    const expected = Buffer.from(configuredKey);
    const received = Buffer.from(key);
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  });

  if (!matches) return res.status(401).json({ error: 'API Key does not match' });

  req.apiKey = key;
  next();
}
