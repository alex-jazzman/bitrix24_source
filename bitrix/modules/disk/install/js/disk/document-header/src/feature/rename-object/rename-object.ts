import { Loc, Type } from 'main.core';

import { documentHeaderService } from '../../infrastructure/service/document-header/document-header';
import { type HeaderServiceError } from '../../infrastructure/service/document-header/types';
import { toEditableName, toStoredName } from '../../lib/editable-name/editable-name';
import { useCompositionStore } from '../../model/composition/composition';

/** The code the controller answers with when the module refuses to store the name. */
const InvalidNameErrorCode = 'INVALID_NAME';

/**
 * Why the rename did not happen. `InvalidName` belongs next to the input - it is about the entered
 * value; everything else is about the attempt and is reported away from the field.
 */
export const RenameRefusal = Object.freeze({
	InvalidName: 'invalidName',
	Refused: 'refused',
} as const);

export type RenameRefusalValue = typeof RenameRefusal[keyof typeof RenameRefusal];

export type RenameResult =
	| { success: true, name: string, editorSynchronized: boolean }
	| { success: false, refusal: RenameRefusalValue, message: string }
;

/**
 * Renaming of the opened object: the new name is shown at once and rolled back if the server refuses
 * it. The refusal is handed over to the caller with its reason - the header never swallows it.
 *
 * @param newName the name without the extension: the extension is appended by the server
 */
export async function renameObject(
	documentSessionHash: string | undefined,
	newName: string,
): Promise<RenameResult>
{
	// the controller stores the name by the session of the opening; without one the name is not touched
	if (!Type.isStringFilled(documentSessionHash))
	{
		return { success: false, refusal: RenameRefusal.Refused, message: '' };
	}

	const store = useCompositionStore();
	const previousName = store.composition?.object.name ?? '';
	const extension = store.composition?.object.extension ?? '';
	const name = newName.trim();

	if (!Type.isStringFilled(name))
	{
		return {
			success: false,
			refusal: RenameRefusal.InvalidName,
			message: Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_EMPTY_NAME_ERROR') ?? '',
		};
	}

	// the entered value and the stored one are compared as the person sees them - without the extension
	if (name === toEditableName(previousName, extension))
	{
		return { success: true, name: previousName, editorSynchronized: true };
	}

	store.setObjectName(toStoredName(name, extension));

	const result = await documentHeaderService.rename(documentSessionHash, name);
	if (!result.success)
	{
		store.setObjectName(previousName);

		return refuse(result.error);
	}

	// the server uniquifies a name which is taken, so the stored one is not always the entered one
	store.setObjectName(result.data.name);

	return {
		success: true,
		name: result.data.name,
		// a name stored without the editor knowing about it is still a stored name, not a failure
		editorSynchronized: result.data.editorSynchronized,
	};
}

function refuse(error: HeaderServiceError): RenameResult
{
	return {
		success: false,
		refusal: error.code === InvalidNameErrorCode ? RenameRefusal.InvalidName : RenameRefusal.Refused,
		message: Type.isStringFilled(error.message)
			? error.message
			: Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ERROR') ?? ''
		,
	};
}
