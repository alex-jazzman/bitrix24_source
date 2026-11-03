import { Runtime } from 'main.core';

/**
 * The transport of the live channel of the roster: the heaviest thing the header could bring along,
 * and it serves one element alone, so an opening whose composition carries no presence neither loads
 * it nor runs the initialization declared next to it. A refusal is answered with `null`, and the next
 * beat asks for the transport again.
 */

/**
 * Written by hand instead of taken from `pull.client`: the extension is not a static dependency any
 * more, and its own declaration describes a surface the client does not have - no `stop`, no
 * `skipStorageInit` - so a binding to it would refuse this code rather than guard it.
 */
export type PullClientInstance = {
	start: (config: unknown) => Promise<unknown>,
	stop: (reason: unknown, description?: string) => void,
	subscribe: (handler: unknown) => unknown,
};

export type PullClientClass = {
	new (options: { skipStorageInit: boolean }): PullClientInstance,
	CloseReasons: Record<string, unknown>,
};

type PullExtension = {
	PullClient: PullClientClass,
};

export async function loadPullClient(): Promise<PullClientClass | null>
{
	try
	{
		const extension = await Runtime.loadExtension('pull.client') as unknown as PullExtension;

		return extension.PullClient ?? null;
	}
	catch
	{
		return null;
	}
}
