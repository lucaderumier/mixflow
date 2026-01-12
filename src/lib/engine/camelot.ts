/**
 * Camelot Wheel System
 *
 * The Camelot wheel is a circular diagram that helps DJs mix harmonically
 * compatible songs. It arranges musical keys like hours on a clock.
 *
 * Inner ring (A) = Minor keys
 * Outer ring (B) = Major keys
 *
 * Compatible transitions from any position:
 * - Same key (X → X)
 * - +1 hour (X → X+1, wrapping 12→1)
 * - -1 hour (X → X-1, wrapping 1→12)
 * - Inner/outer switch (XA ↔ XB)
 */

import type { CamelotKey, KeyCompatibilityType, MusicalKey } from './types';

/**
 * Mapping from musical key notation to Camelot key.
 * Includes enharmonic equivalents (G# = Ab, etc.)
 */
const CAMELOT_MAP: Record<string, CamelotKey> = {
	// 1A - G#/Ab minor
	'G# minor': '1A',
	'Ab minor': '1A',
	'G#m': '1A',
	'Abm': '1A',

	// 1B - B major
	'B major': '1B',
	B: '1B',

	// 2A - D#/Eb minor
	'D# minor': '2A',
	'Eb minor': '2A',
	'D#m': '2A',
	'Ebm': '2A',

	// 2B - F#/Gb major
	'F# major': '2B',
	'Gb major': '2B',
	'F#': '2B',
	Gb: '2B',

	// 3A - A#/Bb minor
	'A# minor': '3A',
	'Bb minor': '3A',
	'A#m': '3A',
	'Bbm': '3A',

	// 3B - C#/Db major
	'C# major': '3B',
	'Db major': '3B',
	'C#': '3B',
	Db: '3B',

	// 4A - F minor
	'F minor': '4A',
	Fm: '4A',

	// 4B - G#/Ab major
	'G# major': '4B',
	'Ab major': '4B',
	'G#': '4B',
	Ab: '4B',

	// 5A - C minor
	'C minor': '5A',
	Cm: '5A',

	// 5B - D#/Eb major
	'D# major': '5B',
	'Eb major': '5B',
	'D#': '5B',
	Eb: '5B',

	// 6A - G minor
	'G minor': '6A',
	Gm: '6A',

	// 6B - A#/Bb major
	'A# major': '6B',
	'Bb major': '6B',
	'A#': '6B',
	Bb: '6B',

	// 7A - D minor
	'D minor': '7A',
	Dm: '7A',

	// 7B - F major
	'F major': '7B',
	F: '7B',

	// 8A - A minor
	'A minor': '8A',
	Am: '8A',

	// 8B - C major
	'C major': '8B',
	C: '8B',

	// 9A - E minor
	'E minor': '9A',
	Em: '9A',

	// 9B - G major
	'G major': '9B',
	G: '9B',

	// 10A - B minor
	'B minor': '10A',
	Bm: '10A',

	// 10B - D major
	'D major': '10B',
	D: '10B',

	// 11A - F#/Gb minor
	'F# minor': '11A',
	'Gb minor': '11A',
	'F#m': '11A',
	Gbm: '11A',

	// 11B - A major
	'A major': '11B',
	A: '11B',

	// 12A - C#/Db minor
	'C# minor': '12A',
	'Db minor': '12A',
	'C#m': '12A',
	Dbm: '12A',

	// 12B - E major
	'E major': '12B',
	E: '12B'
};

/**
 * All valid Camelot keys
 */
export const VALID_CAMELOT_KEYS: readonly CamelotKey[] = [
	'1A',
	'1B',
	'2A',
	'2B',
	'3A',
	'3B',
	'4A',
	'4B',
	'5A',
	'5B',
	'6A',
	'6B',
	'7A',
	'7B',
	'8A',
	'8B',
	'9A',
	'9B',
	'10A',
	'10B',
	'11A',
	'11B',
	'12A',
	'12B'
] as const;

/**
 * Convert a musical key notation to Camelot key.
 *
 * @param key - Musical key in standard notation (e.g., "C major", "Am", "F# minor")
 * @returns The corresponding Camelot key, or null if not recognized
 *
 * @example
 * musicalKeyToCamelot("C major") // "8B"
 * musicalKeyToCamelot("A minor") // "8A"
 * musicalKeyToCamelot("F# major") // "2B"
 */
