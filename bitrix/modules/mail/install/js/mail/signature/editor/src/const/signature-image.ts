export const SignatureImageAction = Object.freeze({
	Upload: 'mail.api.signatureimage.upload',
	Copy: 'mail.api.signatureimage.copy',
} as const);

export const SignatureImageError = Object.freeze({
	NotFound: 'SIGNATURE_IMAGE_NOT_FOUND',
	DiskUnavailable: 'SIGNATURE_IMAGE_DISK_UNAVAILABLE',
	UploadInvalid: 'SIGNATURE_IMAGE_UPLOAD_INVALID',
	UnsupportedFormat: 'SIGNATURE_IMAGE_UNSUPPORTED_FORMAT',
	ExtensionMismatch: 'SIGNATURE_IMAGE_EXTENSION_MISMATCH',
	InvalidDimensions: 'SIGNATURE_IMAGE_INVALID_DIMENSIONS',
	TooLarge: 'SIGNATURE_IMAGE_TOO_LARGE',
	PixelLimitExceeded: 'SIGNATURE_IMAGE_PIXEL_LIMIT_EXCEEDED',
	CountLimitExceeded: 'SIGNATURE_IMAGE_COUNT_LIMIT_EXCEEDED',
	TotalSizeLimitExceeded: 'SIGNATURE_IMAGE_TOTAL_SIZE_LIMIT_EXCEEDED',
	CopyFailed: 'SIGNATURE_IMAGE_COPY_FAILED',
	StorageFailed: 'SIGNATURE_IMAGE_STORAGE_FAILED',
	CreationLimitExceeded: 'SIGNATURE_IMAGE_CREATION_LIMIT_EXCEEDED',
	ResolveFailed: 'SIGNATURE_IMAGE_RESOLVE_FAILED',
} as const);

// These checks only provide early feedback. The server validates the copied bytes again.
export const SignatureImageClientLimit = Object.freeze({
	MaxFileSize: 2 * 1024 * 1024,
	MaxResourceCount: 10,
	MaxTotalSize: 5 * 1024 * 1024,
	MaxPixelCount: 20_000_000,
} as const);

export const SignatureImageVariant = Object.freeze({
	Small: 'small',
	Medium: 'medium',
	Original: 'original',
} as const);

export const SignatureImageVariantWidth = Object.freeze({
	Small: 160,
	Medium: 320,
	Original: 600,
} as const);
