import { Reflection, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

export type SyncActiveCallsMode = 'full' | 'compact';

export type SyncActiveCallsMountOptions = {
	mode: SyncActiveCallsMode,
	onCountChange: (count: number) => void,
};

type Slot = {
	unmount: () => void,
};

type MountActiveCalls = (host: Element, options: SyncActiveCallsMountOptions) => Slot;

// syncconnector.embed is absent from documents its own embedding refuses - a slider, admin pages, a user it does
// not let in - so the published function is looked up instead of being declared a dependency.
const MOUNT_ACTIVE_CALLS = 'BX.SyncConnector.mountActiveCalls';
const EMBED_CONNECTED = 'BX.SyncConnector.Embed:connected';

/**
 * Puts the list of active calls of the web SDK into an element through the function syncconnector publishes,
 * and waits for the page embed while that function is not on the page yet.
 */
export class SyncActiveCallsMount
{
	#host: Element;
	#options: SyncActiveCallsMountOptions;
	#slot: Slot | null = null;
	#isWaiting: boolean = false;
	#isDestroyed: boolean = false;

	constructor(host: Element, options: SyncActiveCallsMountOptions)
	{
		this.#host = host;
		this.#options = options;
	}

	start(): void
	{
		if (this.#isDestroyed || this.#isWaiting || this.#slot !== null)
		{
			return;
		}

		if (!this.#mount())
		{
			this.#isWaiting = true;
			EventEmitter.subscribe(EMBED_CONNECTED, this.#handleConnected);
		}
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.#stopWaiting();
		this.#slot?.unmount();
		this.#slot = null;
	}

	#mount(): boolean
	{
		const mountActiveCalls = Reflection.getClass(MOUNT_ACTIVE_CALLS);
		if (!Type.isFunction(mountActiveCalls))
		{
			return false;
		}

		this.#slot = (mountActiveCalls as MountActiveCalls)(this.#host, this.#options);

		return true;
	}

	#stopWaiting(): void
	{
		if (!this.#isWaiting)
		{
			return;
		}

		this.#isWaiting = false;
		EventEmitter.unsubscribe(EMBED_CONNECTED, this.#handleConnected);
	}

	#handleConnected = (): void => {
		if (!this.#isDestroyed && this.#mount())
		{
			this.#stopWaiting();
		}
	};
}
