/**
 * Audio Analyzer
 *
 * Main interface for audio analysis.
 * Uses Essentia.js in a dedicated Web Worker for both BPM and key detection.
 */

import { v4 as uuidv4 } from 'uuid';
import { musicalKeyToCamelot } from '$lib/engine';
import type { CamelotKey, MusicalKey } from '$lib/engine';
import { validateFile } from './formats';
import type {
	KeyWorkerIncomingMessage,
	KeyWorkerOutgoingMessage,
	KeyResultMessage,
	KeyErrorMessage
} from './key-worker';

/** Analysis timeout in milliseconds (5 minutes for longer files) */
const ANALYSIS_TIMEOUT = 300000;

/**
 * Result of analyzing a single audio track
 */
export interface AnalysisResult {
	bpm: number;
	key: MusicalKey;
	camelotKey: CamelotKey | null;
	duration: number;
}

/**
 * Error thrown when analysis fails
 */
export class AnalysisError extends Error {
	code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = 'AnalysisError';
		this.code = code;
	}
}

// Key detection worker (singleton)
let keyWorker: Worker | null = null;
let keyWorkerReady = false;
let keyWorkerReadyPromise: Promise<void> | null = null;

// Pending analysis requests (now includes BPM)
const pendingAnalysisRequests = new Map<
	string,
	{
		resolve: (result: { bpm: number; key: string; scale: string }) => void;
		reject: (error: AnalysisError) => void;
		timeoutId: ReturnType<typeof setTimeout>;
	}
>();

/**
 * Create and initialize the audio analysis Web Worker.
 */
function createAnalysisWorker(): Promise<void> {
	if (keyWorkerReadyPromise) {
		return keyWorkerReadyPromise;
	}

	keyWorkerReadyPromise = new Promise((resolve, reject) => {
		try {
			keyWorker = new Worker(new URL('./key-worker.ts', import.meta.url), {
				type: 'module'
			});

			keyWorker.onmessage = (event: MessageEvent<KeyWorkerOutgoingMessage>) => {
				const message = event.data;

				switch (message.type) {
					case 'ready':
						keyWorkerReady = true;
						resolve();
						break;

					case 'result':
						handleAnalysisResult(message);
						break;

					case 'error':
						handleAnalysisError(message);
						break;
				}
			};

			keyWorker.onerror = (error) => {
				const analysisError = new AnalysisError(
					'WORKER_CRASHED',
					`Analysis worker error: ${error.message}`
				);

				for (const [fileId, request] of pendingAnalysisRequests) {
					clearTimeout(request.timeoutId);
					request.reject(analysisError);
					pendingAnalysisRequests.delete(fileId);
				}

				keyWorkerReady = false;
				keyWorkerReadyPromise = null;
				keyWorker = null;

				reject(analysisError);
			};

			keyWorker.postMessage({ type: 'init' } satisfies KeyWorkerIncomingMessage);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			reject(new AnalysisError('WORKER_INIT_FAILED', message));
		}
	});

	return keyWorkerReadyPromise;
}

/**
 * Handle successful analysis result from worker
 */
function handleAnalysisResult(message: KeyResultMessage): void {
	const request = pendingAnalysisRequests.get(message.fileId);
	if (!request) return;

	clearTimeout(request.timeoutId);
	pendingAnalysisRequests.delete(message.fileId);

	request.resolve({
		bpm: message.bpm,
		key: message.key,
		scale: message.scale
	});
}

/**
 * Handle error from analysis worker
 */
function handleAnalysisError(message: KeyErrorMessage): void {
	if (!message.fileId) {
		console.error('Analysis worker initialization error:', message.message);
		return;
	}

	const request = pendingAnalysisRequests.get(message.fileId);
	if (request) {
		clearTimeout(request.timeoutId);
		pendingAnalysisRequests.delete(message.fileId);
		request.reject(new AnalysisError(message.code, message.message));
	}
}

/**
 * Read a file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = () => reject(new AnalysisError('READ_FAILED', 'Failed to read file'));
		reader.readAsArrayBuffer(file);
	});
}

/**
 * Decode audio file to AudioBuffer using Web Audio API
 */
async function decodeAudio(
	arrayBuffer: ArrayBuffer
): Promise<{ audioBuffer: AudioBuffer; audioContext: AudioContext }> {
	const audioContext = new AudioContext();

	try {
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
		return { audioBuffer, audioContext };
	} catch {
		audioContext.close();
		throw new AnalysisError(
			'DECODE_FAILED',
			'Could not decode audio file. It may be corrupted or in an unsupported format.'
		);
	}
}

/**
 * Convert AudioBuffer to mono Float32Array
 */
function audioBufferToMono(audioBuffer: AudioBuffer): Float32Array {
	const numberOfChannels = audioBuffer.numberOfChannels;

	if (numberOfChannels === 1) {
		return audioBuffer.getChannelData(0);
	}

	const length = audioBuffer.length;
	const mono = new Float32Array(length);
	const channels: Float32Array[] = [];

	for (let i = 0; i < numberOfChannels; i++) {
		channels.push(audioBuffer.getChannelData(i));
	}

	for (let i = 0; i < length; i++) {
		let sum = 0;
		for (let ch = 0; ch < numberOfChannels; ch++) {
			sum += channels[ch][i];
		}
		mono[i] = sum / numberOfChannels;
	}

	return mono;
}


/**
 * Analyze audio (BPM and key) using the Essentia.js worker
 */
