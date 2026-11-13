/**
 * partner.js
 *
 * Adapter between AccessMap Nairobi and the Group 11 Voter Edu API.
 *
 * This is the ONLY file that knows whether we are talking to v1 or v2 of
 * the upstream partner API.  The rest of the app always receives the same
 * internal shape:
 *
 *   { id, name, party, average_rating, review_count }
 *
 * To migrate to v2, change PARTNER_VERSION in server/.env.  No other file
 * needs to change; rolling back is equally simple.
 */

function normaliseCandidate(c) {
  return {
    id: c.id,
    name: c.name,
    party: c.party ?? null,
    average_rating: c.average_rating ?? null,
    review_count: c.review_count ?? 0,
  };
}

/**
 * Parse the raw response body from GET /candidates (or /v2/candidates).
 *
 * @param {unknown} data    - parsed JSON body from the partner
 * @param {'v1'|'v2'} version
 * @returns {{ id, name, party, average_rating, review_count }[]}
 */
export function parseCandidates(data, version = 'v1') {
  if (version === 'v2') {
    if (!data || !Array.isArray(data.data)) {
      throw new Error(
        'Partner v2 /candidates response has unexpected shape — expected { data: [...] }'
      );
    }
    return data.data.map(normaliseCandidate);
  }

  // v1: bare array
  if (!Array.isArray(data)) {
    throw new Error(
      'Partner v1 /candidates response has unexpected shape — expected a bare array'
    );
  }
  return data.map(normaliseCandidate);
}

/**
 * Build the correct /candidates URL for the configured partner version.
 *
 * @param {string} partnerBaseUrl  - e.g. https://voter-edu.onrender.com/api
 * @returns {string}
 */
export function candidatesUrl(partnerBaseUrl) {
  const version = process.env.PARTNER_VERSION || 'v1';
  const base = partnerBaseUrl.replace(/\/+$/, '');
  return version === 'v2' ? `${base}/v2/candidates` : `${base}/candidates`;
}

/**
 * Build the correct /rallies URL for the configured partner version.
 *
 * @param {string} partnerBaseUrl  - e.g. https://voter-edu.onrender.com/api
 * @returns {string}
 */
export function ralliesUrl(partnerBaseUrl) {
  const version = process.env.PARTNER_VERSION || 'v1';
  const base = partnerBaseUrl.replace(/\/+$/, '');
  return version === 'v2' ? `${base}/v2/rallies` : `${base}/rallies`;
}

/**
 * Parse the raw response body from GET /rallies (or /v2/rallies).
 * Returns a bare array in both versions so callers always receive the same shape.
 *
 * @param {unknown} data    - parsed JSON body from the partner (already extracted from fetchPartnerJson cache envelope)
 * @param {'v1'|'v2'} version
 * @returns {object[]}
 */
export function parseRallies(data, version = 'v1') {
  if (Array.isArray(data)) return data;

  if (data !== null && typeof data === 'object') {
    for (const key of ['data', 'items', 'results', 'rallies']) {
      if (Array.isArray(data[key])) return data[key];
    }
  }

  throw new Error(
    `Partner ${version} /rallies response has unexpected shape — expected an array or { data: [...] }`
  );
}
