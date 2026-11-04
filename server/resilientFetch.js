const RETRY_AFTER_MAX_MS = 5_000;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const lastGoodResponses = new Map();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class PartnerUnavailableError extends Error {
  constructor(cause) {
    super('Partner data unavailable', { cause });
    this.name = 'PartnerUnavailableError';
  }
}

function retryDelay(response, attempt, delayMs, retryAfterMaxMs) {
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After'));
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      return Math.min(retryAfter * 1_000, retryAfterMaxMs);
    }
  }

  return delayMs * 2 ** attempt;
}

function failureReason(error) {
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'timeout';
  return error.cause?.code || error.message;
}

export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    timeoutMs = 1_500,
    retries = 2,
    delayMs = 200,
    retryAfterMaxMs = RETRY_AFTER_MAX_MS,
    consumeResponse,
  } = config;
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = method === 'GET' ? retries : 0;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!RETRY_STATUSES.has(response.status) || attempt >= maxRetries) {
        if (response.ok && consumeResponse) return await consumeResponse(response);
        return response;
      }

      const waitMs = retryDelay(response, attempt, delayMs, retryAfterMaxMs);
      console.warn(`Partner GET attempt ${attempt + 1} failed with HTTP ${response.status}; retrying in ${waitMs} ms`);
      await sleep(waitMs);
    } catch (error) {
      if (error.retryable === false) throw error;
      if (attempt >= maxRetries) throw error;

      const waitMs = delayMs * 2 ** attempt;
      console.warn(`Partner GET attempt ${attempt + 1} failed (${failureReason(error)}); retrying in ${waitMs} ms`);
      await sleep(waitMs);
    }
  }
}

export async function fetchPartnerJson(url, options = {}, config = {}) {
  const {
    cacheKey = url,
    validate = value => value !== null && typeof value === 'object',
    ...retryConfig
  } = config;

  try {
    const result = await fetchWithRetry(url, options, {
      ...retryConfig,
      consumeResponse: async response => {
        const data = await response.json();
        if (!validate(data)) {
          const error = new Error('Partner returned an unexpected response shape');
          error.retryable = false;
          throw error;
        }
        return { data };
      },
    });

    if (!(result instanceof Response)) {
      const { data } = result;
      const liveResult = { data, stale: false, asOf: new Date().toISOString() };
      lastGoodResponses.set(cacheKey, liveResult);
      return liveResult;
    }

    const response = result;
    if (!response.ok) {
      const error = new Error(`Partner returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    throw new Error('Partner response could not be processed');
  } catch (error) {
    console.error('Partner GET failed:', failureReason(error));

    const lastGood = lastGoodResponses.get(cacheKey);
    if (lastGood) return { ...lastGood, stale: true };

    throw new PartnerUnavailableError(error);
  }
}

export function clearPartnerResponseCache() {
  lastGoodResponses.clear();
}
