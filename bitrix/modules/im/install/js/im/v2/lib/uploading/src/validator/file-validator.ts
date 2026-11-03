import { Type } from 'main.core';

import { type ValueOf } from '../types/uploading';

// Shared error codes with server (ERR-01). Keep in sync with CopilotError.
export const FileValidationError = {
	INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
	FILE_TOO_LARGE: 'FILE_TOO_LARGE',
	TOO_MANY_FILES: 'TOO_MANY_FILES',
	DUPLICATE_FILE: 'DUPLICATE_FILE',
} as const;

export type FileUploadPolicy = {
	allowedExtensions: string[],
	maxFileSize: number,
	maxFilesPerMessage: number,
};

export type FileLike = {
	name: string,
	size: number,
};

export type ValidationError = {
	file: FileLike,
	code: ValueOf<typeof FileValidationError>,
};

export type AnnotatedFile<T> = {
	file: T,
	code: ValueOf<typeof FileValidationError> | null,
};

export type ValidationResult<T> = {
	valid: T[],
	errors: ValidationError[],
	annotated: AnnotatedFile<T>[],
};

export function matchExtension(fileName: string, allowedExtensions: string[]): boolean
{
	if (!Type.isStringFilled(fileName) || !Type.isArrayFilled(allowedExtensions))
	{
		return false;
	}

	const dotIndex = fileName.lastIndexOf('.');
	if (dotIndex <= 0 || dotIndex === fileName.length - 1)
	{
		return false;
	}

	const ext = fileName.slice(dotIndex + 1).toLowerCase();

	return allowedExtensions.includes(ext);
}

export function matchSize(size: number, maxFileSize: number): boolean
{
	if (!Type.isNumber(size) || !Type.isNumber(maxFileSize))
	{
		return false;
	}

	return size <= maxFileSize;
}

export function matchCount(currentCount: number, addingCount: number, maxFilesPerMessage: number): boolean
{
	return (currentCount + addingCount) <= maxFilesPerMessage;
}

function isDuplicate(file: FileLike, existing: FileLike[]): boolean
{
	return existing.some((item: FileLike) => item.name === file.name && item.size === file.size);
}

function resolveVerdict(file: FileLike, policy: FileUploadPolicy): ValueOf<typeof FileValidationError> | null
{
	if (!matchExtension(file.name, policy.allowedExtensions))
	{
		return FileValidationError.INVALID_FILE_FORMAT;
	}

	if (!matchSize(file.size, policy.maxFileSize))
	{
		return FileValidationError.FILE_TOO_LARGE;
	}

	return null;
}

export function validateFileList<T extends FileLike>(
	files: T[],
	existing: FileLike[],
	policy: FileUploadPolicy | null,
): ValidationResult<T>
{
	const valid: T[] = [];
	const errors: ValidationError[] = [];
	const annotated: AnnotatedFile<T>[] = [];

	if (!policy)
	{
		return {
			valid: [...files],
			errors,
			annotated: files.map((file: T) => ({ file, code: null })),
		};
	}

	const capacity = Math.max(0, policy.maxFilesPerMessage - existing.length);
	const accepted: T[] = [];

	for (const file of files)
	{
		if (isDuplicate(file, [...existing, ...accepted]))
		{
			errors.push({ file, code: FileValidationError.DUPLICATE_FILE });
			continue;
		}

		if (accepted.length >= capacity)
		{
			errors.push({ file, code: FileValidationError.TOO_MANY_FILES });
			continue;
		}

		const code = resolveVerdict(file, policy);

		accepted.push(file);
		annotated.push({ file, code });

		if (code)
		{
			errors.push({ file, code });
		}
		else
		{
			valid.push(file);
		}
	}

	return { valid, errors, annotated };
}
