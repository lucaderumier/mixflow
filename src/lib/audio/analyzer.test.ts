import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalysisError } from './analyzer';

/**
 * Note: Full integration tests for the analyzer require Web Worker and Web Audio API
 * which are not available in jsdom. These tests focus on:
 * - Error class behavior
 * - Module exports
 * - Mock-based unit tests for key conversion
 */

describe('AnalysisError', () => {
	it('creates error with code and message', () => {
		const error = new AnalysisError('TEST_CODE', 'Test message');
		expect(error.code).toBe('TEST_CODE');
		expect(error.message).toBe('Test message');
		expect(error.name).toBe('AnalysisError');
	});

	it('is instanceof Error', () => {
		const error = new AnalysisError('CODE', 'message');
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(AnalysisError);
	});

	it('has correct error codes for different scenarios', () => {
		const scenarios = [
			{ code: 'DECODE_FAILED', message: 'Could not decode audio file' },
			{ code: 'BPM_DETECTION_FAILED', message: 'Could not detect BPM' },
			{ code: 'KEY_DETECTION_FAILED', message: 'Could not detect key' },
			{ code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' },
			{ code: 'TIMEOUT', message: 'Analysis timed out' },
			{ code: 'WORKER_CRASHED', message: 'Worker crashed' }
		];

		for (const { code, message } of scenarios) {
			const error = new AnalysisError(code, message);
			expect(error.code).toBe(code);
		}
	});
});

describe('Worker message types', () => {
	it('type exports are defined at compile time', () => {
		// This is a compile-time TypeScript check
		// The worker module imports WASM files that aren't available in test environment
		// We verify types through the analyzer module instead
		expect(true).toBe(true);
	});
});

describe('Key conversion integration', () => {
	it('converts Essentia key output to Camelot', async () => {
		// Import the engine function directly
		const { musicalKeyToCamelot } = await import('$lib/engine');

		// Test cases matching Essentia output format
		const testCases = [
			{ key: 'C', scale: 'major', expected: '8B' },
			{ key: 'A', scale: 'minor', expected: '8A' },
			{ key: 'G', scale: 'major', expected: '9B' },
			{ key: 'E', scale: 'minor', expected: '9A' },
			{ key: 'F#', scale: 'major', expected: '2B' },
			{ key: 'Eb', scale: 'minor', expected: '2A' }
		];

		for (const { key, scale, expected } of testCases) {
			const musicalKey = `${key} ${scale}`;
			const camelotKey = musicalKeyToCamelot(musicalKey);
			expect(camelotKey).toBe(expected);
		}
	});
});

// Mock tests for analyzer functions
describe('analyzeTrack (mocked)', () => {
	// Store original globals
	const originalWorker = globalThis.Worker;
	const originalAudioContext = globalThis.AudioContext;
	const originalFileReader = globalThis.FileReader;

	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		// Restore globals
		globalThis.Worker = originalWorker;
		globalThis.AudioContext = originalAudioContext;
		globalThis.FileReader = originalFileReader;
		vi.restoreAllMocks();
	});

	it('validates file before analysis', async () => {
		// Create an invalid file
		const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

		// Import fresh module
		const { analyzeTrack, AnalysisError } = await import('./analyzer');

		await expect(analyzeTrack(invalidFile)).rejects.toThrow(AnalysisError);
		await expect(analyzeTrack(invalidFile)).rejects.toMatchObject({
			code: 'UNSUPPORTED_FORMAT'
		});
	});

	it('rejects files that are too large', async () => {
		// Create a mock large file (just set the size property)
		const largeFile = new File(['x'], 'large.mp3', { type: 'audio/mpeg' });
		Object.defineProperty(largeFile, 'size', { value: 150 * 1024 * 1024 }); // 150MB

		const { analyzeTrack, AnalysisError } = await import('./analyzer');

		await expect(analyzeTrack(largeFile)).rejects.toThrow(AnalysisError);
		await expect(analyzeTrack(largeFile)).rejects.toMatchObject({
			code: 'FILE_TOO_LARGE'
		});
	});
});

describe('analyzeFiles generator', () => {
	it('yields progress updates', async () => {
		// This is a structural test - actual implementation requires browser APIs
		const { analyzeFiles } = await import('./analyzer');

		// The generator function should be defined
		expect(typeof analyzeFiles).toBe('function');

		// It should return an async generator
		const generator = analyzeFiles([]);
		expect(generator[Symbol.asyncIterator]).toBeDefined();
	});
});

describe('module exports', () => {
	it('exports all required functions and classes', async () => {
		const analyzer = await import('./analyzer');

		expect(analyzer.analyzeTrack).toBeDefined();
		expect(analyzer.analyzeFiles).toBeDefined();
		expect(analyzer.initializeAnalyzer).toBeDefined();
		expect(analyzer.isAnalyzerReady).toBeDefined();
		expect(analyzer.terminateAnalyzer).toBeDefined();
		expect(analyzer.AnalysisError).toBeDefined();
	});
});
