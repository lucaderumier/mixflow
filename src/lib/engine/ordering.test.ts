import { describe, it, expect } from 'vitest';
import {
	isTransitionCompatible,
	calculateTransitionQuality,
	createTransition,
	findOptimalOrder,
	findCompatibleGroups
} from './ordering';
import type { CamelotKey, Track } from './types';

/**
 * Helper to create a mock track for testing
 */
function createMockTrack(
	id: string,
	bpm: number | null,
	camelotKey: CamelotKey | null
): Track {
	return {
		id,
		filename: `${id}.mp3`,
		file: new File([], `${id}.mp3`),
		bpm,
		key: camelotKey ? 'C major' : null, // Simplified - key doesn't matter for tests
		camelotKey,
		duration: 180,
		status: bpm !== null && camelotKey !== null ? 'complete' : 'pending',
		mixStatus: 'none',
		mixOrder: null
	};
}

describe('isTransitionCompatible', () => {
	it('returns true for compatible BPM and key', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 130, '9B');
		expect(isTransitionCompatible(trackA, trackB)).toBe(true);
	});

	it('returns true for same key, same BPM', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 128, '8B');
		expect(isTransitionCompatible(trackA, trackB)).toBe(true);
	});

	it('returns true for relative major/minor', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 130, '8A');
		expect(isTransitionCompatible(trackA, trackB)).toBe(true);
	});

	it('returns false when BPM difference exceeds 20', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 150, '8B'); // 22 BPM diff
		expect(isTransitionCompatible(trackA, trackB)).toBe(false);
	});

	it('returns true for exactly 20 BPM difference', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 148, '8B');
		expect(isTransitionCompatible(trackA, trackB)).toBe(true);
	});

	it('returns false for 21 BPM difference', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 149, '8B');
		expect(isTransitionCompatible(trackA, trackB)).toBe(false);
	});

	it('returns false for incompatible keys', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 130, '3B'); // 5 positions away
		expect(isTransitionCompatible(trackA, trackB)).toBe(false);
	});

	it('returns false when track A has no BPM', () => {
		const trackA = createMockTrack('1', null, '8B');
		const trackB = createMockTrack('2', 128, '8B');
		expect(isTransitionCompatible(trackA, trackB)).toBe(false);
	});

	it('returns false when track B has no key', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 128, null);
		expect(isTransitionCompatible(trackA, trackB)).toBe(false);
	});
});

describe('calculateTransitionQuality', () => {
	it('returns "excellent" for same key with <5 BPM diff', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 130, '8B'); // 2 BPM diff
		expect(calculateTransitionQuality(trackA, trackB)).toBe('excellent');
	});

	it('returns "excellent" for adjacent key with <5 BPM diff', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 132, '9B'); // 4 BPM diff, adjacent key
		expect(calculateTransitionQuality(trackA, trackB)).toBe('excellent');
	});

	it('returns "good" for compatible key with 5-9 BPM diff', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 135, '8B'); // 7 BPM diff
		expect(calculateTransitionQuality(trackA, trackB)).toBe('good');
	});

	it('returns "fair" for compatible key with 10-20 BPM diff', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 143, '8B'); // 15 BPM diff
		expect(calculateTransitionQuality(trackA, trackB)).toBe('fair');
	});

	it('returns "poor" for incompatible keys', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 130, '3B');
		expect(calculateTransitionQuality(trackA, trackB)).toBe('poor');
	});

	it('returns "poor" for BPM diff >20 even with same key', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 155, '8B'); // 27 BPM diff
		expect(calculateTransitionQuality(trackA, trackB)).toBe('poor');
	});

	it('returns "poor" for unanalyzed tracks', () => {
		const trackA = createMockTrack('1', null, '8B');
		const trackB = createMockTrack('2', 128, '8B');
		expect(calculateTransitionQuality(trackA, trackB)).toBe('poor');
	});
});

describe('createTransition', () => {
	it('creates a transition object with correct properties', () => {
		const trackA = createMockTrack('1', 128, '8B');
		const trackB = createMockTrack('2', 135, '9B');
		const transition = createTransition(trackA, trackB);

		expect(transition.fromTrack).toBe(trackA);
		expect(transition.toTrack).toBe(trackB);
		expect(transition.bpmDifference).toBe(7);
		expect(transition.keyCompatibility).toBe('adjacent');
		expect(transition.quality).toBe('good');
	});

	it('handles unanalyzed tracks', () => {
		const trackA = createMockTrack('1', null, null);
		const trackB = createMockTrack('2', 128, '8B');
		const transition = createTransition(trackA, trackB);

		expect(transition.bpmDifference).toBe(Infinity);
		expect(transition.keyCompatibility).toBe('incompatible');
		expect(transition.quality).toBe('poor');
	});
});

