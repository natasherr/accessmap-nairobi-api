import crypto from 'crypto';

// Browser app reads may omit the API key only when they come from a configured
// frontend origin. Server-to-server API consumers still need am-api-key.
const APP_READ_PREFIXES = ['/api/venues', '/api/reports', '/api/partner'];

export function checkApiKey(req, res, next) {
  const allowedOrigins = (process.env.PUBLIC_READ_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const origin = req.get('origin');
  const isAppRead = req.method === 'GET' && origin && allowedOrigins.includes(origin) &&
    APP_READ_PREFIXES.some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`));
  const isHealthCheck = req.method === 'GET' && req.path === '/';
  if (isAppRead || isHealthCheck) return next();

  const key = req.header('am-api-key');
  if (!key) return res.status(401).json({ error: 'API Key not found' });

  const configuredKeys = (process.env.API_KEY || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const matches = configuredKeys.some(configuredKey => {
    const expected = Buffer.from(configuredKey);
    const received = Buffer.from(key);
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  });

  if (!matches) return res.status(401).json({ error: 'API Key does not match' });

  req.apiKey = key;
  next();
}
