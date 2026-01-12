/**
 * Worker Message Types
 *
 * Shared types for communication between main thread and audio worker.
 * Separated from worker.ts to allow importing without triggering WASM loading.
 */

/**
 * Message to analyze audio data
 */
export interface AnalyzeMessage {
	type: 'analyze';
	fileId: string;
	audioData: Float32Array;
	sampleRate: number;
}

/**
 * Message to initialize the worker
 */
export interface InitMessage {
	type: 'init';
}

/**
 * Message to analyze audio data with timing (debug mode)
 */
export interface DebugAnalyzeMessage {
	type: 'debug-analyze';
	fileId: string;
	audioData: Float32Array;
	sampleRate: number;
}

/**
 * Union of all incoming message types
 */
export type WorkerIncomingMessage = AnalyzeMessage | InitMessage | DebugAnalyzeMessage;

/**
 * Successful analysis result message
 */
export interface ResultMessage {
	type: 'result';
	fileId: string;
	bpm: number;
	key: string;
	scale: string;
}

/**
 * Error message
 */
export interface ErrorMessage {
	type: 'error';
	fileId: string;
	code: string;
	message: string;
}

/**
 * Worker ready notification
 */
export interface ReadyMessage {
	type: 'ready';
}

/**
 * Debug result with timing breakdown
 */
export interface DebugResultMessage {
	type: 'debug-result';
	fileId: string;
	bpm: number;
	key: string;
	scale: string;
	timing: {
		bpmStart: number;
		bpmEnd: number;
		bpmDuration: number;
		keyStart: number;
		keyEnd: number;
		keyDuration: number;
	};
}

/**
 * Union of all outgoing message types
 */
export type WorkerOutgoingMessage = ResultMessage | ErrorMessage | ReadyMessage | DebugResultMessage;
