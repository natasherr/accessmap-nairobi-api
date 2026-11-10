import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues.js';
import venueRoutesV1 from './routes/v1.js';
import venueRoutesV2 from './routes/v2.js';
import reportRoutes from './routes/reports.js';
import partnerRoutes from './routes/partner.js';
import {
  checkApiKey,
  isPublicReadRequest,
  isPublicRallyFeedbackRequest,
} from './middleware.js';
import { rateLimiter } from './ratelimiter.js';
import { monitor, statsHandler } from './monitoring.js';

dotenv.config();

const app = express();
export const PORT = process.env.PORT || 5000;

// Middleware
app.use(monitor);
app.use(cors());
app.use(express.json());
app.disable('x-powered-by');

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

// The health check and explicitly allowlisted read-only routes are public.
app.get('/', (req, res) => {
  res.send('AccessMap API is running');
});

const apiKeyRateLimiter = rateLimiter({ windowMs: 60_000, max: 100 });
const publicReadRateLimiter = rateLimiter({ windowMs: 60_000, max: 100 });
const publicRallyFeedbackRateLimiter = rateLimiter({ windowMs: 60_000, max: 5 });

function apiGuard(req, res, next) {
  if (isPublicReadRequest(req)) {
    return publicReadRateLimiter(req, res, next);
  }

  if (isPublicRallyFeedbackRequest(req)) {
    return publicRallyFeedbackRateLimiter(req, res, next);
  }

  return checkApiKey(req, res, () =>
    apiKeyRateLimiter(req, res, next)
  );
}

app.use('/api', apiGuard);
app.use('/v1', apiGuard);
app.use('/v2', apiGuard);

app.get('/api/stats', statsHandler);

// Versioned venue routes — mount before the legacy path so the key check
// applies to v1 and v2 writes just as it does to /api/venues.
app.use('/v1/venues', venueRoutesV1);
app.use('/v2/venues', venueRoutesV2);

// Mount modular routes (Lab Step 4)
// Legacy /api/venues is kept alive and aliased to v1 so existing callers
// are not broken before the sunset date.
app.use('/api/venues', venueRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/partner', partnerRoutes);

export default app ;
