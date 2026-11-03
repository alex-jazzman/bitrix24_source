import { Type } from 'main.core';

const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export class HealthcheckRequestError extends Error
{
	readonly code: string;

	constructor(code: string)
	{
		super(code);
		this.name = 'HealthcheckRequestError';
		this.code = code;
	}

	get isNetwork(): boolean
	{
		return this.code === NETWORK_ERROR_CODE;
	}

	static from(reason: unknown): HealthcheckRequestError
	{
		if (reason instanceof HealthcheckRequestError)
		{
			return reason;
		}

		// ajax.runAction rejects with the controller response, or with NETWORK_ERROR when there is no such response.
		const errors = Type.isPlainObject(reason) ? (reason as { errors?: unknown }).errors : null;
		const code = Type.isArray(errors) && Type.isPlainObject(errors[0]) ? errors[0].code : null;

		return new HealthcheckRequestError(Type.isStringFilled(code) ? code : NETWORK_ERROR_CODE);
	}
}