describe('findOptimalOrder', () => {
	describe('edge cases', () => {
		it('returns empty result for empty input', () => {
			const result = findOptimalOrder([]);
			expect(result.orderedTracks).toHaveLength(0);
			expect(result.orphanTracks).toHaveLength(0);
			expect(result.transitions).toHaveLength(0);
			expect(result.isComplete).toBe(true);
		});

		it('returns single track for single track input', () => {
			const track = createMockTrack('1', 128, '8B');
			const result = findOptimalOrder([track]);
			expect(result.orderedTracks).toHaveLength(1);
			expect(result.orderedTracks[0]).toBe(track);
			expect(result.orphanTracks).toHaveLength(0);
			expect(result.transitions).toHaveLength(0);
			expect(result.isComplete).toBe(true);
		});

		it('handles unanalyzed tracks as orphans', () => {
			const analyzed = createMockTrack('1', 128, '8B');
			const unanalyzed = createMockTrack('2', null, null);
			const result = findOptimalOrder([analyzed, unanalyzed]);

			expect(result.orderedTracks).toHaveLength(1);
			expect(result.orderedTracks[0]).toBe(analyzed);
			expect(result.orphanTracks).toHaveLength(1);
			expect(result.orphanTracks[0]).toBe(unanalyzed);
			expect(result.isComplete).toBe(false);
		});
	});

	describe('simple ordering', () => {
		it('orders 3 compatible tracks', () => {
			const tracks = [
				createMockTrack('1', 128, '8B'),
				createMockTrack('2', 130, '9B'),
				createMockTrack('3', 132, '10B')
			];
			const result = findOptimalOrder(tracks);

			expect(result.orderedTracks).toHaveLength(3);
			expect(result.orphanTracks).toHaveLength(0);
			expect(result.transitions).toHaveLength(2);
			expect(result.isComplete).toBe(true);

			// Verify each transition is compatible
			for (const transition of result.transitions) {
				expect(isTransitionCompatible(transition.fromTrack, transition.toTrack)).toBe(true);
			}
		});

		it('handles tracks with same BPM', () => {
			const tracks = [
				createMockTrack('1', 128, '8B'),
				createMockTrack('2', 128, '9B'),
				createMockTrack('3', 128, '10B')
			];
			const result = findOptimalOrder(tracks);

			expect(result.orderedTracks).toHaveLength(3);
			expect(result.isComplete).toBe(true);
		});
	});

	describe('partial ordering', () => {
		it('returns partial path when no complete path exists', () => {
			// Create tracks where no complete path is possible
			const tracks = [
				createMockTrack('1', 128, '8B'), // Only compatible with 7B, 9B, 8A
				createMockTrack('2', 130, '9B'), // Only compatible with 8B, 10B, 9A
				createMockTrack('3', 200, '3A') // Incompatible BPM and key with others
			];
			const result = findOptimalOrder(tracks);

			// Should have 2 tracks in order, 1 orphan
			expect(result.orderedTracks.length).toBe(2);
			expect(result.orphanTracks.length).toBe(1);
			expect(result.orphanTracks[0].id).toBe('3');
			expect(result.isComplete).toBe(false);
		});

		it('handles all incompatible tracks', () => {
			const tracks = [
				createMockTrack('1', 100, '8B'),
				createMockTrack('2', 150, '3A'), // Too different in BPM and key
				createMockTrack('3', 200, '11B') // Too different in BPM and key
			];
			const result = findOptimalOrder(tracks);

			// Should have at least 1 track (the starting point)
			expect(result.orderedTracks.length).toBeGreaterThanOrEqual(1);
			expect(result.isComplete).toBe(false);
		});
	});

	describe('optimal path selection', () => {
		it('prefers path with lower BPM variance', () => {
			// Create tracks where multiple complete paths exist
			const tracks = [
				createMockTrack('1', 128, '8B'),
				createMockTrack('2', 129, '9B'), // Very close BPM
				createMockTrack('3', 130, '10B')
			];
			const result = findOptimalOrder(tracks);

			expect(result.isComplete).toBe(true);
			// The algorithm should find a smooth path
			for (let i = 0; i < result.transitions.length; i++) {
				expect(result.transitions[i].bpmDifference).toBeLessThanOrEqual(20);
			}
		});
	});
});

describe('findCompatibleGroups', () => {
	it('returns empty array for empty input', () => {
		const groups = findCompatibleGroups([]);
		expect(groups).toHaveLength(0);
	});

	it('returns single group for all compatible tracks', () => {
		const tracks = [
			createMockTrack('1', 128, '8B'),
			createMockTrack('2', 130, '9B'),
			createMockTrack('3', 132, '10B')
		];
		const groups = findCompatibleGroups(tracks);

		expect(groups).toHaveLength(1);
		expect(groups[0]).toHaveLength(3);
	});

	it('returns multiple groups for incompatible tracks', () => {
		const tracks = [
			createMockTrack('1', 128, '8B'),
			createMockTrack('2', 130, '9B'),
			createMockTrack('3', 200, '3A') // Incompatible with others
		];
		const groups = findCompatibleGroups(tracks);

		expect(groups.length).toBeGreaterThan(1);
	});

	it('sorts groups by size (largest first)', () => {
		const tracks = [
			createMockTrack('1', 128, '8B'),
			createMockTrack('2', 130, '9B'),
			createMockTrack('3', 132, '10B'),
			createMockTrack('4', 200, '3A') // Alone in its group
		];
		const groups = findCompatibleGroups(tracks);

		// First group should be larger
		expect(groups[0].length).toBeGreaterThanOrEqual(groups[groups.length - 1].length);
	});

	it('ignores unanalyzed tracks', () => {
		const tracks = [
			createMockTrack('1', 128, '8B'),
			createMockTrack('2', null, null) // Unanalyzed
		];
		const groups = findCompatibleGroups(tracks);

		expect(groups).toHaveLength(1);
		expect(groups[0]).toHaveLength(1);
	});
});
