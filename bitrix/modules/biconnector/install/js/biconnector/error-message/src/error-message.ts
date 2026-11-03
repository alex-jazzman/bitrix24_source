import { Text, Type } from 'main.core';

export type ServerError = {
	code?: string | number | null,
	message?: string | null,
	userFacing?: boolean,
};

export type ServerErrorResponse = {
	errors?: ServerError[],
};

export function resolveErrorHtml(response: unknown, fallbackPhrase: string | null | undefined): string
{
	return getServerErrorHtml(response) ?? fallbackPhrase ?? '';
}

export function getServerErrorHtml(response: unknown): string | null
{
	const errors = (response as ServerErrorResponse | null | undefined)?.errors;

	if (!Type.isArray(errors))
	{
		return null;
	}

	return errors
		.map((error) => getUserFacingErrorHtml(error))
		.find((html) => html !== null) ?? null;
}

export function isNetworkError(response: unknown): boolean
{
	const errors = (response as ServerErrorResponse | null | undefined)?.errors;

	if (!Type.isArray(errors))
	{
		return false;
	}

	return errors.some((error) => Type.isObjectLike(error) && (error as ServerError).code === 'NETWORK_ERROR');
}

export function getUserFacingErrorHtml(error: unknown): string | null
{
	if (!Type.isObjectLike(error))
	{
		return null;
	}

	const serverError = error as ServerError;
	const message = serverError.message ?? '';

	if (serverError.userFacing !== true || !Type.isStringFilled(message))
	{
		return null;
	}

	return Text.encode(message);
}
