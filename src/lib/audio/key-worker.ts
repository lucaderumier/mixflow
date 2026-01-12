/**
 * Audio Analysis Web Worker
 *
 * Runs Essentia.js algorithms off the main thread for:
 * - BPM detection (RhythmExtractor2013)
 * - Key detection (KeyExtractor)
 */

export interface KeyAnalyzeMessage {
	type: 'analyze';
	fileId: string;
	audioData: Float32Array;
	sampleRate: number;
}

export interface KeyInitMessage {
	type: 'init';
}

export type KeyWorkerIncomingMessage = KeyAnalyzeMessage | KeyInitMessage;

export interface KeyResultMessage {
	type: 'result';
	fileId: string;
	bpm: number;
	key: string;
	scale: string;
}

export interface KeyErrorMessage {
	type: 'error';
	fileId: string;
	code: string;
	message: string;
}

export interface KeyReadyMessage {
	type: 'ready';
}

export type KeyWorkerOutgoingMessage = KeyResultMessage | KeyErrorMessage | KeyReadyMessage;

// Essentia instance (lazy loaded)
let essentia: unknown = null;
let isInitialized = false;
let isInitializing = false;

/**
 * Initialize Essentia WASM module (only KeyExtractor needed)
 */
async function initEssentia(): Promise<void> {
	if (isInitialized || isInitializing) return;
	isInitializing = true;

	try {
		// Import Essentia modules
		// The WASM module exports EssentiaWASM which is the Module object (not a factory function)
		// We need to use the UMD version which properly exports EssentiaWASM
		const EssentiaWASMModule = await import('essentia.js/dist/essentia-wasm.umd.js');
		const EssentiaWASM = EssentiaWASMModule.EssentiaWASM;

		const EssentiaCore = await import('essentia.js/dist/essentia.js-core.es.js');
		const Essentia = EssentiaCore.default;

		// EssentiaWASM is already the initialized Module object, not a factory function
		// We pass it directly to the Essentia constructor
		essentia = new Essentia(EssentiaWASM);
		isInitialized = true;

		self.postMessage({ type: 'ready' } satisfies KeyReadyMessage);
	} catch (error) {
		isInitializing = false;
		const message = error instanceof Error ? error.message : 'Unknown error';
		self.postMessage({
			type: 'error',
			fileId: '',
			code: 'INIT_FAILED',
			message: `Failed to initialize Essentia: ${message}`
		} satisfies KeyErrorMessage);
	}
}

/** BPM range for DJ music - values outside this range will be doubled/halved */
const MIN_BPM = 70;
const MAX_BPM = 180;

/**
 * Normalize BPM to fall within the expected DJ range (70-180 BPM).
 */
function normalizeBpm(bpm: number): number {
	while (bpm < MIN_BPM && bpm > 0) {
		bpm *= 2;
	}
	while (bpm > MAX_BPM) {
		bpm /= 2;
	}
	return bpm;
}

/**
 * Analyze audio data for BPM and key
 */
function analyzeAudio(fileId: string, audioData: Float32Array, sampleRate: number): void {
	if (!essentia || !isInitialized) {
		self.postMessage({
			type: 'error',
			fileId,
			code: 'NOT_INITIALIZED',
			message: 'Essentia is not initialized'
		} satisfies KeyErrorMessage);
		return;
	}

	try {
		// Essentia.js requires audio data to be converted to VectorFloat format
		const essentiaInstance = essentia as {
			arrayToVector: (array: Float32Array) => unknown;
			RhythmExtractor2013: (
				audio: unknown,
				maxTempo?: number,
				method?: string,
				minTempo?: number
			) => {
				bpm: number;
				ticks: unknown;
				confidence: number;
				estimates: unknown;
				bpmIntervals: unknown;
			};
			KeyExtractor: (
				audio: unknown,
				averageDetuningCorrection?: boolean,
				frameSize?: number,
				hopSize?: number,
				hpcpSize?: number,
				maxFrequency?: number,
				maximumSpectralPeaks?: number,
				minFrequency?: number,
				pcpThreshold?: number,
				profileType?: string,
				sampleRate?: number
			) => { key: string; scale: string; strength: number };
		};

		// Convert Float32Array to Essentia's VectorFloat format
		const audioVector = essentiaInstance.arrayToVector(audioData);

		// Detect BPM using RhythmExtractor2013 with multifeature method (more accurate)
		// Use wide tempo range and normalize after for DJ-friendly values
		const rhythmResult = essentiaInstance.RhythmExtractor2013(
			audioVector,
			250, // maxTempo (wide range for detection)
			'multifeature', // method - more accurate than 'degara'
			40 // minTempo (wide range for detection)
		);

		// Normalize BPM to DJ-friendly range
		const normalizedBpm = normalizeBpm(rhythmResult.bpm);

		// Detect key using KeyExtractor with 'temperley' profile (better for general music)
		// 'edma' is for electronic, 'temperley' works better across genres
		const keyResult = essentiaInstance.KeyExtractor(
			audioVector,
			true, // averageDetuningCorrection
			4096, // frameSize
			4096, // hopSize
			12, // hpcpSize
			3500, // maxFrequency
			60, // maximumSpectralPeaks
			25, // minFrequency
			0.2, // pcpThreshold
			'temperley', // profileType - better general accuracy than 'edma'
			sampleRate
		);

		self.postMessage({
			type: 'result',
			fileId,
			bpm: Math.round(normalizedBpm),
			key: keyResult.key,
			scale: keyResult.scale
		} satisfies KeyResultMessage);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		self.postMessage({
			type: 'error',
			fileId,
			code: 'ANALYSIS_FAILED',
			message: `Audio analysis failed: ${message}`
		} satisfies KeyErrorMessage);
	}
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<KeyWorkerIncomingMessage>) => {
	const message = event.data;

	switch (message.type) {
		case 'init':
			initEssentia();
			break;

		case 'analyze':
			if (!isInitialized && !isInitializing) {
				initEssentia().then(() => {
					if (isInitialized) {
						analyzeAudio(message.fileId, message.audioData, message.sampleRate);
					}
				});
			} else if (isInitialized) {
				analyzeAudio(message.fileId, message.audioData, message.sampleRate);
			} else {
				// Wait for initialization to complete, then analyze
				const checkAndAnalyze = () => {
					if (isInitialized) {
						analyzeAudio(message.fileId, message.audioData, message.sampleRate);
					} else if (isInitializing) {
						setTimeout(checkAndAnalyze, 50);
					}
				};
				checkAndAnalyze();
			}
			break;
	}
};

// Auto-initialize when worker loads
initEssentia();
