/**
 * partner.test.js
 *
 * Unit tests for the parseCandidates adapter in server/partner.js.
 * These run without a database or network; they test the parsing logic only.
 */

import { parseCandidates } from '../partner.js';

const RAW_CANDIDATE = {
  id: 'c_001',
  name: 'Jane Doe',
  party: 'Independent',
  average_rating: 4.2,
  review_count: 17,
};

describe('parseCandidates — v1 (bare array)', () => {
  test('returns a normalised array from a bare array', () => {
    const result = parseCandidates([RAW_CANDIDATE], 'v1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'c_001',
      name: 'Jane Doe',
      party: 'Independent',
      average_rating: 4.2,
      review_count: 17,
    });
  });

  test('fills in null/0 defaults for missing optional fields', () => {
    const sparse = { id: 'c_002', name: 'John Smith' };
    const [result] = parseCandidates([sparse], 'v1');
    expect(result.party).toBeNull();
    expect(result.average_rating).toBeNull();
    expect(result.review_count).toBe(0);
  });

  test('throws when v1 data is not an array', () => {
    expect(() => parseCandidates({ data: [] }, 'v1')).toThrow(
      /unexpected shape/
    );
  });
});

describe('parseCandidates — v2 (envelope)', () => {
  test('returns a normalised array from a { data, count } envelope', () => {
    const result = parseCandidates({ data: [RAW_CANDIDATE], count: 1 }, 'v2');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c_001');
  });

  test('throws when v2 data.data is not an array', () => {
    expect(() => parseCandidates({ items: [] }, 'v2')).toThrow(
      /unexpected shape/
    );
  });

  test('throws when v2 body is null', () => {
    expect(() => parseCandidates(null, 'v2')).toThrow(/unexpected shape/);
  });
});
