import { Type } from 'main.core';

import { type LaunchAnswer, type LaunchResponse, type ServerError } from './types';

export const mapResponseToAnswer = (response: LaunchResponse): LaunchAnswer => ({
	chatId: Number(response?.data?.chatId ?? 0),
	errorCode: '',
	limitCode: '',
});

export const mapErrorToAnswer = (error: unknown): LaunchAnswer => {
	const serverError: ServerError = (error as { errors?: ServerError[] } | null)?.errors?.[0] ?? {};

	return {
		chatId: 0,
		errorCode: Type.isStringFilled(serverError.code) ? serverError.code : '',
		limitCode: serverError.customData?.limitCode ?? '',
	};
};
