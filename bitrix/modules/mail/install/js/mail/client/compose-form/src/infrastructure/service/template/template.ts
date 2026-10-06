import { ajax, Type } from 'main.core';

import {
	type PrepareTemplateResponse,
	type QuickListResponse,
	type RecordTemplateUsageResponse,
	type SearchTemplatesRequest,
	type SearchTemplatesResponse,
	type SetRememberLastResponse,
	type TemplateAjaxError,
	type TemplateAjaxResponse,
	type TemplateReferenceDto,
} from './types';

const Controller = 'mail.MailTemplate';

type RequestData = Record<string, unknown>;

type TransportConfig = {
	method: 'GET' | 'POST',
	data?: RequestData,
	getParameters?: RequestData,
};

type Transport = {
	runAction<T>(action: string, config: TransportConfig): Promise<TemplateAjaxResponse<T>>,
};

const transport = ajax as Transport;

export class TemplateApiError extends Error
{
	readonly errors: TemplateAjaxError[];

	constructor(errors: TemplateAjaxError[] = [])
	{
		super(errors[0]?.message ?? 'Mail template request failed.');
		this.name = 'TemplateApiError';
		this.errors = errors;
	}
}

function getErrors(reason: unknown): TemplateAjaxError[]
{
	if (!Type.isObjectLike(reason))
	{
		return [];
	}

	const errors = (reason as { errors?: unknown }).errors;

	return Type.isArray(errors) ? errors as TemplateAjaxError[] : [];
}

function normalizeError(reason: unknown): TemplateApiError
{
	return new TemplateApiError(getErrors(reason));
}

/**
 * `runAction` of the core puts only `getParameters` into the url and sends `data` as the request body, which
 * a GET request has none of: a reading action carries its payload in the query string.
 */
function requestConfig(payload: RequestData, method: 'GET' | 'POST'): TransportConfig
{
	return method === 'GET' ? { method, getParameters: payload } : { method, data: payload };
}

async function runAction<T>(action: string, payload: RequestData = {}, method: 'GET' | 'POST' = 'POST'): Promise<T>
{
	try
	{
		const response = await transport.runAction<T>(`${Controller}.${action}`, requestConfig(payload, method));
		if (response.status === 'error' || response.data === undefined)
		{
			throw new TemplateApiError(response.errors);
		}

		return response.data;
	}
	catch (error)
	{
		throw normalizeError(error);
	}
}

export const TemplateApi = {
	quickList(): Promise<QuickListResponse>
	{
		return runAction<QuickListResponse>('quickList', {}, 'GET');
	},

	search(request: SearchTemplatesRequest): Promise<SearchTemplatesResponse>
	{
		return runAction<SearchTemplatesResponse>('search', { ...request }, 'GET');
	},

	prepare(reference: TemplateReferenceDto): Promise<PrepareTemplateResponse>
	{
		return runAction<PrepareTemplateResponse>('prepare', { reference });
	},

	setRememberLast(enabled: boolean): Promise<SetRememberLastResponse>
	{
		return runAction<SetRememberLastResponse>('setRememberLast', { enabled });
	},

	recordUsage(reference: TemplateReferenceDto): Promise<RecordTemplateUsageResponse>
	{
		return runAction<RecordTemplateUsageResponse>('recordUsage', { reference });
	},
};
