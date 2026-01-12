/**
 * Track Ordering Algorithm
 *
 * Uses a greedy nearest-neighbor heuristic with multiple starting points
 * to find an optimal track ordering based on BPM and key compatibility.
 */

import { getKeyCompatibilityType, isCamelotCompatible } from './camelot';
import type {
	KeyCompatibilityType,
	OrderingResult,
	Track,
	Transition,
	TransitionQuality
} from './types';

/** Maximum allowed BPM difference between consecutive tracks */
const MAX_BPM_DIFFERENCE = 20;

/**
 * Check if a track has valid analysis data for ordering.
 */
function isTrackAnalyzed(track: Track): boolean {
	return track.bpm !== null && track.camelotKey !== null;
}

/**
 * Check if a transition between two tracks is compatible.
 *
 * Compatible means:
 * - BPM difference is ≤ 20
 * - Keys are harmonically compatible (Camelot wheel)
 *
 * @param trackA - First track
 * @param trackB - Second track
 * @returns True if the tracks can be mixed together
 */
export function isTransitionCompatible(trackA: Track, trackB: Track): boolean {
	// Both tracks must have analysis data
	if (!isTrackAnalyzed(trackA) || !isTrackAnalyzed(trackB)) {
		return false;
	}

	// Check BPM compatibility
	const bpmDiff = Math.abs(trackA.bpm! - trackB.bpm!);
	if (bpmDiff > MAX_BPM_DIFFERENCE) {
		return false;
	}

	// Check key compatibility
	return isCamelotCompatible(trackA.camelotKey!, trackB.camelotKey!);
}

/**
 * Calculate the quality rating for a transition between two tracks.
 *
 * Quality ratings:
 * - Excellent: same key or ±1 with <5 BPM difference
 * - Good: compatible key with <10 BPM difference
 * - Fair: compatible key with 10-20 BPM difference
 * - Poor: incompatible (should not happen in valid orderings)
 *
 * @param trackA - First track
 * @param trackB - Second track
 * @returns The quality rating
 */
export function calculateTransitionQuality(trackA: Track, trackB: Track): TransitionQuality {
	if (!isTrackAnalyzed(trackA) || !isTrackAnalyzed(trackB)) {
		return 'poor';
	}

	const bpmDiff = Math.abs(trackA.bpm! - trackB.bpm!);
	const keyCompatibility = getKeyCompatibilityType(trackA.camelotKey!, trackB.camelotKey!);

	// Incompatible keys = poor
	if (keyCompatibility === 'incompatible') {
		return 'poor';
	}

	// BPM too high = poor (even with compatible keys)
	if (bpmDiff > MAX_BPM_DIFFERENCE) {
		return 'poor';
	}

	// Excellent: same key or adjacent/relative with <5 BPM diff
	if (bpmDiff < 5) {
		return 'excellent';
	}

	// Good: compatible key with <10 BPM diff
	if (bpmDiff < 10) {
		return 'good';
	}

	// Fair: compatible key with 10-20 BPM diff
	return 'fair';
}

/**
 * Create a transition object between two tracks.
 *
 * @param fromTrack - The track transitioning from
 * @param toTrack - The track transitioning to
 * @returns A Transition object with all details
 */
export function createTransition(fromTrack: Track, toTrack: Track): Transition {
	const bpmDifference =
		isTrackAnalyzed(fromTrack) && isTrackAnalyzed(toTrack)
			? Math.abs(fromTrack.bpm! - toTrack.bpm!)
			: Infinity;

	const keyCompatibility: KeyCompatibilityType =
		isTrackAnalyzed(fromTrack) && isTrackAnalyzed(toTrack)
			? getKeyCompatibilityType(fromTrack.camelotKey!, toTrack.camelotKey!)
			: 'incompatible';

	return {
		fromTrack,
		toTrack,
		bpmDifference,
		keyCompatibility,
		quality: calculateTransitionQuality(fromTrack, toTrack)
	};
}

/**
 * Build a greedy path starting from a given track.
 *
 * At each step, picks the compatible track with the smallest BPM difference.
 *
 * @param startTrack - The track to start from
 * @param allTracks - All available tracks
 * @returns Array of tracks in order (may be shorter than input if path dead-ends)
 */
function greedyPath(startTrack: Track, allTracks: Track[]): Track[] {
	const path: Track[] = [startTrack];
	const remaining = new Set(allTracks.filter((t) => t.id !== startTrack.id));
	let current = startTrack;

	while (remaining.size > 0) {
		// Find all compatible tracks
		const candidates: Track[] = [];
		for (const track of remaining) {
			if (isTransitionCompatible(current, track)) {
				candidates.push(track);
			}
		}

		if (candidates.length === 0) {
			// Dead end - no compatible tracks
			break;
		}

		// Pick the candidate with smallest BPM difference
		let best = candidates[0];
		let bestDiff = Math.abs(current.bpm! - best.bpm!);

		for (let i = 1; i < candidates.length; i++) {
			const diff = Math.abs(current.bpm! - candidates[i].bpm!);
			if (diff < bestDiff) {
				best = candidates[i];
				bestDiff = diff;
			}
		}

		path.push(best);
		remaining.delete(best);
		current = best;
	}

	return path;
}

