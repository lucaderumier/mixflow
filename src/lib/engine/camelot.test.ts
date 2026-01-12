import { describe, it, expect } from 'vitest';
import {
	musicalKeyToCamelot,
	isCamelotCompatible,
	getCamelotDistance,
	getKeyCompatibilityType,
	VALID_CAMELOT_KEYS
} from './camelot';

describe('musicalKeyToCamelot', () => {
	describe('major keys', () => {
		it('converts C major to 8B', () => {
			expect(musicalKeyToCamelot('C major')).toBe('8B');
			expect(musicalKeyToCamelot('C')).toBe('8B');
		});

		it('converts G major to 9B', () => {
			expect(musicalKeyToCamelot('G major')).toBe('9B');
			expect(musicalKeyToCamelot('G')).toBe('9B');
		});

		it('converts D major to 10B', () => {
			expect(musicalKeyToCamelot('D major')).toBe('10B');
			expect(musicalKeyToCamelot('D')).toBe('10B');
		});

		it('converts A major to 11B', () => {
			expect(musicalKeyToCamelot('A major')).toBe('11B');
			expect(musicalKeyToCamelot('A')).toBe('11B');
		});

		it('converts E major to 12B', () => {
			expect(musicalKeyToCamelot('E major')).toBe('12B');
			expect(musicalKeyToCamelot('E')).toBe('12B');
		});

		it('converts B major to 1B', () => {
			expect(musicalKeyToCamelot('B major')).toBe('1B');
			expect(musicalKeyToCamelot('B')).toBe('1B');
		});

		it('converts F major to 7B', () => {
			expect(musicalKeyToCamelot('F major')).toBe('7B');
			expect(musicalKeyToCamelot('F')).toBe('7B');
		});
	});

	describe('minor keys', () => {
		it('converts A minor to 8A', () => {
			expect(musicalKeyToCamelot('A minor')).toBe('8A');
			expect(musicalKeyToCamelot('Am')).toBe('8A');
		});

		it('converts E minor to 9A', () => {
			expect(musicalKeyToCamelot('E minor')).toBe('9A');
			expect(musicalKeyToCamelot('Em')).toBe('9A');
		});

		it('converts B minor to 10A', () => {
			expect(musicalKeyToCamelot('B minor')).toBe('10A');
			expect(musicalKeyToCamelot('Bm')).toBe('10A');
		});

		it('converts D minor to 7A', () => {
			expect(musicalKeyToCamelot('D minor')).toBe('7A');
			expect(musicalKeyToCamelot('Dm')).toBe('7A');
		});

		it('converts G minor to 6A', () => {
			expect(musicalKeyToCamelot('G minor')).toBe('6A');
			expect(musicalKeyToCamelot('Gm')).toBe('6A');
		});

		it('converts C minor to 5A', () => {
			expect(musicalKeyToCamelot('C minor')).toBe('5A');
			expect(musicalKeyToCamelot('Cm')).toBe('5A');
		});

		it('converts F minor to 4A', () => {
			expect(musicalKeyToCamelot('F minor')).toBe('4A');
			expect(musicalKeyToCamelot('Fm')).toBe('4A');
		});
	});

	describe('enharmonic equivalents', () => {
		it('handles G#/Ab minor (1A)', () => {
			expect(musicalKeyToCamelot('G# minor')).toBe('1A');
			expect(musicalKeyToCamelot('Ab minor')).toBe('1A');
			expect(musicalKeyToCamelot('G#m')).toBe('1A');
			expect(musicalKeyToCamelot('Abm')).toBe('1A');
		});

		it('handles D#/Eb minor (2A)', () => {
			expect(musicalKeyToCamelot('D# minor')).toBe('2A');
			expect(musicalKeyToCamelot('Eb minor')).toBe('2A');
			expect(musicalKeyToCamelot('D#m')).toBe('2A');
			expect(musicalKeyToCamelot('Ebm')).toBe('2A');
		});

		it('handles A#/Bb minor (3A)', () => {
			expect(musicalKeyToCamelot('A# minor')).toBe('3A');
			expect(musicalKeyToCamelot('Bb minor')).toBe('3A');
			expect(musicalKeyToCamelot('A#m')).toBe('3A');
			expect(musicalKeyToCamelot('Bbm')).toBe('3A');
		});

		it('handles F#/Gb minor (11A)', () => {
			expect(musicalKeyToCamelot('F# minor')).toBe('11A');
			expect(musicalKeyToCamelot('Gb minor')).toBe('11A');
			expect(musicalKeyToCamelot('F#m')).toBe('11A');
			expect(musicalKeyToCamelot('Gbm')).toBe('11A');
		});

		it('handles C#/Db minor (12A)', () => {
			expect(musicalKeyToCamelot('C# minor')).toBe('12A');
			expect(musicalKeyToCamelot('Db minor')).toBe('12A');
			expect(musicalKeyToCamelot('C#m')).toBe('12A');
			expect(musicalKeyToCamelot('Dbm')).toBe('12A');
		});

		it('handles F#/Gb major (2B)', () => {
			expect(musicalKeyToCamelot('F# major')).toBe('2B');
			expect(musicalKeyToCamelot('Gb major')).toBe('2B');
			expect(musicalKeyToCamelot('F#')).toBe('2B');
			expect(musicalKeyToCamelot('Gb')).toBe('2B');
		});

		it('handles C#/Db major (3B)', () => {
			expect(musicalKeyToCamelot('C# major')).toBe('3B');
			expect(musicalKeyToCamelot('Db major')).toBe('3B');
			expect(musicalKeyToCamelot('C#')).toBe('3B');
			expect(musicalKeyToCamelot('Db')).toBe('3B');
		});

		it('handles G#/Ab major (4B)', () => {
			expect(musicalKeyToCamelot('G# major')).toBe('4B');
			expect(musicalKeyToCamelot('Ab major')).toBe('4B');
			expect(musicalKeyToCamelot('G#')).toBe('4B');
			expect(musicalKeyToCamelot('Ab')).toBe('4B');
		});

		it('handles D#/Eb major (5B)', () => {
			expect(musicalKeyToCamelot('D# major')).toBe('5B');
			expect(musicalKeyToCamelot('Eb major')).toBe('5B');
			expect(musicalKeyToCamelot('D#')).toBe('5B');
			expect(musicalKeyToCamelot('Eb')).toBe('5B');
		});

		it('handles A#/Bb major (6B)', () => {
			expect(musicalKeyToCamelot('A# major')).toBe('6B');
			expect(musicalKeyToCamelot('Bb major')).toBe('6B');
			expect(musicalKeyToCamelot('A#')).toBe('6B');
			expect(musicalKeyToCamelot('Bb')).toBe('6B');
		});
	});

	describe('edge cases', () => {
		it('returns null for unrecognized keys', () => {
			expect(musicalKeyToCamelot('X major')).toBeNull();
			expect(musicalKeyToCamelot('invalid')).toBeNull();
			expect(musicalKeyToCamelot('')).toBeNull();
		});

		it('handles keys with extra whitespace', () => {
			expect(musicalKeyToCamelot('  C major  ')).toBe('8B');
			expect(musicalKeyToCamelot('A minor ')).toBe('8A');
		});

		it('handles case variations', () => {
			expect(musicalKeyToCamelot('c major')).toBe('8B');
			expect(musicalKeyToCamelot('C MAJOR')).toBe('8B');
			expect(musicalKeyToCamelot('am')).toBe('8A');
		});
	});
});

