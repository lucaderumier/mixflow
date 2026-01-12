/**
 * Tracks Store
 *
 * Manages the list of audio tracks and their analysis state.
 * Persists analyzed track data to localStorage for session recovery.
 */

import { writable, derived, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { Track, OrderingResult } from '$lib/engine';
import { findOptimalOrder } from '$lib/engine';
import { analyzeTrack, type AnalysisResult } from '$lib/audio';
import { browser } from '$app/environment';

const STORAGE_KEY = 'mixflow_tracks';

/**
 * Serializable track data (without File object)
 */
interface PersistedTrack {
	id: string;
	filename: string;
	bpm: number | null;
	key: string | null;
	camelotKey: string | null;
	duration: number | null;
	status: 'pending' | 'complete' | 'error';
	mixStatus: 'none' | 'mixed' | 'orphan';
	mixOrder: number | null;
	errorMessage?: string;
}

/**
 * Save tracks to localStorage (only analyzed data, not File objects)
 */
function persistTracks(tracks: Track[]) {
	if (!browser) return;

	const persistedTracks: PersistedTrack[] = tracks.map((t) => ({
		id: t.id,
		filename: t.filename,
		bpm: t.bpm,
		key: t.key,
		camelotKey: t.camelotKey,
		duration: t.duration,
		status: t.status === 'analyzing' ? 'pending' : t.status,
		mixStatus: t.mixStatus,
		mixOrder: t.mixOrder,
		errorMessage: t.errorMessage
	}));

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedTracks));
	} catch {
		// Ignore storage errors (quota exceeded, etc.)
	}
}

/**
 * Load tracks from localStorage
 */
function loadPersistedTracks(): Track[] {
	if (!browser) return [];

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];

		const persistedTracks: PersistedTrack[] = JSON.parse(stored);

		// Convert back to Track objects (without File - those need to be re-added)
		return persistedTracks.map((pt) => ({
			id: pt.id,
			filename: pt.filename,
			file: null as unknown as File, // File is not available after reload
			bpm: pt.bpm,
			key: pt.key,
			camelotKey: pt.camelotKey as Track['camelotKey'],
			duration: pt.duration,
			status: pt.status,
			mixStatus: pt.mixStatus,
			mixOrder: pt.mixOrder,
			errorMessage: pt.errorMessage
		}));
	} catch {
		return [];
	}
}

/**
 * Create a new track from a file
 */
function createTrack(file: File): Track {
	return {
		id: uuidv4(),
		filename: file.name,
		file,
		bpm: null,
		key: null,
		camelotKey: null,
		duration: null,
		status: 'pending',
		mixStatus: 'none',
		mixOrder: null
	};
}

/**
 * The main tracks store
 */
