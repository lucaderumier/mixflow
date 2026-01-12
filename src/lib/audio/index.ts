/**
 * Audio Analysis Module
 *
 * Provides audio file analysis using Essentia.js WASM.
 * All CPU-intensive analysis runs in a Web Worker to prevent UI blocking.
 */

// Analyzer functions and types
export {
	analyzeTrack,
	analyzeFiles,
	initializeAnalyzer,
	isAnalyzerReady,
	terminateAnalyzer,
	AnalysisError,
	type AnalysisResult,
	type AnalysisProgress
} from './analyzer';

// Format validation utilities
export {
	isSupported,
	validateFile,
	validateFiles,
	formatFileSize,
	getExtension,
	isExtensionSupported,
	isMimeTypeSupported,
	MAX_FILE_SIZE,
	MAX_FILES,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MIME_TYPES,
	MIME_TYPES,
	type ValidationResult
} from './formats';

// Worker message types (for advanced usage)
export type {
	WorkerIncomingMessage,
	WorkerOutgoingMessage,
	AnalyzeMessage,
	InitMessage,
	ResultMessage,
	ErrorMessage,
	ReadyMessage
} from './worker-types';
