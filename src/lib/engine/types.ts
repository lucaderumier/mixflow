/**
 * MixFlow Engine Types
 *
 * Core TypeScript interfaces and types for the MixFlow audio analysis
 * and track ordering engine.
 */

/**
 * Standard musical key notation
 * Examples: "C major", "A minor", "F# major", "Bb minor"
 */
export type MusicalKey = string;

/**
 * Camelot wheel notation
 * Format: number (1-12) + letter (A for minor, B for major)
 * Examples: "8B" (C major), "8A" (A minor), "1A" (Ab minor)
 */
export type CamelotKey =
	| '1A'
	| '1B'
	| '2A'
	| '2B'
	| '3A'
	| '3B'
	| '4A'
	| '4B'
	| '5A'
	| '5B'
	| '6A'
	| '6B'
	| '7A'
	| '7B'
	| '8A'
	| '8B'
	| '9A'
	| '9B'
	| '10A'
	| '10B'
	| '11A'
	| '11B'
	| '12A'
	| '12B';

/**
 * Analysis status for a track
 */
export type AnalysisStatus = 'pending' | 'analyzing' | 'complete' | 'error';

/**
 * Mix status for a track after ordering algorithm runs
 * - 'none': Track hasn't been through the mix process yet
 * - 'mixed': Track is part of the final ordered mix
 * - 'orphan': Track couldn't be placed in the mix sequence
 */
export type MixStatus = 'none' | 'mixed' | 'orphan';

/**
 * Represents a single audio track
 */
export interface Track {
	/** Unique identifier (UUID) */
	id: string;
	/** Original filename */
	filename: string;
	/** Reference to the File object */
	file: File;

	// Analysis results (populated after analysis)
	/** Detected BPM (e.g., 128.5) */
	bpm: number | null;
	/** Detected key (e.g., "C major") */
	key: MusicalKey | null;
	/** Converted Camelot code (e.g., "8B") */
	camelotKey: CamelotKey | null;
	/** Duration in seconds */
	duration: number | null;

	// Status
	status: AnalysisStatus;
	/** Error message if status is 'error' */
	errorMessage?: string;

	// Mix status (set after ordering algorithm runs)
	/** Mix status: none, mixed, or orphan */
	mixStatus: MixStatus;
	/** Order in the final mix (1-based, only set if mixStatus is 'mixed') */
	mixOrder: number | null;
}

/**
 * Types of key compatibility based on Camelot wheel
 */
export type KeyCompatibilityType =
	| 'same' // Same key (e.g., 8B → 8B)
	| 'adjacent' // ±1 on wheel (e.g., 8B → 7B or 9B)
	| 'relative' // Same number, different letter (e.g., 8B → 8A)
	| 'incompatible'; // None of the above

/**
 * Visual quality rating for transitions
 */
export type TransitionQuality = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Information about a transition between two tracks
 */
export interface Transition {
	fromTrack: Track;
	toTrack: Track;
	/** Absolute BPM difference */
	bpmDifference: number;
	keyCompatibility: KeyCompatibilityType;
	/** Overall rating */
	quality: TransitionQuality;
}

/**
 * Result of the ordering algorithm
 */
export interface OrderingResult {
	/** Tracks in optimal order */
	orderedTracks: Track[];
	/** Tracks that couldn't be placed in the sequence */
	orphanTracks: Track[];
	/** Info about each transition */
	transitions: Transition[];
	/** True if all tracks were placed */
	isComplete: boolean;
}