async function analyzeAudio(
	audioData: Float32Array,
	sampleRate: number
): Promise<{ bpm: number; key: string; scale: string }> {
	await createAnalysisWorker();

	const fileId = uuidv4();

	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			pendingAnalysisRequests.delete(fileId);
			reject(new AnalysisError('ANALYSIS_TIMEOUT', 'Audio analysis timed out'));
		}, ANALYSIS_TIMEOUT);

		pendingAnalysisRequests.set(fileId, {
			resolve,
			reject,
			timeoutId
		});

		// Clone the audio data since we transfer it
		const audioDataCopy = new Float32Array(audioData);

		keyWorker!.postMessage(
			{
				type: 'analyze',
				fileId,
				audioData: audioDataCopy,
				sampleRate
			} satisfies KeyWorkerIncomingMessage,
			[audioDataCopy.buffer]
		);
	});
}

/**
 * Initialize the audio analyzer.
 * Pre-loads the Essentia.js WASM module.
 */
export async function initializeAnalyzer(): Promise<void> {
	await createAnalysisWorker();
}

/**
 * Check if the analyzer is ready for use
 */
export function isAnalyzerReady(): boolean {
	return keyWorkerReady;
}

/**
 * Analyze a single audio file.
 *
 * @param file - The audio File object to analyze
 * @returns Promise resolving to analysis results
 * @throws AnalysisError if analysis fails
 */
export async function analyzeTrack(file: File): Promise<AnalysisResult> {
	// Validate file first
	const validation = validateFile(file);
	if (!validation.valid) {
		throw new AnalysisError(validation.errorCode!, validation.error!);
	}

	// Read and decode the file
	const arrayBuffer = await readFileAsArrayBuffer(file);
	const { audioBuffer, audioContext } = await decodeAudio(arrayBuffer);

	const duration = audioBuffer.duration;
	const sampleRate = audioBuffer.sampleRate;

	// Convert to mono for analysis
	const monoAudio = audioBufferToMono(audioBuffer);

	// Close audio context after we're done extracting data
	audioContext.close();

	// Run analysis (BPM + key in worker)
	const result = await analyzeAudio(monoAudio, sampleRate);

	// Convert key to standard notation and Camelot
	const key: MusicalKey = `${result.key} ${result.scale}`;
	const camelotKey = musicalKeyToCamelot(key);

	return {
		bpm: result.bpm,
		key,
		camelotKey,
		duration
	};
}

/**
 * Progress update during batch analysis
 */
export interface AnalysisProgress {
	fileId: string;
	filename: string;
	status: 'analyzing' | 'complete' | 'error';
	result?: AnalysisResult;
	error?: string;
	current: number;
	total: number;
}

/**
 * Analyze multiple files with progress updates.
 *
 * @param files - Array of File objects to analyze
 * @yields Progress updates for each file
 */
export async function* analyzeFiles(files: File[]): AsyncGenerator<AnalysisProgress> {
	const total = files.length;

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fileId = uuidv4();

		yield {
			fileId,
			filename: file.name,
			status: 'analyzing',
			current: i + 1,
			total
		};

		try {
			const result = await analyzeTrack(file);

			yield {
				fileId,
				filename: file.name,
				status: 'complete',
				result,
				current: i + 1,
				total
			};
		} catch (error) {
			const errorMessage =
				error instanceof AnalysisError ? error.message : 'Unknown error';

			yield {
				fileId,
				filename: file.name,
				status: 'error',
				error: errorMessage,
				current: i + 1,
				total
			};
		}
	}
}

/**
 * Terminate the analyzer and clean up resources.
 */
export function terminateAnalyzer(): void {
	if (keyWorker) {
		for (const [, request] of pendingAnalysisRequests) {
			clearTimeout(request.timeoutId);
			request.reject(new AnalysisError('TERMINATED', 'Analyzer was terminated'));
		}
		pendingAnalysisRequests.clear();

		keyWorker.terminate();
		keyWorker = null;
		keyWorkerReady = false;
		keyWorkerReadyPromise = null;
	}
}

// Re-export utilities for backwards compatibility
export { readFileAsArrayBuffer, audioBufferToMono };

// Legacy exports for debug-analyzer compatibility
export type { DebugResultMessage } from './worker-types';

/**
 * Decode audio with a timeout (for debug purposes)
 */
export async function decodeAudioWithTimeout(
	arrayBuffer: ArrayBuffer,
	timeoutMs: number
): Promise<{ audioBuffer: AudioBuffer; audioContext: AudioContext }> {
	const audioContext = new AudioContext();

	const decodePromise = audioContext.decodeAudioData(arrayBuffer);
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new AnalysisError('DECODE_TIMEOUT', `Audio decoding timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		const audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
		return { audioBuffer, audioContext };
	} catch (error) {
		audioContext.close();
		throw error;
	}
}

/**
 * Send debug analysis (legacy - now simplified)
 */
export async function sendDebugAnalysis(
	audioData: Float32Array,
	sampleRate: number,
	_timeout: number = ANALYSIS_TIMEOUT
): Promise<import('./worker-types').DebugResultMessage> {
	const analysisStart = performance.now();
	let bpm = 0;
	let key = '';
	let scale = '';

	try {
		const result = await analyzeAudio(audioData, sampleRate);
		bpm = result.bpm;
		key = result.key;
		scale = result.scale;
	} catch {
		// Ignore errors in debug mode
	}

	const analysisEnd = performance.now();
	const analysisDuration = analysisEnd - analysisStart;

	return {
		type: 'debug-result',
		fileId: 'debug',
		bpm,
		key,
		scale,
		timing: {
			bpmStart: analysisStart,
			bpmEnd: analysisEnd,
			bpmDuration: analysisDuration,
			keyStart: analysisStart,
			keyEnd: analysisEnd,
			keyDuration: analysisDuration
		}
	};
}
