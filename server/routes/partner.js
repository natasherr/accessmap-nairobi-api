import express from 'express';
import {
  fetchPartnerJson,
  fetchWithRetry,
  PartnerUnavailableError,
} from '../resilientFetch.js';
import { candidatesUrl, parseCandidates, ralliesUrl, parseRallies } from '../partner.js';

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
        ? { timeoutMs: 3_000, retries: 2, delayMs: 1_000, retryAfterMaxMs: 1_000 }
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

router.get('/rallies', async (req, res) => {
  const partnerUrl = process.env.PARTNER_URL?.replace(/\/+$/, '');
  const partnerApiKey = process.env.PARTNER_API_KEY;
  const version = process.env.PARTNER_VERSION || 'v1';

  if (!partnerUrl || !partnerApiKey) {
    return res.status(503).json({ message: 'Voter Edu API is not configured.' });
  }

  try {
    const result = await fetchPartnerJson(ralliesUrl(partnerUrl), {
      headers: {
        'X-API-Key': partnerApiKey,
        Accept: 'application/json',
      },
    }, {
      validate: isRallyPayload,
      timeoutMs: 3_000, retries: 2, delayMs: 1_000, retryAfterMaxMs: 1_000,
    });

    const rallies = parseRallies(result.data, version);

    res.set('X-Data-Stale', String(result.stale));
    res.set('X-Data-As-Of', result.asOf);
    return res.status(200).json(rallies);
  } catch (error) {
    if (error instanceof PartnerUnavailableError) {
      return res.status(502).json({ message: 'Voter Edu data is temporarily unavailable.' });
    }
    console.error('Unexpected error while preparing Voter Edu response:', error);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
});

router.get('/candidates', async (req, res) => {
  const partnerUrl = process.env.PARTNER_URL?.replace(/\/+$/, '');
  const partnerApiKey = process.env.PARTNER_API_KEY;
  const version = process.env.PARTNER_VERSION || 'v1';

  if (!partnerUrl || !partnerApiKey) {
    return res.status(503).json({ message: 'Voter Edu API is not configured.' });
  }

  try {
    const result = await fetchPartnerJson(candidatesUrl(partnerUrl), {
      headers: {
        'X-API-Key': partnerApiKey,
        Accept: 'application/json',
      },
    });

    const candidates = parseCandidates(result.data, version);

    res.set('X-Data-Stale', String(result.stale));
    res.set('X-Data-As-Of', result.asOf);
    return res.status(200).json(candidates);
  } catch (error) {
    if (error instanceof PartnerUnavailableError) {
      return res.status(502).json({ message: 'Voter Edu data is temporarily unavailable.' });
    }
    console.error('Unexpected error while preparing Voter Edu response:', error);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
});

router.get('/transport/landmarks', (req, res) =>
  proxyPartnerGet('/transport/landmarks', res)
);

router.post('/rallies/:rallyId/comments', async (req, res) => {
  const rallyId = req.params.rallyId?.trim();
  if (!rallyId || rallyId.length > 100 || /[\u0000-\u001f]/.test(rallyId)) {
    return res.status(400).json({ error: 'A valid rallyId is required.' });
  }

  const { comment, user, accessible, congestion_level: congestionLevel } = req.body || {};
  if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > 2_000) {
    return res.status(400).json({
      error: 'comment is required and must be 1 to 2000 characters.',
    });
  }
  if (user !== undefined &&
      (typeof user !== 'string' || user.trim().length > 80)) {
    return res.status(400).json({ error: 'user must be a string up to 80 characters.' });
  }
  if (accessible !== undefined &&
      ![true, false, 0, 1].includes(accessible)) {
    return res.status(400).json({ error: 'accessible must be true, false, 0, or 1.' });
  }
  if (congestionLevel !== undefined &&
      !['Low', 'Medium', 'Extreme'].includes(congestionLevel)) {
    return res.status(400).json({
      error: 'congestion_level must be Low, Medium, or Extreme.',
    });
  }

  const partnerUrl = process.env.PARTNER_URL?.replace(/\/+$/, '');
  const partnerApiKey = process.env.PARTNER_API_KEY;
  if (!partnerUrl || !partnerApiKey) {
    return res.status(503).json({ error: 'Voter Edu API is not configured.' });
  }

  const payload = {
    comment: comment.trim(),
    ...(typeof user === 'string' && user.trim() ? { user: user.trim() } : {}),
    ...(accessible !== undefined
      ? { accessible: Number(accessible) }
      : {}),
    ...(congestionLevel !== undefined
      ? { congestion_level: congestionLevel }
      : {}),
  };

  try {
    const response = await fetchWithRetry(
      `${partnerUrl}/rallies/${encodeURIComponent(rallyId)}/comments`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': partnerApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { timeoutMs: 5_000, retries: 0 }
    );

    if (!response.ok) {
      const status = response.status >= 400 && response.status < 500
        ? response.status
        : 502;
      return res.status(status).json({
        error: status === 502
          ? 'Voter Edu could not save the feedback.'
          : 'Voter Edu rejected the feedback.',
      });
    }

    const result = await response.json();
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting rally accessibility feedback:', error);
    return res.status(502).json({
      error: 'Voter Edu is temporarily unable to save feedback. Please try again.',
    });
  }
});

export default router;