import { ajax, Type } from 'main.core';

import { type SenderAvatarChange, type SenderAvatarData } from '../../model/types';

const CONTROLLER = 'mail.api.senderavatar';

export type AjaxError = {
	code?: string | number,
	message: string,
	customData?: unknown,
};

type AjaxResponse = {
	data: unknown,
	errors?: AjaxError[],
	status: 'success' | 'error',
};

export type AjaxActionOptions = {
	method: 'POST',
	data: Record<string, unknown>,
};

export type AjaxActionRunner = (
	action: string,
	options: AjaxActionOptions,
) => Promise<AjaxResponse>;

export class SenderAvatarApiError extends Error
{
	readonly errors: AjaxError[];
	readonly cause: unknown;

	constructor(errors: AjaxError[], cause?: unknown)
	{
		super(errors[0]?.message ?? 'Request failed');
		this.name = 'SenderAvatarApiError';
		this.errors = errors;
		this.cause = cause;
	}
}

const defaultRunner: AjaxActionRunner = (action, options) => {
	return ajax.runAction(action, options) as Promise<AjaxResponse>;
};

export type SenderAvatarApi = {
	get: (messageId: number, accessToken?: string) => Promise<SenderAvatarData>,
	save: (
		messageId: number,
		change: SenderAvatarChange,
		accessToken?: string,
	) => Promise<SenderAvatarData>,
};

export function createSenderAvatarApi(runner: AjaxActionRunner = defaultRunner): SenderAvatarApi
{
	async function run(action: 'get' | 'save', data: Record<string, unknown>): Promise<SenderAvatarData>
	{
		try
		{
			const response = await runner(`${CONTROLLER}.${action}`, { method: 'POST', data });
			if (response.status !== 'success' || response.errors?.length)
			{
				throw new SenderAvatarApiError(normalizeErrors(response.errors));
			}

			return response.data as SenderAvatarData;
		}
		catch (error)
		{
			if (error instanceof SenderAvatarApiError)
			{
				throw error;
			}

			throw new SenderAvatarApiError(normalizeErrors(getErrors(error), error), error);
		}
	}

	return {
		get(messageId: number, accessToken?: string): Promise<SenderAvatarData>
		{
			return run('get', createIdentity(messageId, accessToken));
		},
		save(messageId: number, change: SenderAvatarChange, accessToken?: string): Promise<SenderAvatarData>
		{
			return run('save', {
				...createIdentity(messageId, accessToken),
				change: { ...change },
			});
		},
	};
}

export const senderAvatarApi = createSenderAvatarApi();

function createIdentity(messageId: number, accessToken?: string): Record<string, unknown>
{
	return accessToken
		? { messageId, messageAccessToken: accessToken }
		: { messageId }
	;
}

function getErrors(error: unknown): unknown
{
	if (Type.isObject(error) && 'errors' in error)
	{
		return error.errors;
	}

	return error;
}

function normalizeErrors(errors: unknown, cause?: unknown): AjaxError[]
{
	if (Array.isArray(errors))
	{
		const normalized = errors
			.map((error) => normalizeError(error))
			.filter((error): error is AjaxError => error !== null)
		;
		if (normalized.length > 0)
		{
			return normalized;
		}
	}

	const normalized = normalizeError(errors) ?? normalizeError(cause);

	return normalized ? [normalized] : [{ message: 'Request failed' }];
}

function normalizeError(error: unknown): AjaxError | null
{
	if (error instanceof Error && error.message)
	{
		return { message: error.message };
	}

	if (Type.isStringFilled(error))
	{
		return { message: error };
	}

	if (!Type.isObject(error) || !('message' in error) || !Type.isStringFilled(error.message))
	{
		return null;
	}

	const normalized: AjaxError = { message: error.message };
	if ('code' in error && (Type.isString(error.code) || Type.isNumber(error.code)))
	{
		normalized.code = error.code;
	}

	if ('customData' in error)
	{
		normalized.customData = error.customData;
	}

	return normalized;
}
