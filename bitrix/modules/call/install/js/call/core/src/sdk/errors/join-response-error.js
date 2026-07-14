import { Type } from 'main.core';

import { JoinRequestFailedCodes } from '../const';

export class JoinResponseError extends Error
{
	constructor(error, code) {
		const isError = Type.isObject(error) && (error instanceof Error);

		let errorCode = null;
		let name = null;
		const fondedCodePair = Object
			.entries(JoinRequestFailedCodes)
			.find(([_, failedCode]) => failedCode === code);

		if (fondedCodePair)
		{
			[name, errorCode] = fondedCodePair;
		}

		if (!name)
		{
			name = 'UnknownError';
		}

		super(isError ? error.message : error);

		this.name = name;
		this.code = errorCode ?? code;

		if (isError)
		{
			this.stack = error.stack;
		}
	}
}