/**
 * Calculate the total BPM variance of a path.
 * Lower is better (smoother transitions).
 *
 * @param path - Array of tracks in order
 * @returns Sum of squared BPM differences
 */
function calculatePathScore(path: Track[]): number {
	if (path.length < 2) return 0;

	let score = 0;
	for (let i = 0; i < path.length - 1; i++) {
		const diff = Math.abs(path[i].bpm! - path[i + 1].bpm!);
		score += diff * diff; // Squared to penalize large jumps
	}
	return score;
}

/**
 * Find the optimal ordering for a set of tracks.
 *
 * Uses a greedy nearest-neighbor heuristic with multiple starting points.
 * Tries starting from each track and keeps the best complete path found.
 *
 * @param tracks - Array of tracks to order
 * @returns OrderingResult with ordered tracks, orphans, and transitions
 *
 * @example
 * const result = findOptimalOrder(tracks);
 * if (result.isComplete) {
 *   console.log("All tracks placed:", result.orderedTracks);
 * } else {
 *   console.log("Orphaned tracks:", result.orphanTracks);
 * }
 */
export function findOptimalOrder(tracks: Track[]): OrderingResult {
	// Filter to only analyzed tracks
	const analyzedTracks = tracks.filter(isTrackAnalyzed);
	const unanalyzedTracks = tracks.filter((t) => !isTrackAnalyzed(t));

	// Edge cases
	if (analyzedTracks.length === 0) {
		return {
			orderedTracks: [],
			orphanTracks: [...unanalyzedTracks],
			transitions: [],
			isComplete: unanalyzedTracks.length === 0
		};
	}

	if (analyzedTracks.length === 1) {
		return {
			orderedTracks: [...analyzedTracks],
			orphanTracks: [...unanalyzedTracks],
			transitions: [],
			isComplete: unanalyzedTracks.length === 0
		};
	}

	// Try starting from each track, keep the best complete path
	let bestCompletePath: Track[] | null = null;
	let bestCompleteScore = Infinity;
	let bestPartialPath: Track[] = [];

	for (const startTrack of analyzedTracks) {
		const path = greedyPath(startTrack, analyzedTracks);

		if (path.length === analyzedTracks.length) {
			// Found a complete path
			const score = calculatePathScore(path);
			if (score < bestCompleteScore) {
				bestCompleteScore = score;
				bestCompletePath = path;
			}
		} else if (path.length > bestPartialPath.length) {
			// Keep track of the longest partial path
			bestPartialPath = path;
		} else if (path.length === bestPartialPath.length && path.length > 0) {
			// Same length - prefer lower score
			const newScore = calculatePathScore(path);
			const oldScore = calculatePathScore(bestPartialPath);
			if (newScore < oldScore) {
				bestPartialPath = path;
			}
		}
	}

	// Use complete path if found, otherwise use best partial
	const orderedTracks = bestCompletePath ?? bestPartialPath;
	const orderedIds = new Set(orderedTracks.map((t) => t.id));
	const orphanTracks = [
		...analyzedTracks.filter((t) => !orderedIds.has(t.id)),
		...unanalyzedTracks
	];

	// Build transitions
	const transitions: Transition[] = [];
	for (let i = 0; i < orderedTracks.length - 1; i++) {
		transitions.push(createTransition(orderedTracks[i], orderedTracks[i + 1]));
	}

	return {
		orderedTracks,
		orphanTracks,
		transitions,
		isComplete: bestCompletePath !== null && unanalyzedTracks.length === 0
	};
}

/**
 * Find groups of mutually compatible tracks ("islands").
 * Useful for showing the user why no complete path exists.
 *
 * @param tracks - Array of tracks to group
 * @returns Array of track groups, each group is internally compatible
 */
export function findCompatibleGroups(tracks: Track[]): Track[][] {
	const analyzedTracks = tracks.filter(isTrackAnalyzed);

	if (analyzedTracks.length === 0) {
		return [];
	}

	const groups: Track[][] = [];
	const assigned = new Set<string>();

	for (const track of analyzedTracks) {
		if (assigned.has(track.id)) continue;

		// Start a new group with this track
		const group: Track[] = [track];
		assigned.add(track.id);

		// Find all tracks that can connect to this group
		let changed = true;
		while (changed) {
			changed = false;
			for (const candidate of analyzedTracks) {
				if (assigned.has(candidate.id)) continue;

				// Check if candidate is compatible with any track in the group
				const isCompatible = group.some((groupTrack) =>
					isTransitionCompatible(groupTrack, candidate)
				);

				if (isCompatible) {
					group.push(candidate);
					assigned.add(candidate.id);
					changed = true;
				}
			}
		}

		groups.push(group);
	}

	// Sort groups by size (largest first)
	groups.sort((a, b) => b.length - a.length);

	return groups;
}
