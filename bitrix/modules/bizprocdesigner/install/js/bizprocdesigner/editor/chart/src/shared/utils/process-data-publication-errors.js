import { Type } from 'main.core';

import type { ProcessDataSelector } from '../types';

const UNRESOLVED_REFERENCE_CODE = 'PROCESS_DATA_UNRESOLVED_REFERENCE';

const SELECTABLE_ELEMENT_ERROR_CODES: $ReadOnlyArray<string> = Object.freeze([
	'PROCESS_DATA_KEY_INVALID',
	'PROCESS_DATA_KEY_DUPLICATE',
	'PROCESS_DATA_PAIR_MISMATCH',
	'PROCESS_DATA_TYPE_UNSUPPORTED',
]);

const BLOCK_SOURCE_TYPES: { [string]: string } = Object.freeze({
	PARAMETERS: 'Parameter',
	VARIABLES: 'Variable',
	CONSTANTS: 'Constant',
});

export type ProcessDataPublicationError = {
	code: string;
	message: string;
	select: ProcessDataSelector | null;
};

function readSelect(customData: ?Object): ProcessDataSelector | null
{
	const key = customData?.key;
	const sourceType = BLOCK_SOURCE_TYPES[customData?.blocks?.[0]];

	if (!Type.isStringFilled(key) || !Type.isStringFilled(sourceType))
	{
		return null;
	}

	return { sourceType, key };
}

// An unresolved reference names a key no element carries, so there is nothing to select; a refusal
// about the element itself - its key or its type - points at the element that already exists.
export function findProcessDataPublicationError(
	activityErrors: $ReadOnlyArray<Object>,
): ProcessDataPublicationError | null
{
	const error = activityErrors.find((item) => (
		item?.code === UNRESOLVED_REFERENCE_CODE || SELECTABLE_ELEMENT_ERROR_CODES.includes(item?.code)
	));

	if (!error)
	{
		return null;
	}

	return {
		code: error.code,
		message: Type.isStringFilled(error.message) ? error.message : '',
		select: error.code === UNRESOLVED_REFERENCE_CODE ? null : readSelect(error.customData),
	};
}