export function musicalKeyToCamelot(key: MusicalKey): CamelotKey | null {
	// Try direct lookup first
	const direct = CAMELOT_MAP[key];
	if (direct) return direct;

	// Try normalizing the key (trim whitespace, handle case variations)
	const normalized = key.trim();
	const lookup = CAMELOT_MAP[normalized];
	if (lookup) return lookup;

	// Try lowercase version
	const lower = normalized.toLowerCase();
	for (const [mapKey, camelot] of Object.entries(CAMELOT_MAP)) {
		if (mapKey.toLowerCase() === lower) {
			return camelot;
		}
	}

	return null;
}

/**
 * Parse a Camelot key into its numeric and letter components.
 *
 * @param key - Camelot key (e.g., "8B", "11A")
 * @returns Object with number (1-12) and letter ('A' or 'B')
 */
function parseCamelotKey(key: CamelotKey): { number: number; letter: 'A' | 'B' } {
	const letter = key.slice(-1) as 'A' | 'B';
	const number = parseInt(key.slice(0, -1), 10);
	return { number, letter };
}

/**
 * Get the circular distance between two numbers on the Camelot wheel (1-12).
 * Returns the minimum distance going either direction around the wheel.
 *
 * @param a - First number (1-12)
 * @param b - Second number (1-12)
 * @returns Distance (0-6, since max distance on a 12-hour clock is 6)
 */
function circularDistance(a: number, b: number): number {
	const diff = Math.abs(a - b);
	return Math.min(diff, 12 - diff);
}

/**
 * Get the distance between two Camelot keys on the wheel.
 *
 * @param keyA - First Camelot key
 * @param keyB - Second Camelot key
 * @returns Distance value (0 = same, 1 = adjacent or relative, higher = further apart)
 *
 * @example
 * getCamelotDistance("8B", "8B") // 0 (same)
 * getCamelotDistance("8B", "9B") // 1 (adjacent)
 * getCamelotDistance("8B", "8A") // 1 (relative minor/major)
 * getCamelotDistance("8B", "2B") // 6 (opposite side of wheel)
 */
export function getCamelotDistance(keyA: CamelotKey, keyB: CamelotKey): number {
	const a = parseCamelotKey(keyA);
	const b = parseCamelotKey(keyB);

	const numberDistance = circularDistance(a.number, b.number);
	const letterDifferent = a.letter !== b.letter;

	// If same number but different letter, distance is 1 (relative major/minor)
	if (numberDistance === 0 && letterDifferent) {
		return 1;
	}

	// If different letter and different number, add penalty
	if (letterDifferent) {
		return numberDistance + 1;
	}

	return numberDistance;
}

/**
 * Get the compatibility type between two Camelot keys.
 *
 * @param keyA - First Camelot key
 * @param keyB - Second Camelot key
 * @returns The type of compatibility
 *
 * @example
 * getKeyCompatibilityType("8B", "8B") // "same"
 * getKeyCompatibilityType("8B", "9B") // "adjacent"
 * getKeyCompatibilityType("8B", "8A") // "relative"
 * getKeyCompatibilityType("8B", "3B") // "incompatible"
 */
export function getKeyCompatibilityType(
	keyA: CamelotKey,
	keyB: CamelotKey
): KeyCompatibilityType {
	const a = parseCamelotKey(keyA);
	const b = parseCamelotKey(keyB);

	// Same key
	if (a.number === b.number && a.letter === b.letter) {
		return 'same';
	}

	// Relative major/minor (same number, different letter)
	if (a.number === b.number && a.letter !== b.letter) {
		return 'relative';
	}

	// Adjacent on wheel (±1 hour, same letter)
	const numberDistance = circularDistance(a.number, b.number);
	if (numberDistance === 1 && a.letter === b.letter) {
		return 'adjacent';
	}

	return 'incompatible';
}

/**
 * Check if two Camelot keys are harmonically compatible for mixing.
 *
 * Compatible means:
 * - Same key
 * - Adjacent on wheel (±1 hour, same letter)
 * - Relative major/minor (same number, different letter)
 *
 * @param keyA - First Camelot key
 * @param keyB - Second Camelot key
 * @returns True if the keys are compatible for mixing
 *
 * @example
 * isCamelotCompatible("8B", "8B") // true (same)
 * isCamelotCompatible("8B", "9B") // true (adjacent +1)
 * isCamelotCompatible("8B", "7B") // true (adjacent -1)
 * isCamelotCompatible("8B", "8A") // true (relative minor)
 * isCamelotCompatible("8B", "3B") // false (too far apart)
 */
export function isCamelotCompatible(keyA: CamelotKey, keyB: CamelotKey): boolean {
	const compatibility = getKeyCompatibilityType(keyA, keyB);
	return compatibility !== 'incompatible';
}