describe('getKeyCompatibilityType', () => {
	it('returns "same" for identical keys', () => {
		expect(getKeyCompatibilityType('8B', '8B')).toBe('same');
		expect(getKeyCompatibilityType('1A', '1A')).toBe('same');
		expect(getKeyCompatibilityType('12B', '12B')).toBe('same');
	});

	it('returns "relative" for same number, different letter', () => {
		expect(getKeyCompatibilityType('8B', '8A')).toBe('relative');
		expect(getKeyCompatibilityType('8A', '8B')).toBe('relative');
		expect(getKeyCompatibilityType('1A', '1B')).toBe('relative');
		expect(getKeyCompatibilityType('12B', '12A')).toBe('relative');
	});

	it('returns "adjacent" for ±1 hour same letter', () => {
		// +1
		expect(getKeyCompatibilityType('8B', '9B')).toBe('adjacent');
		expect(getKeyCompatibilityType('8A', '9A')).toBe('adjacent');
		// -1
		expect(getKeyCompatibilityType('8B', '7B')).toBe('adjacent');
		expect(getKeyCompatibilityType('8A', '7A')).toBe('adjacent');
	});

	it('returns "adjacent" for wrap-around (12 → 1 and 1 → 12)', () => {
		expect(getKeyCompatibilityType('12B', '1B')).toBe('adjacent');
		expect(getKeyCompatibilityType('1B', '12B')).toBe('adjacent');
		expect(getKeyCompatibilityType('12A', '1A')).toBe('adjacent');
		expect(getKeyCompatibilityType('1A', '12A')).toBe('adjacent');
	});

	it('returns "incompatible" for distant keys', () => {
		expect(getKeyCompatibilityType('8B', '3B')).toBe('incompatible');
		expect(getKeyCompatibilityType('1A', '7A')).toBe('incompatible');
		expect(getKeyCompatibilityType('8B', '2B')).toBe('incompatible');
	});

	it('returns "incompatible" for adjacent number but different letter', () => {
		// These are NOT compatible in standard Camelot mixing
		expect(getKeyCompatibilityType('8B', '9A')).toBe('incompatible');
		expect(getKeyCompatibilityType('8A', '7B')).toBe('incompatible');
	});
});

