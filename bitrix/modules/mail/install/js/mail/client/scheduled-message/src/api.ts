import { ajax, Type } from 'main.core';

import {
	type CancelScheduledMessageResponse,
	type ChangeScheduledMessageStateRequest,
	type GetScheduledMessageRequest,
	type ListScheduledMessagesRequest,
	type ScheduleScheduledMessageRequest,
	type ScheduledMessageDto,
	type ScheduledMessageListResponse,
	type ScheduledMessageResponse,
	type UpdateScheduledMessageRequest,
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
};

type RunAction = (action: string, options: AjaxActionOptions) => Promise<AjaxActionResponse>;

const Controller = 'mail.api.scheduledmessage';

export type ScheduledMessageApiError = Error & {
	code: string,
	retryable: boolean,
};

export class ScheduledMessageApi
{
	#runAction: RunAction;

	constructor(runAction: RunAction = ajax.runAction as RunAction)
	{
		this.#runAction = runAction;
	}

	async schedule(request: ScheduleScheduledMessageRequest): Promise<ScheduledMessageDto>
	{
		const response = await this.#request<ScheduledMessageResponse>('schedule', { ...request });

		return response.scheduledMessage;
	}

	async list(request: ListScheduledMessagesRequest): Promise<ScheduledMessageListResponse>
	{
		return this.#request<ScheduledMessageListResponse>('list', { ...request });
	}

	async get(request: GetScheduledMessageRequest): Promise<ScheduledMessageDto>
	{
		const response = await this.#request<ScheduledMessageResponse>('get', { ...request });

		return response.scheduledMessage;
	}

	async update(request: UpdateScheduledMessageRequest): Promise<ScheduledMessageDto>
	{
		const response = await this.#request<ScheduledMessageResponse>('update', { ...request });

		return response.scheduledMessage;
	}

	async cancel(request: ChangeScheduledMessageStateRequest): Promise<CancelScheduledMessageResponse>
	{
		return this.#request<CancelScheduledMessageResponse>('cancel', { ...request });
	}

	async retry(request: ChangeScheduledMessageStateRequest): Promise<ScheduledMessageDto>
	{
		const response = await this.#request<ScheduledMessageResponse>('retry', { ...request });

		return response.scheduledMessage;
	}

	async #request<T>(action: string, data: Record<string, unknown>): Promise<T>
	{
		try
		{
			const response = await this.#runAction(`${Controller}.${action}`, { data });

			return response.data as T;
		}
		catch (error)
		{
			throw this.#mapError(error);
		}
	}

	#mapError(response: unknown): ScheduledMessageApiError
	{
		const ajaxError = response as AjaxErrorResponse;
		const error = ajaxError?.errors?.[0];
		const code = Type.isString(error?.code) ? error?.code as string : '';
		const message = Type.isString(error?.message) ? error?.message as string : '';
		const retryable = error?.retryable === true || error?.customData?.retryable === true;

		return Object.assign(new Error(message), {
			name: 'ScheduledMessageApiError',
			code,
			retryable,
		});
	}
}

export const scheduledMessageApi = new ScheduledMessageApi();
