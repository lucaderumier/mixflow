/**
 * Audio Format Utilities
 *
 * Validation and utilities for supported audio file formats.
 */

/** Maximum file size in bytes (100MB) */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Maximum number of files that can be processed at once */
export const MAX_FILES = 50;

/** Supported audio file extensions */
export const SUPPORTED_EXTENSIONS = [
	'.mp3',
	'.wav',
	'.aiff',
	'.aif',
	'.flac',
	'.ogg',
	'.m4a'
] as const;

/** Map of file extensions to MIME types */
export const MIME_TYPES: Record<string, string> = {
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.aiff': 'audio/aiff',
	'.aif': 'audio/aiff',
	'.flac': 'audio/flac',
	'.ogg': 'audio/ogg',
	'.m4a': 'audio/mp4'
};

/** Valid MIME types for audio files */
export const SUPPORTED_MIME_TYPES = [
	'audio/mpeg',
	'audio/wav',
	'audio/wave',
	'audio/x-wav',
	'audio/aiff',
	'audio/x-aiff',
	'audio/flac',
	'audio/x-flac',
	'audio/ogg',
	'audio/mp4',
	'audio/x-m4a'
] as const;

/**
 * Get the file extension from a filename (lowercase, with dot).
 *
 * @param filename - The filename to extract extension from
 * @returns The extension (e.g., ".mp3") or empty string if none
 */
export function getExtension(filename: string): string {
	const lastDot = filename.lastIndexOf('.');
	if (lastDot === -1 || lastDot === filename.length - 1) {
		return '';
	}
	return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if a file extension is supported.
 *
 * @param extension - File extension including dot (e.g., ".mp3")
 * @returns True if the extension is supported
 */
export function isExtensionSupported(extension: string): boolean {
	return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension.toLowerCase());
}

/**
 * Check if a MIME type is supported.
 *
 * @param mimeType - MIME type string
 * @returns True if the MIME type is supported
 */
export function isMimeTypeSupported(mimeType: string): boolean {
	return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
}

/**
 * Check if a file is a supported audio format.
 * Checks both extension and MIME type.
 *
 * @param file - The File object to check
 * @returns True if the file format is supported
 */
export function isSupported(file: File): boolean {
	const extension = getExtension(file.name);

	// Check extension first (more reliable)
	if (extension && isExtensionSupported(extension)) {
		return true;
	}

	// Fall back to MIME type check
	if (file.type && isMimeTypeSupported(file.type)) {
		return true;
	}

	return false;
}

/**
 * Validation result for a file.
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
	errorCode?: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE';
}

/**
 * Validate a file for processing.
 * Checks format and size constraints.
 *
 * @param file - The File object to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): ValidationResult {
	// Check format first
	if (!isSupported(file)) {
		const extension = getExtension(file.name) || 'unknown';
		return {
			valid: false,
			error: `Unsupported file format: ${extension}. Supported formats: MP3, WAV, AIFF, FLAC, OGG, M4A.`,
			errorCode: 'UNSUPPORTED_FORMAT'
		};
	}

	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		return {
			valid: false,
			error: `File too large: ${sizeMB}MB. Maximum size is 100MB.`,
			errorCode: 'FILE_TOO_LARGE'
		};
	}

	return { valid: true };
}

/**
 * Validate multiple files for processing.
 *
 * @param files - Array of File objects to validate
 * @returns Object with valid files and any errors
 */
export function validateFiles(files: File[]): {
	validFiles: File[];
	errors: Array<{ file: File; error: string }>;
	tooManyFiles: boolean;
} {
	const validFiles: File[] = [];
	const errors: Array<{ file: File; error: string }> = [];
	const tooManyFiles = files.length > MAX_FILES;

	// Only process up to MAX_FILES
	const filesToProcess = files.slice(0, MAX_FILES);

	for (const file of filesToProcess) {
		const result = validateFile(file);
		if (result.valid) {
			validFiles.push(file);
		} else {
			errors.push({ file, error: result.error! });
		}
	}

	return { validFiles, errors, tooManyFiles };
}

/**
 * Format file size for display.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "15.2 MB")
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
