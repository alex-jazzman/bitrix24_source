import { ajax as Ajax, Type } from 'main.core';

import { type PresenceConfig, PresenceActionContract, PresencePullContract } from '../../../const/presence';
import { applyPresenceConfig, syncPresenceFromPull } from '../../../feature/sync-presence/sync-presence';
import {
	loadPullClient,
	type PullClientClass,
	type PullClientInstance,
} from '../../../lib/deferred-pull/deferred-pull';
import { usePresenceStore } from '../../../model/presence/presence';

const StopReason = 'Document header presence stopped';

/** An opening whose rights or binding the server refuses keeps no place in the roster at all. */
const TerminalErrorCodes: string[] = ['ACCESS_DENIED', 'PRESENCE_CONTEXT_INVALID'];

const MillisecondsInSecond = 1000;

/** Seconds by which a presence request stays short of the beat, and its own least duration. */
const RequestTimeoutMargin = 1;

/** Delivers the roster event to the synchronizer; what the event means is decided there, not here. */
export class PresencePullHandler
{
	getModuleId(): string
	{
		return PresencePullContract.moduleId;
	}

	getMap(): Record<string, (payload: unknown) => void>
	{
		return {
			[PresencePullContract.command]: this.#handleRoster,
		};
	}

	#handleRoster = (payload: unknown): void => {
		syncPresenceFromPull(payload);
	};
}

/**
 * The live channel of the roster. The roster travels to the private channel of the user, so a page
 * which already listens to it carries the events of the header as well - a second connection to the
 * same channel would only double the cost of every opened document. A page without such a client - an
 * opening by an external link among them - gets a client opened here instead.
 *
 * Listening alone would show nothing: the server sends a roster event to the openings registered in
 * that roster, so the channel also holds the registration of this one - it enters the roster, confirms
 * itself while the page lives and leaves when the page goes away. The shell of the page names the
 * component serving those requests, because only it knows which one renders it.
 *
 * A channel that could not be opened is not an error of the header: the block keeps showing the last
 * confirmed roster and adds nothing to it, while the beat keeps trying to open the channel again.
 */
export class PresenceChannel
{
	#componentName: string;
	/** The client of the page, opened and closed by the page itself. */
	#pageClient: PullClientInstance | null;
	#config: PresenceConfig | null = null;
	#handler: PresencePullHandler = new PresencePullHandler();
	#client: PullClientInstance | null = null;
	/** The transport arrives with the first channel opened here and stays for the ones after it. */
	#transport: PullClientClass | null = null;
	#ownsClient: boolean = false;
	#unsubscribe: (() => void) | null = null;
	#heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	#pageHideHandler: (() => void) | null = null;
	#isStopped: boolean = false;
	#isRegistered: boolean = false;
	#hasLeft: boolean = false;
	#request: Promise<void> | null = null;

	constructor(componentName: string, pageClient: PullClientInstance | null = null)
	{
		this.#componentName = componentName;
		this.#pageClient = pageClient;
	}

	/**
	 * @returns whether the live channel is open; a refused one leaves the block on its last roster.
	 */
	async start(config: PresenceConfig): Promise<boolean>
	{
		if (this.#config !== null || this.#isStopped || !describesLiveChannel(config) || !applyPresenceConfig(config))
		{
			return false;
		}

		this.#config = config;
		this.#bindPageHide();
		this.#heartbeatTimer = setInterval(() => {
			void this.#beat();
		}, config.heartbeatInterval);

