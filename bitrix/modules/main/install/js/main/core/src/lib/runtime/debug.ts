import Type from '../type';

export let debugState = true;

export function enableDebug()
{
	debugState = true;
}

export function disableDebug()
{
	debugState = false;
}

export function isDebugEnabled()
{
	return debugState;
}

export default function debug(...args: any[])
{
	if (!isDebugEnabled() || !Type.isObject(window.console))
	{
		return;
	}

	let limit = 5;
	if (typeof args[args.length - 1] === 'number')
	{
		limit = args.pop();
	}

	if (Type.isFunction(window.console.log))
	{
		window.console.log('BX.debug:', ...args);

		if (args[0] instanceof Error && args[0].stack)
		{
			const errorStack = args[0].stack
				.split('\n')
				.slice(0, limit)
				.join('\n')
			;

			window.console.log(`BX.debug error stack trace:\n${errorStack}`);
		}
	}

	const stack = new Error('debug').stack;
	if (stack && Type.isFunction(window.console.log))
	{
		const formattedStack = stack
			.split('\n')
			.slice(1, limit + 1)
			.join('\n')
		;

		window.console.log(`BX.debug trace:\n${formattedStack}`);
	}
}
