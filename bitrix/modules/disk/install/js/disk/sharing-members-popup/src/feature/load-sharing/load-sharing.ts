import { Loc } from 'main.core';

import { mapMembersToModel, mapOwnerToModel } from '../../infrastructure/service/sharing/mappers';
import { sharingService } from '../../infrastructure/service/sharing/sharing';
import { type SharingDetailDto, type SharingReadMode } from '../../infrastructure/service/sharing/types';
import { type SharingSnapshot } from '../../model/sharing/types';

export type { SharingReadMode } from '../../infrastructure/service/sharing/types';

export type LoadSharingResult =
	| { isLoaded: true, snapshot: SharingSnapshot }
	| { isLoaded: false, errorMessage: string };

/**
 * A `denied` response carries no text at all and a transport failure carries none either,
 * so every unsuccessful status keeps its own phrase to fall back on.
 */
const FallbackPhrase = Object.freeze({
	denied: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_ACCESS_DENIED',
	error: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_LOAD',
});

function toSnapshot(mode: SharingReadMode, data: SharingDetailDto): SharingSnapshot
{
	const { members, owner } = data;

	return {
		mode,
		owner: mapOwnerToModel(owner),
		members: mapMembersToModel(members),
		// the raw task name: a name outside the four known ones leaves no level to pick
		maxRight: owner.maxTaskName ?? null,
	};
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
 * Reads the sharing of an object. Neither `error` nor `denied` carries `owner` or `members`,
 * so the snapshot is built only for a successful response.
 */
export async function loadSharing(mode: SharingReadMode, objectId: number): Promise<LoadSharingResult>
{
	const result = await sharingService.load(mode, objectId);

	if (result.status === 'success')
	{
		return { isLoaded: true, snapshot: toSnapshot(mode, result.data) };
	}

	return { isLoaded: false, errorMessage: toErrorMessage(result.status, result.errorMessage) };
}
