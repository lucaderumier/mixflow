/**
 * Type declarations for Essentia.js modules
 */

// Essentia WASM module (ES module from npm package)
declare module 'essentia.js/dist/essentia-wasm.es.js' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export function EssentiaWASM(): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export default function (): Promise<any>;
}

// Essentia JS core module
declare module 'essentia.js/dist/essentia.js-core.es.js' {
	export interface EssentiaInstance {
		version: string;
		algorithmNames: string[];

		// Audio processing methods
		arrayToVector(array: Float32Array): unknown;
		vectorToArray(vector: unknown): Float32Array;

		// BPM Detection
		PercivalBpmEstimator(
			signal: Float32Array,
			frameSize?: number,
			frameSizeOSS?: number,
			hopSize?: number,
			hopSizeOSS?: number,
			maxBPM?: number,
			minBPM?: number,
			sampleRate?: number
		): { bpm: number };

		// Key Detection
		KeyExtractor(
			audio: Float32Array,
			averageDetuningCorrection?: boolean,
			frameSize?: number,
			hopSize?: number,
			hpcpSize?: number,
			maxFrequency?: number,
			maximumSpectralPeaks?: number,
			minFrequency?: number,
			pcpThreshold?: number,
			profileType?: string,
			sampleRate?: number,
			spectralPeaksThreshold?: number,
			tuningFrequency?: number,
			weightType?: string,
			windowType?: string
		): { key: string; scale: string; strength: number };

		// Lifecycle
		shutdown(): void;
		reinstantiate(): void;
		delete(): void;
	}

	export class Essentia implements EssentiaInstance {
		constructor(wasmModule: unknown, isDebug?: boolean);
		version: string;
		algorithmNames: string[];
		arrayToVector(array: Float32Array): unknown;
		vectorToArray(vector: unknown): Float32Array;
		PercivalBpmEstimator(
			signal: Float32Array,
			frameSize?: number,
			frameSizeOSS?: number,
			hopSize?: number,
			hopSizeOSS?: number,
			maxBPM?: number,
			minBPM?: number,
			sampleRate?: number
		): { bpm: number };
		KeyExtractor(
			audio: Float32Array,
			averageDetuningCorrection?: boolean,
			frameSize?: number,
			hopSize?: number,
			hpcpSize?: number,
			maxFrequency?: number,
			maximumSpectralPeaks?: number,
			minFrequency?: number,
			pcpThreshold?: number,
			profileType?: string,
			sampleRate?: number,
			spectralPeaksThreshold?: number,
			tuningFrequency?: number,
			weightType?: string,
			windowType?: string
		): { key: string; scale: string; strength: number };
		shutdown(): void;
		reinstantiate(): void;
		delete(): void;
	}

	// Default export is the Essentia class
	export default Essentia;
}
