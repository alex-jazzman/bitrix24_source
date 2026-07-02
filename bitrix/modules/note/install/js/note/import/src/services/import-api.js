import { ajax, Type } from 'main.core';
import {
	normalizeCheckConnectionResponse,
	normalizeGetCollectionsResponse,
	normalizeGetDocumentTreeResponse,
	normalizeStartResponse,
	normalizeGetStatusResponse,
} from './import-normalizer';
import type {
	CheckConnectionRequest,
	CheckConnectionResponse,
	GetCollectionsRequest,
	GetCollectionsResponse,
	GetDocumentTreeRequest,
	GetDocumentTreeResponse,
	StartRequest,
	StartResponse,
	GetStatusRequest,
	GetStatusResponse,
	CancelRequest,
} from '../type';

export class ImportApi
{
	#controller: string;

	constructor(controller: string = 'note.infrastructure.ImportController')
	{
		this.#controller = controller;
	}

	async getActiveSession(): Promise<Object>
	{
		return this.#call('getActiveSession', {});
	}

	async checkOverlap(payload: Object): Promise<Object>
	{
		return this.#call('checkOverlap', payload);
	}

	async checkConnection(payload: CheckConnectionRequest): Promise<CheckConnectionResponse>
	{
		const response = await this.#call('checkConnection', payload);

		return normalizeCheckConnectionResponse(response);
	}

	async getCollections(payload: GetCollectionsRequest): Promise<GetCollectionsResponse>
	{
		const response = await this.#call('getCollections', payload);

		return normalizeGetCollectionsResponse(response);
	}

	async getDocumentTree(payload: GetDocumentTreeRequest): Promise<GetDocumentTreeResponse>
	{
		const response = await this.#call('getDocumentTree', payload);

		return normalizeGetDocumentTreeResponse(response);
	}

	async start(payload: StartRequest): Promise<StartResponse>
	{
		const response = await this.#call('start', payload);

		return normalizeStartResponse(response);
	}

	async getStatus(payload: GetStatusRequest): Promise<GetStatusResponse>
	{
		const response = await this.#call('getStatus', payload);

		return normalizeGetStatusResponse(response);
	}

	async cancel(payload: CancelRequest): Promise<boolean>
	{
		const response = await this.#call('cancel', payload);

		return response === true;
	}

	async acknowledgeFinish(payload: { sessionId: number }): Promise<boolean>
	{
		const response = await this.#call('acknowledgeFinish', payload);

		return response === true;
	}

	#call(action: string, data: Object): Promise<mixed>
	{
		return ajax.runAction(`${this.#controller}.${action}`, { data })
			.then((response) => response?.data)
			.catch((error) => {
				const wrapped = new Error(this.#extractErrorMessage(error));
				const code = this.#extractErrorCode(error);
				if (code !== '')
				{
					wrapped.code = code;
				}

				throw wrapped;
			})
		;
	}

	#extractErrorMessage(error: mixed): string
	{
		if (Type.isPlainObject(error))
		{
			const firstError = error?.errors?.[0]?.message;
			if (Type.isStringFilled(firstError))
			{
				return firstError;
			}

			if (Type.isStringFilled(error.message))
			{
				return error.message;
			}
		}

		return 'Request failed';
	}

	#extractErrorCode(error: mixed): string
	{
		if (Type.isPlainObject(error))
		{
			const code = error?.errors?.[0]?.code;
			if (Type.isStringFilled(code))
			{
				return code;
			}
		}

		return '';
	}
}
