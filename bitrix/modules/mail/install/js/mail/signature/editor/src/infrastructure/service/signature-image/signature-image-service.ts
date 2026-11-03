import { ajax, Type } from 'main.core';

import { SignatureImageAction, SignatureImageError } from '../../../const/signature-image';
import {
	type SignatureImageCopyRequest,
	type SignatureImageDto,
	type SignatureImageErrorCode,
	type SignatureImageResponseData,
	type SignatureImageServiceError,
	type SignatureImageUploadRequest,
} from './types';

type RunActionConfig = {
	data: SignatureImageUploadRequest | SignatureImageCopyRequest,
};

type RunActionResponse = {
	data: SignatureImageResponseData,
};

type RunAction = (action: string, config: RunActionConfig) => Promise<RunActionResponse>;

type AjaxErrorResponse = {
	errors?: Array<{
		code?: unknown,
		message?: unknown,
	}>,
};

export class SignatureImageService
{
	#runAction: RunAction;

	constructor(runAction: RunAction = (action, config) => ajax.runAction(action, config))
	{
		this.#runAction = runAction;
	}

	upload(uploadId: string): Promise<SignatureImageDto>
	{
		return this.#create(SignatureImageAction.Upload, { uploadId });
	}

	copy(objectId: number): Promise<SignatureImageDto>
	{
		return this.#create(SignatureImageAction.Copy, { objectId });
	}

	async #create(
		action: string,
		data: SignatureImageUploadRequest | SignatureImageCopyRequest,
	): Promise<SignatureImageDto>
	{
		try
		{
			const response = await this.#runAction(action, { data });

			return response.data.image;
		}
		catch (response)
		{
			throw this.#mapError(response as AjaxErrorResponse);
		}
	}

	#mapError(response: AjaxErrorResponse): SignatureImageServiceError
	{
		const error = response?.errors?.[0];
		const rawCode = error?.code;
		const rawMessage = error?.message;
		const code = Type.isString(rawCode) && Object.values(SignatureImageError).includes(
			rawCode as SignatureImageErrorCode,
		)
			? rawCode as SignatureImageErrorCode
			: null;

		return {
			code,
			message: Type.isString(rawMessage) ? rawMessage : '',
		};
	}
}

export const signatureImageService = new SignatureImageService();
