/**
 * deprecate.js
 *
 * Middleware that attaches the three standard deprecation headers to a
 * response, telling every caller that this endpoint is going away.
 *
 * Usage in a router:
 *
 *   import { old } from '../deprecate.js';
 *   router.get('/venues', old, handler);
 *
 * Headers added:
 *   Deprecation: true
 *   Sunset:      <RFC 7231 date — the day v1 stops working>
 *   Link:        </v2/venues>; rel="successor-version"
 */

// Sunset date: enough time for Group 13 to migrate before Demo Day.
// Change this constant if the date needs to be adjusted.
const SUNSET_DATE = 'Fri, 13 Nov 2026 00:00:00 GMT';
const SUCCESSOR   = '</v2/venues>; rel="successor-version"';

export function old(req, res, next) {
  res.set('Deprecation', 'true');
  res.set('Sunset', SUNSET_DATE);
  res.set('Link', SUCCESSOR);
  next();
}
