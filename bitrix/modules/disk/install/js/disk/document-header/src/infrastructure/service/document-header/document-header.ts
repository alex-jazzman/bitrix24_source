import { ajax, Type, type AjaxError, type AjaxResponse } from 'main.core';

import { type CompositionModel } from '../../../model/composition/types';
import { type PresenceRoster } from '../../../model/presence/types';
import { mapCompositionDtoToModel, mapPresenceDtoToModel, mapRenameDto } from './mappers';
import {
	type CompositionRequest,
	type HeaderServiceError,
	type HeaderServiceResult,
	type PresenceRequest,
	type RenameDto,
	type RenameRequest,
} from './types';

/** Codes the service produces itself; every other code comes from the controller as is. */
export const HeaderServiceErrorCode = Object.freeze({
	Unexpected: 'UNEXPECTED',
	InvalidResponse: 'INVALID_RESPONSE',
} as const);

/**
 * The `disk.api.documentHeader` controller. A refusal is returned to the caller instead of being
 * thrown: a header that cannot be described must not take the opened object down with it.
 */
class DocumentHeaderService
{
	#actionPrefix: string = 'disk.api.documentHeader';

	async getComposition(documentSessionHash: string): Promise<HeaderServiceResult<CompositionModel>>
	{
		const request: CompositionRequest = { documentSessionHash };
		const response = await this.#runAction('getComposition', request);
		if (!response.success)
		{
			return response;
		}

		const composition = mapCompositionDtoToModel(response.data);

		return composition === null ? refuseInvalidResponse() : { success: true, data: composition };
	}

	async getPresence(documentSessionHash: string): Promise<HeaderServiceResult<PresenceRoster>>
	{
		const request: PresenceRequest = { documentSessionHash };
		const response = await this.#runAction('getPresence', request);
		if (!response.success)
		{
			return response;
		}

		const roster = mapPresenceDtoToModel(response.data);

		return roster === null ? refuseInvalidResponse() : { success: true, data: roster };
	}

	async rename(documentSessionHash: string, newName: string): Promise<HeaderServiceResult<RenameDto>>
	{
		const request: RenameRequest = { documentSessionHash, newName };
		const response = await this.#runAction('rename', request);
		if (!response.success)
		{
			return response;
		}

		const renamed = mapRenameDto(response.data);

		return renamed === null ? refuseInvalidResponse() : { success: true, data: renamed };
	}

	async #runAction(
		action: string,
		data: CompositionRequest | PresenceRequest | RenameRequest,
	): Promise<HeaderServiceResult<unknown>>
	{
		try
		{
			const response = await ajax.runAction(`${this.#actionPrefix}.${action}`, { data });

			return { success: true, data: response.data };
		}
		catch (rejection)
		{
			return { success: false, error: extractError(rejection) };
		}
	}
}

function refuseInvalidResponse(): HeaderServiceResult<never>
{
	return { success: false, error: { code: HeaderServiceErrorCode.InvalidResponse, message: '' } };
}

/**
 * `ajax.runAction` rejects with the answer itself when the controller reported errors, and with
 * anything at all when the request never reached it.
 */
function extractError(rejection: unknown): HeaderServiceError
{
	const errors = Type.isPlainObject(rejection)
		? (rejection as AjaxResponse<unknown>).errors
		: null
	;

	if (!Type.isArrayFilled(errors))
	{
		return { code: HeaderServiceErrorCode.Unexpected, message: '' };
	}

	const [error] = errors as AjaxError[];

	return {
		code: Type.isNil(error.code) || error.code === '' ? HeaderServiceErrorCode.Unexpected : String(error.code),
		message: Type.isString(error.message) ? error.message : '',
	};
}

export const documentHeaderService: DocumentHeaderService = new DocumentHeaderService();