		return this.#connect();
	}

	stop(): void
	{
		if (this.#isStopped)
		{
			return;
		}

		this.#isStopped = true;
		if (this.#heartbeatTimer !== null)
		{
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}

		if (this.#pageHideHandler !== null)
		{
			window.removeEventListener('pagehide', this.#pageHideHandler);
			this.#pageHideHandler = null;
		}

		this.#disposeClient();
		this.#leave();
	}

	async #connect(): Promise<boolean>
	{
		if (this.#isStopped || this.#client !== null)
		{
			return false;
		}

		if (this.#pageClient !== null)
		{
			this.#client = this.#pageClient;
			this.#unsubscribe = this.#pageClient.subscribe(this.#handler) as () => void;
			await this.#register();

			return !this.#isStopped;
		}

		// The transport is not a part of the header: it arrives with the first channel opened here. A
		// beat which came while it was on its way may have opened the channel already.
		this.#transport ??= await loadPullClient();
		const PullClient = this.#transport;
		if (PullClient === null || this.#isStopped || this.#client !== null)
		{
			return false;
		}

		const client = new PullClient({ skipStorageInit: true });
		this.#client = client;
		this.#ownsClient = true;
		this.#unsubscribe = client.subscribe(this.#handler) as () => void;

		const started = await this.#startClient(client);
		if (this.#client !== client)
		{
			// stopped while the client was connecting
			client.stop(PullClient.CloseReasons.MANUAL, StopReason);

			return false;
		}

		if (started !== true)
		{
			this.#disposeClient();

			return false;
		}

		await this.#register();

		return !this.#isStopped;
	}

	/**
	 * A connection which never answers would hold the attempt forever, and the client would stay in
	 * place, so the beat would keep confirming a registration on a channel delivering nothing. The
	 * wait is given the same span as a presence request; what it does not fit is let go, and the next
	 * beat opens the channel anew.
	 */
	#startClient(client: PullClientInstance): Promise<boolean>
	{
		let timer: ReturnType<typeof setTimeout> | null = null;

		const connected = client.start(this.#config?.pullConfig).catch(() => false);
		const expired = new Promise((resolve: (value: boolean) => void) => {
			timer = setTimeout(() => resolve(false), this.#requestTimeout() * MillisecondsInSecond);
		});

		return Promise.race([connected, expired]).then((started: unknown) => {
			if (timer !== null)
			{
				clearTimeout(timer);
			}

			return started === true;
		});
	}

	/** The beat confirms the registration and repairs a channel which is not open at the moment. */
	async #beat(): Promise<void>
	{
		if (this.#isStopped)
		{
			return;
		}

		if (this.#client === null)
		{
			await this.#connect();

			return;
		}

		await this.#register();
	}

	async #register(): Promise<void>
	{
		const actions = this.#config?.actions;
		if (!actions)
		{
			return;
		}

		await this.#send(this.#isRegistered ? actions.heartbeat : actions.enter);
	}

	async #send(action: string): Promise<void>
	{
		if (this.#isStopped || this.#request !== null)
		{
			return;
		}

		if (action === this.#config?.actions.enter)
		{
			// an attempt already counts: a request which arrives late registers this opening anyway
			this.#isRegistered = true;
		}

		const request = this.#run(action);
		this.#request = request;
		try
		{
			await request;
		}
		finally
		{
			this.#request = null;
		}
	}

	async #run(action: string): Promise<void>
	{
		try
		{
			const response = await Ajax.runComponentAction(this.#componentName, action, {
				mode: 'ajax',
				// one request at a time is in flight, so an answer that never comes would silence the
				// channel for good: it is given less than a beat and the next one replaces it
				timeout: this.#requestTimeout(),
				json: {
					presenceContext: this.#config?.presenceContext,
					// tells the server this opening is behind, so a roster missed across a lost event or a
					// reconnect comes back with the answer instead of waiting for the next join or leave
					clientRevision: usePresenceStore().revision,
				},
			});
			if (this.#isStopped)
			{
				return;
			}

			if (response.status === 'success')
			{
				syncPresenceFromPull(response.data);

				return;
			}

			this.#stopOnTerminalRefusal(response);
		}
		catch (error)
		{
			this.#stopOnTerminalRefusal(error);
		}
	}

	#requestTimeout(): number
	{
		const interval = Math.floor((this.#config?.heartbeatInterval ?? 0) / MillisecondsInSecond);

		return Math.max(RequestTimeoutMargin, interval - RequestTimeoutMargin);
	}

	/**
	 * The registration of this opening outlives the page and would sit in the roster until it expires,
	 * so leaving is asked for even after a refusal: the server drops a registration without demanding a
	 * live session. A leave overtaking a request in flight would be undone by it, so it waits for that one.
	 */
	#leave(): void
	{
		const action = this.#config?.actions.leave;
		if (!action || !this.#isRegistered || this.#hasLeft)
		{
			return;
		}

		this.#hasLeft = true;
		const send = (): void => {
			void Ajax.runComponentAction(this.#componentName, action, {
				mode: 'ajax',
				json: {
					presenceContext: this.#config?.presenceContext,
					clientRevision: usePresenceStore().revision,
				},
			}).catch(() => {});
		};

		const pending = this.#request;
		if (pending === null)
		{
			send();
		}
		else
		{
			pending.then(send, send);
		}
	}

	#stopOnTerminalRefusal(response: unknown): void
	{
		if (hasTerminalError(response))
		{
			this.stop();
		}
	}

	/** Only a client opened here is closed here: the one of the page lives as long as the page does. */
	#disposeClient(): void
	{
		const unsubscribe = this.#unsubscribe;
		this.#unsubscribe = null;
		unsubscribe?.();

		const client = this.#client;
		const ownsClient = this.#ownsClient;
		this.#client = null;
		this.#ownsClient = false;
		if (ownsClient)
		{
			client?.stop(this.#transport?.CloseReasons.MANUAL, StopReason);
		}
	}

	#bindPageHide(): void
	{
		this.#pageHideHandler = (): void => this.stop();
		window.addEventListener('pagehide', this.#pageHideHandler);
	}
}

/**
 * The lifecycle of the registration comes from the server as well, and the header expects the actions
 * it knows: a configuration describing anything else is not a channel this header can hold.
 */
function describesLiveChannel(config: PresenceConfig): boolean
{
	if (!Type.isPlainObject(config) || !Type.isPlainObject(config.pullConfig))
	{
		return false;
	}

	return Type.isStringFilled(config.presenceContext)
		&& Type.isNumber(config.heartbeatInterval)
		&& Number.isFinite(config.heartbeatInterval)
		&& config.heartbeatInterval > 0
		&& Type.isPlainObject(config.actions)
		&& config.actions.enter === PresenceActionContract.enter
		&& config.actions.heartbeat === PresenceActionContract.heartbeat
		&& config.actions.leave === PresenceActionContract.leave
	;
}

function hasTerminalError(response: unknown): boolean
{
	const container = response as { errors?: unknown } | null;
	let errors: unknown[] = [response];
	if (Type.isArray(container?.errors))
	{
		errors = container?.errors as unknown[];
	}
	else if (Type.isArray(response))
	{
		errors = response as unknown[];
	}

	return errors.some((error: unknown) => TerminalErrorCodes.includes((error as { code?: string })?.code ?? ''));
}
