export const DATASET_NAME_MAX_LENGTH = 30;

const DATASET_NAME_PATTERN = /^[a-z][\d_a-z]*$/;

export type DatasetNameError = 'required' | 'tooLong' | 'badFormat' | 'reserved';

export function getDatasetNameError(
	value?: string | null,
	reservedNames: Array<string> = [],
): DatasetNameError | null
{
	const trimmed = String(value ?? '').trim();
	if (!trimmed)
	{
		return 'required';
	}

	if (trimmed.length > DATASET_NAME_MAX_LENGTH)
	{
		return 'tooLong';
	}

	if (!DATASET_NAME_PATTERN.test(trimmed))
	{
		return 'badFormat';
	}

	if (reservedNames.includes(trimmed))
	{
		return 'reserved';
	}

	return null;
}

export function hasDatasetNameError(value?: string | null, reservedNames: Array<string> = []): boolean
{
	return getDatasetNameError(value, reservedNames) !== null;
}