function createTracksStore() {
	// Initialize with persisted data if available
	const initialTracks = loadPersistedTracks();
	const { subscribe, set, update } = writable<Track[]>(initialTracks);

	// Helper to update and persist
	function updateAndPersist(updater: (tracks: Track[]) => Track[]) {
		update((tracks) => {
			const newTracks = updater(tracks);
			persistTracks(newTracks);
			return newTracks;
		});
	}

	return {
		subscribe,

		/**
		 * Add files to the track list
		 */
		addFiles(files: File[]) {
			updateAndPersist((tracks) => {
				const newTracks = files.map(createTrack);
				return [...tracks, ...newTracks];
			});
		},

		/**
		 * Remove a track by ID
		 */
		removeTrack(id: string) {
			updateAndPersist((tracks) => tracks.filter((t) => t.id !== id));
		},

		/**
		 * Clear all tracks
		 */
		clear() {
			set([]);
			persistTracks([]);
		},

		/**
		 * Update a track's analysis status
		 */
		updateTrackStatus(id: string, status: Track['status'], errorMessage?: string) {
			updateAndPersist((tracks) =>
				tracks.map((t) => (t.id === id ? { ...t, status, errorMessage } : t))
			);
		},

		/**
		 * Update a track with analysis results
		 */
		updateTrackAnalysis(id: string, result: AnalysisResult) {
			updateAndPersist((tracks) =>
				tracks.map((t) =>
					t.id === id
						? {
								...t,
								bpm: result.bpm,
								key: result.key,
								camelotKey: result.camelotKey,
								duration: result.duration,
								status: 'complete' as const
							}
						: t
				)
			);
		},

		/**
		 * Analyze all pending tracks
		 */
		async analyzeAll() {
			const tracks = get({ subscribe });
			const pendingTracks = tracks.filter((t) => t.status === 'pending');

			for (const track of pendingTracks) {
				// Update status to analyzing
				this.updateTrackStatus(track.id, 'analyzing');

				try {
					const result = await analyzeTrack(track.file);
					this.updateTrackAnalysis(track.id, result);
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Analysis failed';
					this.updateTrackStatus(track.id, 'error', message);
				}
			}
		},

		/**
		 * Analyze a single track
		 */
		async analyzeSingle(id: string) {
			const tracks = get({ subscribe });
			const track = tracks.find((t) => t.id === id);
			if (!track) return;

			this.updateTrackStatus(id, 'analyzing');

			try {
				const result = await analyzeTrack(track.file);
				this.updateTrackAnalysis(id, result);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Analysis failed';
				this.updateTrackStatus(id, 'error', message);
			}
		},

		/**
		 * Update mix status based on ordering result
		 */
		updateMixStatus(result: OrderingResult) {
			updateAndPersist((tracks) => {
				// Create a map of track IDs to their order in the mix
				const mixedIds = new Set(result.orderedTracks.map((t) => t.id));
				const orphanIds = new Set(result.orphanTracks.map((t) => t.id));

				return tracks.map((track) => {
					if (mixedIds.has(track.id)) {
						const order = result.orderedTracks.findIndex((t) => t.id === track.id) + 1;
						return { ...track, mixStatus: 'mixed' as const, mixOrder: order };
					} else if (orphanIds.has(track.id)) {
						return { ...track, mixStatus: 'orphan' as const, mixOrder: null };
					}
					return track;
				});
			});
		},

		/**
		 * Clear mix status on all tracks
		 */
		clearMixStatus() {
			updateAndPersist((tracks) =>
				tracks.map((t) => ({ ...t, mixStatus: 'none' as const, mixOrder: null }))
			);
		},

		/**
		 * Full mix process: analyze all pending tracks, then run ordering
		 */
		async mix() {
			// First, analyze all pending tracks
			await this.analyzeAll();

			// Then generate the order (this will update mixStatus on tracks)
			const currentTracks = get({ subscribe });
			const analyzedTracks = currentTracks.filter((t) => t.status === 'complete');

			if (analyzedTracks.length >= 2) {
				const result = findOptimalOrder(analyzedTracks);

				// Update mix status on tracks
				this.updateMixStatus(result);
			}
		}
	};
}

export const tracks = createTracksStore();

/**
 * Derived store: count of tracks by status
 */
export const trackStats = derived(tracks, ($tracks) => ({
	total: $tracks.length,
	pending: $tracks.filter((t) => t.status === 'pending').length,
	analyzing: $tracks.filter((t) => t.status === 'analyzing').length,
	complete: $tracks.filter((t) => t.status === 'complete').length,
	error: $tracks.filter((t) => t.status === 'error').length
}));

/**
 * Derived store: whether all tracks are analyzed
 */
export const allAnalyzed = derived(
	tracks,
	($tracks) => $tracks.length > 0 && $tracks.every((t) => t.status === 'complete')
);

/**
 * Derived store: whether any tracks are currently being analyzed
 */
export const isAnalyzing = derived(tracks, ($tracks) =>
	$tracks.some((t) => t.status === 'analyzing')
);

/**
 * Ordering result store
 */
function createOrderingStore() {
	const { subscribe, set } = writable<OrderingResult | null>(null);

	return {
		subscribe,

		/**
		 * Generate optimal ordering from current tracks and update mix status
		 */
		generate() {
			const currentTracks = get(tracks);
			const analyzedTracks = currentTracks.filter((t) => t.status === 'complete');

			if (analyzedTracks.length < 2) {
				set(null);
				return;
			}

			const result = findOptimalOrder(analyzedTracks);
			set(result);

			// Update mix status on tracks
			tracks.updateMixStatus(result);
		},

		/**
		 * Clear the ordering result
		 */
		clear() {
			set(null);
			tracks.clearMixStatus();
		}
	};
}

export const ordering = createOrderingStore();
