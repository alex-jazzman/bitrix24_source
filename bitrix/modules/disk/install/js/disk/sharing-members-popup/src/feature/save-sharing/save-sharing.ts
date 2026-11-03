import { Loc } from 'main.core';

import { SharingControlType, type SharingControlTypeValue } from '../../const/sharing';
import { mapDraftToEntityToNewShared } from '../../infrastructure/service/sharing/mappers';
import { sharingService } from '../../infrastructure/service/sharing/sharing';
import { type SharingSaveMode } from '../../infrastructure/service/sharing/types';
import { type SharingStore } from '../../model/sharing/sharing';

/**
 * `ignored` means no request has been sent at all: another save is still running or the mode
 * saves nothing.
 */
export type SaveSharingResult =
	| { status: 'saved', successMessage: string }
	| { status: 'error', errorMessage: string }
	| { status: 'ignored' };

const BoardExtension = 'board';

/**
 * A `denied` response carries no text at all and a transport failure carries none either,
 * so every unsuccessful status keeps its own phrase to fall back on.
 */
const FallbackPhrase = Object.freeze({
	denied: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_ACCESS_DENIED',
	error: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_SAVE',
});

// the save actions are defined for two modes only, and the type of the service says so
function toSaveMode(mode: SharingControlTypeValue | null): SharingSaveMode | null
{
	if (mode === SharingControlType.WithChangeRights || mode === SharingControlType.WithSharing)
	{
		return mode;
	}

	return null;
}

/**
 * The board is recognized by the extension of the name exactly as the legacy popup did, and the
 * name of the board goes into the text without it. A file named `.board` has no name part left
 * and falls into the common branch.
 */
function getSuccessMessage(mode: SharingSaveMode, objectName: string): string
{
	if (mode !== SharingControlType.WithChangeRights)
	{
		return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS') ?? '';
	}

	const segments = objectName.split('.');
	const extension = (segments.pop() ?? '').toLowerCase();
	const name = segments.join('.');

	if (name !== '' && extension === BoardExtension)
	{
		return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS_BOARD', { '#FILE#': name }) ?? '';
	}

	return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS_FILE', { '#FILE#': objectName }) ?? '';
}

function toErrorMessage(status: 'error' | 'denied', errorMessage: string): string
{
	if (errorMessage !== '')
	{
		return errorMessage;
	}

	return Loc.getMessage(FallbackPhrase[status]) ?? '';
}

/**
 * Sends the whole draft in a single request. The popup stays open until the server answers, so
 * the saving flag both blocks a second request and drives the state of the button.
 */
export async function saveSharing(store: SharingStore): Promise<SaveSharingResult>
{
	const mode = toSaveMode(store.mode);

	if (store.isSaving || mode === null || store.objectId === null)
	{
		return { status: 'ignored' };
	}

	store.setSaving(true);

	// the whole member list goes to the server, including the members the selector cannot express
	const entityToNewShared = mapDraftToEntityToNewShared(store.draft);
	const result = await sharingService.save(mode, store.objectId, entityToNewShared);

	store.setSaving(false);

	if (result.status === 'success')
	{
		return { status: 'saved', successMessage: getSuccessMessage(mode, store.objectName) };
	}

	return { status: 'error', errorMessage: toErrorMessage(result.status, result.errorMessage) };
}
