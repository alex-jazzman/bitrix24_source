import { ajax, Loc, Type } from 'main.core';

import { SharingControlType } from '../../../const/sharing';
import {
	type EntityToNewSharedDto,
	type SharingDetailDto,
	type SharingRawError,
	type SharingRawResponse,
	type SharingReadMode,
	type SharingResult,
	type SharingSaveMode,
} from './types';

const ajaxUrl = '/bitrix/components/bitrix/disk.folder.list/ajax.php';

const readActionByMode = Object.freeze({
	[SharingControlType.WithoutEdit]: 'showSharingDetail',
	[SharingControlType.WithChangeRights]: 'showSharingDetailChangeRights',
	[SharingControlType.WithSharing]: 'showSharingDetailAppendSharing',
});

const saveActionByMode = Object.freeze({
	[SharingControlType.WithChangeRights]: 'changeSharingAndRights',
	[SharingControlType.WithSharing]: 'appendSharing',
});

function getLastErrorMessage(errors: SharingRawError[] | undefined): string
{
	const message = Type.isArrayFilled(errors) ? errors[errors.length - 1]?.message : '';

	return Type.isStringFilled(message) ? message : '';
}

function toResult<Data>(response: unknown): SharingResult<Data>
{
	if (!Type.isPlainObject(response))
	{
		return { status: 'error', errorMessage: '' };
	}

	const raw = response as SharingRawResponse;

	if (raw.status === 'success')
	{
		return { status: 'success', data: response as Data };
	}

	if (raw.status === 'denied')
	{
		return { status: 'denied', errorMessage: Type.isStringFilled(raw.message) ? raw.message : '' };
	}

	return { status: 'error', errorMessage: getLastErrorMessage(raw.errors) };
}

/**
 * The only place talking to the `disk.folder.list` sharing actions.
 */
class SharingService
{
	load(mode: SharingReadMode, objectId: number): Promise<SharingResult<SharingDetailDto>>
	{
		return this.#request(readActionByMode[mode], { objectId });
	}

	// a successful save carries no data the popup reads, so only the status of the result matters
	save(
		mode: SharingSaveMode,
		objectId: number,
		entityToNewShared: EntityToNewSharedDto,
	): Promise<SharingResult<unknown>>
	{
		return this.#request(saveActionByMode[mode], { objectId, entityToNewShared });
	}

	async #request<Data>(action: string, data: Record<string, unknown>): Promise<SharingResult<Data>>
	{
		try
		{
			const response: unknown = await ajax.promise({
				url: `${ajaxUrl}?action=${action}`,
				method: 'POST',
				dataType: 'json',
				data: {
					...data,
					sessid: Loc.getMessage('bitrix_sessid'),
					SITE_ID: Loc.getMessage('SITE_ID'),
				},
			});

			return toResult<Data>(response);
		}
		catch
		{
			return { status: 'error', errorMessage: '' };
		}
	}
}

export const sharingService = new SharingService();
