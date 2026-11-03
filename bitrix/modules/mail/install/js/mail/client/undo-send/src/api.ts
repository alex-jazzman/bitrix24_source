import { ajax, Type } from 'main.core';

import {
	type CancelUndoSendRequest,
	type CreateUndoSendRequest,
	type SetUndoSendPreferenceRequest,
	type UndoSendApiError,
	UndoSendErrorCode,
	type UndoSendOperationDto,
	type UndoSendPreference,
} from './types';

type AjaxActionOptions = {
	data: Record<string, unknown>,
};

type AjaxActionResponse = {
	data?: unknown,
};

type AjaxErrorItem = {
	code?: unknown,
	message?: unknown,
	retryable?: unknown,
	customData?: {
		retryable?: unknown,
	},
};

type AjaxErrorResponse = {
	errors?: AjaxErrorItem[],
	message?: unknown,
};

type RunAction = (action: string, options: AjaxActionOptions) => Promise<AjaxActionResponse>;
type CancelRequest = (request: CancelUndoSendRequest) => Promise<AjaxActionResponse>;

const CancelUrl = '/bitrix/services/main/ajax.php?action=mail.undoSend.cancelByToken';

const cancelRequest: CancelRequest = async (request) => {
	const data = new URLSearchParams();
	data.set('token', request.token);

	const response = await fetch(CancelUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'BX-Ajax': 'true',
		},
		body: data.toString(),
		credentials: 'omit',
	});
	const payload = await response.json() as AjaxActionResponse & AjaxErrorResponse & { status?: unknown };
	if (!response.ok || payload.status !== 'success')
	{
		throw payload;
	}

	return payload;
};

const Action = Object.freeze({
	Create: 'mail.undoSend.create',
	GetPreference: 'mail.undoSend.getPreference',
	SetPreference: 'mail.undoSend.setPreference',
});

export class UndoSendApi
{
	#runAction: RunAction;
	#cancelRequest: CancelRequest;
	#preferencePromise: Promise<UndoSendPreference> | null = null;

	constructor(
		runAction: RunAction = ajax.runAction as RunAction,
		runCancelRequest: CancelRequest = cancelRequest,
	)
	{
		this.#runAction = runAction;
		this.#cancelRequest = runCancelRequest;
	}

	create(request: CreateUndoSendRequest): Promise<UndoSendOperationDto>
	{
		return this.#request<UndoSendOperationDto>(Action.Create, { ...request });
	}

	cancel(request: CancelUndoSendRequest): Promise<UndoSendOperationDto>
	{
		return this.#requestCancellation(request);
	}

	getPreference(): Promise<UndoSendPreference>
	{
		this.#preferencePromise ??= this.#request<UndoSendPreference>(Action.GetPreference, {}).catch((error) => {
			this.#preferencePromise = null;

			throw error;
		});

		return this.#preferencePromise;
	}

	async setPreference(request: SetUndoSendPreferenceRequest): Promise<UndoSendPreference>
	{
		const preference = await this.#request<UndoSendPreference>(Action.SetPreference, { ...request });
		this.#preferencePromise = Promise.resolve(preference);

		return preference;
	}

	async #request<T>(action: string, data: Record<string, unknown>): Promise<T>
	{
		try
		{
			const response = await this.#runAction(action, { data });

			return response.data as T;
		}
		catch (error)
		{
			throw this.#mapError(error);
		}
	}

	async #requestCancellation(request: CancelUndoSendRequest): Promise<UndoSendOperationDto>
	{
		try
		{
			const response = await this.#cancelRequest(request);

			return response.data as UndoSendOperationDto;
		}
		catch (error)
		{
			throw this.#mapError(error);
		}
	}

	#mapError(response: unknown): UndoSendApiError
	{
		const ajaxError = response as AjaxErrorResponse;
		const error = ajaxError?.errors?.[0];
		const code = Type.isStringFilled(error?.code)
			? error.code as string
			: UndoSendErrorCode.Unknown
		;
		const message = Type.isString(error?.message)
			? error.message as string
			: (Type.isString(ajaxError?.message) ? ajaxError.message as string : '')
		;
		const retryable = error?.retryable === true || error?.customData?.retryable === true;

		return Object.assign(new Error(message), {
			name: 'UndoSendApiError',
			code,
			retryable,
		});
	}
}

export const undoSendApi = new UndoSendApi();
