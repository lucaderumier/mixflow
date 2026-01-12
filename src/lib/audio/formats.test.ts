import { describe, it, expect } from 'vitest';
import {
	getExtension,
	isExtensionSupported,
	isMimeTypeSupported,
	isSupported,
	validateFile,
	validateFiles,
	formatFileSize,
	MAX_FILE_SIZE,
	MAX_FILES,
	SUPPORTED_EXTENSIONS
} from './formats';

/**
 * Helper to create a mock File object
 */
function createMockFile(
	name: string,
	size: number = 1024,
	type: string = 'audio/mpeg'
): File {
	const content = new Uint8Array(size);
	return new File([content], name, { type });
}

describe('getExtension', () => {
	it('extracts extension from filename', () => {
		expect(getExtension('song.mp3')).toBe('.mp3');
		expect(getExtension('track.wav')).toBe('.wav');
		expect(getExtension('audio.flac')).toBe('.flac');
	});

	it('handles uppercase extensions', () => {
		expect(getExtension('song.MP3')).toBe('.mp3');
		expect(getExtension('track.WAV')).toBe('.wav');
	});

	it('handles files with multiple dots', () => {
		expect(getExtension('my.song.v2.mp3')).toBe('.mp3');
		expect(getExtension('file.name.with.dots.wav')).toBe('.wav');
	});

	it('returns empty string for files without extension', () => {
		expect(getExtension('noextension')).toBe('');
		expect(getExtension('filename.')).toBe('');
	});

	it('handles hidden files', () => {
		expect(getExtension('.hidden')).toBe('.hidden');
	});
});

describe('isExtensionSupported', () => {
	it('returns true for supported extensions', () => {
		expect(isExtensionSupported('.mp3')).toBe(true);
		expect(isExtensionSupported('.wav')).toBe(true);
		expect(isExtensionSupported('.aiff')).toBe(true);
		expect(isExtensionSupported('.aif')).toBe(true);
		expect(isExtensionSupported('.flac')).toBe(true);
		expect(isExtensionSupported('.ogg')).toBe(true);
		expect(isExtensionSupported('.m4a')).toBe(true);
	});

	it('is case insensitive', () => {
		expect(isExtensionSupported('.MP3')).toBe(true);
		expect(isExtensionSupported('.WAV')).toBe(true);
		expect(isExtensionSupported('.FLAC')).toBe(true);
	});

	it('returns false for unsupported extensions', () => {
		expect(isExtensionSupported('.txt')).toBe(false);
		expect(isExtensionSupported('.pdf')).toBe(false);
		expect(isExtensionSupported('.mp4')).toBe(false);
		expect(isExtensionSupported('.wma')).toBe(false);
	});
});

describe('isMimeTypeSupported', () => {
	it('returns true for supported MIME types', () => {
		expect(isMimeTypeSupported('audio/mpeg')).toBe(true);
		expect(isMimeTypeSupported('audio/wav')).toBe(true);
		expect(isMimeTypeSupported('audio/flac')).toBe(true);
		expect(isMimeTypeSupported('audio/ogg')).toBe(true);
		expect(isMimeTypeSupported('audio/mp4')).toBe(true);
	});

	it('handles alternative MIME types', () => {
		expect(isMimeTypeSupported('audio/wave')).toBe(true);
		expect(isMimeTypeSupported('audio/x-wav')).toBe(true);
		expect(isMimeTypeSupported('audio/aiff')).toBe(true);
		expect(isMimeTypeSupported('audio/x-aiff')).toBe(true);
		expect(isMimeTypeSupported('audio/x-flac')).toBe(true);
		expect(isMimeTypeSupported('audio/x-m4a')).toBe(true);
	});

	it('returns false for unsupported MIME types', () => {
		expect(isMimeTypeSupported('text/plain')).toBe(false);
		expect(isMimeTypeSupported('video/mp4')).toBe(false);
		expect(isMimeTypeSupported('application/pdf')).toBe(false);
	});
});