describe('isCamelotCompatible', () => {
	describe('compatible combinations', () => {
		it('returns true for same key', () => {
			for (const key of VALID_CAMELOT_KEYS) {
				expect(isCamelotCompatible(key, key)).toBe(true);
			}
		});

		it('returns true for +1 hour', () => {
			expect(isCamelotCompatible('8B', '9B')).toBe(true);
			expect(isCamelotCompatible('5A', '6A')).toBe(true);
			expect(isCamelotCompatible('11B', '12B')).toBe(true);
		});

		it('returns true for -1 hour', () => {
			expect(isCamelotCompatible('8B', '7B')).toBe(true);
			expect(isCamelotCompatible('5A', '4A')).toBe(true);
			expect(isCamelotCompatible('2B', '1B')).toBe(true);
		});

		it('returns true for wrap-around (12 ↔ 1)', () => {
			expect(isCamelotCompatible('12B', '1B')).toBe(true);
			expect(isCamelotCompatible('1B', '12B')).toBe(true);
			expect(isCamelotCompatible('12A', '1A')).toBe(true);
			expect(isCamelotCompatible('1A', '12A')).toBe(true);
		});

		it('returns true for relative major/minor', () => {
			expect(isCamelotCompatible('8B', '8A')).toBe(true);
			expect(isCamelotCompatible('8A', '8B')).toBe(true);
			expect(isCamelotCompatible('1A', '1B')).toBe(true);
			expect(isCamelotCompatible('12B', '12A')).toBe(true);
		});
	});

	describe('incompatible combinations', () => {
		it('returns false for keys 2+ hours apart', () => {
			expect(isCamelotCompatible('8B', '10B')).toBe(false);
			expect(isCamelotCompatible('8B', '6B')).toBe(false);
			expect(isCamelotCompatible('1A', '4A')).toBe(false);
		});

		it('returns false for opposite sides of wheel', () => {
			expect(isCamelotCompatible('1B', '7B')).toBe(false);
			expect(isCamelotCompatible('3A', '9A')).toBe(false);
		});

		it('returns false for diagonal moves (adjacent number, different letter)', () => {
			expect(isCamelotCompatible('8B', '9A')).toBe(false);
			expect(isCamelotCompatible('8B', '7A')).toBe(false);
			expect(isCamelotCompatible('5A', '6B')).toBe(false);
		});
	});

	describe('symmetry', () => {
		it('is symmetric (A compatible with B means B compatible with A)', () => {
			for (const keyA of VALID_CAMELOT_KEYS) {
				for (const keyB of VALID_CAMELOT_KEYS) {
					expect(isCamelotCompatible(keyA, keyB)).toBe(isCamelotCompatible(keyB, keyA));
				}
			}
		});
	});
});

describe('getCamelotDistance', () => {
	it('returns 0 for same key', () => {
		expect(getCamelotDistance('8B', '8B')).toBe(0);
		expect(getCamelotDistance('1A', '1A')).toBe(0);
	});

	it('returns 1 for adjacent keys (same letter)', () => {
		expect(getCamelotDistance('8B', '9B')).toBe(1);
		expect(getCamelotDistance('8B', '7B')).toBe(1);
		expect(getCamelotDistance('5A', '6A')).toBe(1);
	});

	it('returns 1 for relative major/minor', () => {
		expect(getCamelotDistance('8B', '8A')).toBe(1);
		expect(getCamelotDistance('8A', '8B')).toBe(1);
	});

	it('handles wrap-around correctly (12 → 1 is distance 1)', () => {
		expect(getCamelotDistance('12B', '1B')).toBe(1);
		expect(getCamelotDistance('1B', '12B')).toBe(1);
		expect(getCamelotDistance('12A', '1A')).toBe(1);
	});

	it('returns correct distance for opposite sides of wheel', () => {
		// Maximum distance on a 12-hour wheel is 6
		expect(getCamelotDistance('1B', '7B')).toBe(6);
		expect(getCamelotDistance('6B', '12B')).toBe(6);
	});

	it('calculates minimum circular distance', () => {
		// 8 to 10 could be 2 (forward) or 10 (backward), should be 2
		expect(getCamelotDistance('8B', '10B')).toBe(2);
		// 8 to 5 could be 3 (backward) or 9 (forward), should be 3
		expect(getCamelotDistance('8B', '5B')).toBe(3);
	});

	it('adds penalty for different letters with different numbers', () => {
		// 8B to 9A: number distance 1 + letter penalty = 2
		expect(getCamelotDistance('8B', '9A')).toBe(2);
		// 8B to 10A: number distance 2 + letter penalty = 3
		expect(getCamelotDistance('8B', '10A')).toBe(3);
	});
});
