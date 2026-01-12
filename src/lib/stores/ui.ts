/**
 * UI State Store
 *
 * Manages UI state like loading indicators, errors, and view modes.
 */

import { writable, derived } from 'svelte/store';

/**
 * Application view state
 */
export type ViewState = 'empty' | 'tracks' | 'ordered';

/**
 * Global loading state
 */
export const isLoading = writable(false);

/**
 * Loading message
 */
export const loadingMessage = writable('');

/**
 * Global error state
 */
export const globalError = writable<string | null>(null);

/**
 * Current view state
 */
export const viewState = writable<ViewState>('empty');

/**
 * Whether the WASM analyzer is ready
 */
export const analyzerReady = writable(false);

/**
 * Drag and drop state
 */
export const isDragging = writable(false);

/**
 * Set loading state with message
 */
export function setLoading(loading: boolean, message = '') {
	isLoading.set(loading);
	loadingMessage.set(message);
}

/**
 * Set global error
 */
export function setError(error: string | null) {
	globalError.set(error);
}

/**
 * Clear global error
 */
export function clearError() {
	globalError.set(null);
}

/**
 * Combined loading state for UI
 */
export const loadingState = derived(
	[isLoading, loadingMessage],
	([$isLoading, $loadingMessage]) => ({
		loading: $isLoading,
		message: $loadingMessage
	})
);
