import express from 'express';
import { fetchPartnerJson, PartnerUnavailableError } from '../resilientFetch.js';

const router = express.Router();

function isRallyPayload(value) {
  if (Array.isArray(value)) return true;
  return value !== null &&
    typeof value === 'object' &&
    ['data', 'items', 'results', 'rallies'].some(key => Array.isArray(value[key]));
}

async function proxyPartnerGet(path, res) {
  const partnerUrl = process.env.PARTNER_URL?.replace(/\/+$/, '');
  const partnerApiKey = process.env.PARTNER_API_KEY;

  if (!partnerUrl || !partnerApiKey) {
    return res.status(503).json({
      message: 'Voter Edu API is not configured.',
    });
  }

  try {
    const result = await fetchPartnerJson(`${partnerUrl}${path}`, {
      headers: {
        'X-API-Key': partnerApiKey,
        Accept: 'application/json',
      },
    }, {
      validate: path === '/rallies' ? isRallyPayload : undefined,
      ...(path === '/rallies'
        ? { timeoutMs: 400, retries: 1, delayMs: 100, retryAfterMaxMs: 100 }
        : {}),
    });

    if (path === '/rallies') {
      return res.status(200).json(result);
    }

    res.set('X-Data-Stale', String(result.stale));
    res.set('X-Data-As-Of', result.asOf);
    return res.status(200).json(result.data);
  } catch (error) {
    if (error instanceof PartnerUnavailableError) {
      return res.status(502).json({ message: 'Voter Edu data is temporarily unavailable.' });
    }
    console.error('Unexpected error while preparing Voter Edu response:', error);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
}

router.get('/rallies', (req, res) =>
  proxyPartnerGet('/rallies', res)
);

router.get('/candidates', (req, res) =>
  proxyPartnerGet('/candidates', res)
);

router.get('/transport/landmarks', (req, res) =>
  proxyPartnerGet('/transport/landmarks', res)
);

export default router;