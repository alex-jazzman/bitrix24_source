import { Type } from 'main.core';

export class Logger
{
	#prefix: string;

	constructor(params: {prefix?: string} = {})
	{
		this.#prefix = params.prefix || '';
	}

	error(...args)
	{
		this.#prepareArgs(args);

		console.error(...args);
	}

	warn(...args)
	{
		this.#prepareArgs(args);

		// eslint-disable-next-line no-console
		console.warn(...args);
	}

	#prepareArgs(args: any[]): void
	{
		const [message] = args;
		if (Type.isString(message))
		{
			// eslint-disable-next-line no-param-reassign
			args[0] = `${this.#prefix}${message}`;
		}
		else
		{
			args.unshift(this.#prefix);
		}
	}
}

// default logger
export const logger = new Logger({
	prefix: 'crm.messagesender.editor: ',
});