describe('isSupported', () => {
	it('returns true for files with supported extensions', () => {
		for (const ext of SUPPORTED_EXTENSIONS) {
			const file = createMockFile(`test${ext}`, 1024, '');
			expect(isSupported(file)).toBe(true);
		}
	});

	it('returns true for files with supported MIME types', () => {
		const file = createMockFile('noextension', 1024, 'audio/mpeg');
		expect(isSupported(file)).toBe(true);
	});

	it('returns false for unsupported files', () => {
		const txtFile = createMockFile('document.txt', 1024, 'text/plain');
		expect(isSupported(txtFile)).toBe(false);

		const pdfFile = createMockFile('document.pdf', 1024, 'application/pdf');
		expect(isSupported(pdfFile)).toBe(false);
	});

	it('prioritizes extension over MIME type', () => {
		// File with audio extension but wrong MIME type should still be supported
		const file = createMockFile('song.mp3', 1024, 'application/octet-stream');
		expect(isSupported(file)).toBe(true);
	});
});

describe('validateFile', () => {
	it('returns valid for supported formats under size limit', () => {
		const file = createMockFile('song.mp3', 1024);
		const result = validateFile(file);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('returns error for unsupported format', () => {
		const file = createMockFile('document.txt', 1024, 'text/plain');
		const result = validateFile(file);
		expect(result.valid).toBe(false);
		expect(result.errorCode).toBe('UNSUPPORTED_FORMAT');
		expect(result.error).toContain('Unsupported file format');
	});

	it('returns error for files exceeding size limit', () => {
		const largeFile = createMockFile('large.mp3', MAX_FILE_SIZE + 1);
		const result = validateFile(largeFile);
		expect(result.valid).toBe(false);
		expect(result.errorCode).toBe('FILE_TOO_LARGE');
		expect(result.error).toContain('File too large');
	});

	it('accepts files exactly at size limit', () => {
		const exactFile = createMockFile('exact.mp3', MAX_FILE_SIZE);
		const result = validateFile(exactFile);
		expect(result.valid).toBe(true);
	});
});

describe('validateFiles', () => {
	it('separates valid and invalid files', () => {
		const files = [
			createMockFile('song1.mp3', 1024),
			createMockFile('document.txt', 1024, 'text/plain'),
			createMockFile('song2.wav', 1024)
		];

		const result = validateFiles(files);
		expect(result.validFiles).toHaveLength(2);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].file.name).toBe('document.txt');
	});

	it('sets tooManyFiles flag when exceeding limit', () => {
		const files = Array.from({ length: MAX_FILES + 5 }, (_, i) =>
			createMockFile(`song${i}.mp3`, 1024)
		);

		const result = validateFiles(files);
		expect(result.tooManyFiles).toBe(true);
		// Should still process first MAX_FILES
		expect(result.validFiles).toHaveLength(MAX_FILES);
	});

	it('returns empty arrays for empty input', () => {
		const result = validateFiles([]);
		expect(result.validFiles).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
		expect(result.tooManyFiles).toBe(false);
	});
});

describe('formatFileSize', () => {
	it('formats bytes', () => {
		expect(formatFileSize(500)).toBe('500 B');
		expect(formatFileSize(0)).toBe('0 B');
	});

	it('formats kilobytes', () => {
		expect(formatFileSize(1024)).toBe('1.0 KB');
		expect(formatFileSize(1536)).toBe('1.5 KB');
		expect(formatFileSize(10240)).toBe('10.0 KB');
	});

	it('formats megabytes', () => {
		expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
		expect(formatFileSize(15.5 * 1024 * 1024)).toBe('15.5 MB');
		expect(formatFileSize(100 * 1024 * 1024)).toBe('100.0 MB');
	});
});

describe('constants', () => {
	it('has correct MAX_FILE_SIZE (100MB)', () => {
		expect(MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
	});

	it('has correct MAX_FILES (50)', () => {
		expect(MAX_FILES).toBe(50);
	});

	it('has all expected extensions', () => {
		expect(SUPPORTED_EXTENSIONS).toContain('.mp3');
		expect(SUPPORTED_EXTENSIONS).toContain('.wav');
		expect(SUPPORTED_EXTENSIONS).toContain('.aiff');
		expect(SUPPORTED_EXTENSIONS).toContain('.aif');
		expect(SUPPORTED_EXTENSIONS).toContain('.flac');
		expect(SUPPORTED_EXTENSIONS).toContain('.ogg');
		expect(SUPPORTED_EXTENSIONS).toContain('.m4a');
	});
});
