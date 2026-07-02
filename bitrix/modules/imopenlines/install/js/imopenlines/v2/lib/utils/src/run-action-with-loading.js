import { type JsonObject } from 'main.core';

/**
 * Runs an async action while managing a loading flag on the given reactive context.
 * Flag is set to true before the action starts and reset to false after completion,
 * even if the action throws. Returns whatever the action resolves with.
 *
 * @param {JsonObject} context - reactive object (e.g. Vue component instance) that holds the flag
 * @param {string} flag - property name on context to set to true/false
 * @param {() => Promise<T>} action - async action to execute
 * @returns {Promise<T>}
 */
export async function runActionWithLoading<T>(
	context: JsonObject,
	flag: string,
	action: () => Promise<T>,
): Promise<T>
{
	context[flag] = true;
	try
	{
		return await action();
	}
	finally
	{
		context[flag] = false;
	}
}
