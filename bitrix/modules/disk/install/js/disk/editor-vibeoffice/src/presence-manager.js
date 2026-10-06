import { Type, ajax as Ajax } from 'main.core';
import { PullClient } from 'pull.client';
import type { PresenceConfig, PresenceParticipant, PresenceRoster } from './types';

type PresenceManagerOptions = {
	config: PresenceConfig,
	onRoster: (roster: PresenceRoster) => void,
	onTerminal: () => void,
};

const COMPONENT_NAME = 'bitrix:disk.file.editor-vibeoffice';
const TERMINAL_ERROR_CODES = ['ACCESS_DENIED', 'PRESENCE_CONTEXT_INVALID'];
const PULL_STOP_REASON = 'Presence manager stopped';
const PRESENCE_MODULE_ID = 'disk';
const PRESENCE_COMMAND = 'vibeofficePresence';
const MILLISECONDS_IN_SECOND = 1000;
const PRESENCE_REQUEST_TIMEOUT_MARGIN = 1;
const PRESENCE_ACTIONS = {
	enter: 'presenceEnter',
	heartbeat: 'presenceHeartbeat',
	leave: 'presenceLeave',
};

export function isEnabledPresenceConfig(config: ?PresenceConfig): boolean
{
	if (!config || config.enabled !== true || !Type.isStringFilled(config.presenceContext)
		|| !Type.isNumber(config.heartbeatInterval) || !Number.isFinite(config.heartbeatInterval)
		|| config.heartbeatInterval <= 0
		|| !Type.isPlainObject(config.actions) || !Type.isPlainObject(config.pullConfig)
		|| config.moduleId !== PRESENCE_MODULE_ID || config.command !== PRESENCE_COMMAND
		|| !Type.isStringFilled(config.scope))
	{
		return false;
	}

	return config.actions.enter === PRESENCE_ACTIONS.enter
		&& config.actions.heartbeat === PRESENCE_ACTIONS.heartbeat
		&& config.actions.leave === PRESENCE_ACTIONS.leave;
}

export class PresenceManager
{
	#config: PresenceConfig;
	#onRoster: (roster: PresenceRoster) => void;
	#onTerminal: () => void;
	#pullClient: ?PullClient = null;
	#unsubscribe: ?() => void = null;
	#heartbeatTimer: ?IntervalID = null;
	#pageHideHandler: ?() => void = null;
	#started: boolean = false;
	#stopped: boolean = false;
	#pullStarted: boolean = false;
	#enterAttempted: boolean = false;
	#leaveSent: boolean = false;
	#lastRevision: ?number = null;
	#connecting: boolean = false;
	#heartbeatInProgress: boolean = false;
	#presenceRequest: ?Promise<void> = null;

	constructor(options: PresenceManagerOptions)
	{
		this.#config = options.config;
		this.#onRoster = options.onRoster;
		this.#onTerminal = options.onTerminal;
	}

	start(): void
	{
		if (this.#started || this.#stopped || !isEnabledPresenceConfig(this.#config))
		{
			return;
		}

		this.#started = true;
		this.#bindPageHide();
		this.#heartbeatTimer = setInterval(() => {
			void this.#heartbeat();
		}, this.#config.heartbeatInterval);
		void this.#connect();
	}

	stopWithBestEffortLeave(): void
	{
		this.#stop(true);
	}

	async #connect(): Promise<void>
	{
		if (!this.#isRunning() || this.#connecting)
		{
			return;
		}

		this.#connecting = true;
		let pullClient: ?PullClient = null;
		try
		{
			this.#disposePullClient();
			pullClient = new PullClient({ skipStorageInit: true });
			this.#pullClient = pullClient;
			this.#unsubscribe = pullClient.subscribe({
				type: PullClient.SubscriptionType.Server,
				moduleId: this.#config.moduleId,
				command: this.#config.command,
				callback: this.#handleRoster.bind(this),
			});

			const started = await this.#startPullClient(pullClient);
			if (!this.#isCurrentPullClient(pullClient))
			{
				pullClient.stop(PullClient.CloseReasons.MANUAL, PULL_STOP_REASON);

				return;
			}

			if (started !== true)
			{
				this.#disposePullClient();

				return;
			}

			this.#pullStarted = true;
			await this.#sendPresenceAction(this.#enterAttempted
				? this.#config.actions.heartbeat
				: this.#config.actions.enter,
			);
		}
		catch (error)
		{
			if (this.#hasTerminalError(error))
			{
				this.#terminate();

				return;
			}

			if (pullClient && this.#isCurrentPullClient(pullClient))
			{
				this.#disposePullClient();
			}
		}
		finally
		{
			this.#connecting = false;
		}
	}

	async #heartbeat(): Promise<void>
	{
		if (!this.#isRunning() || this.#heartbeatInProgress)
		{
			return;
		}

		this.#heartbeatInProgress = true;
		try
		{
			if (!this.#pullStarted || !this.#pullClient)
			{
				await this.#connect();

				return;
			}

			await this.#sendPresenceAction(this.#enterAttempted
				? this.#config.actions.heartbeat
				: this.#config.actions.enter,
			);
		}
		finally
		{
			this.#heartbeatInProgress = false;
		}
	}

	async #sendPresenceAction(action: string): Promise<void>
	{
		if (!this.#isRunning() || this.#presenceRequest !== null)
		{
			return;
		}

		if (action === this.#config.actions.enter)
		{
			this.#enterAttempted = true;
		}

		const request = this.#runPresenceAction(action);
		this.#presenceRequest = request;
		try
		{
			await request;
		}
		finally
		{
			this.#presenceRequest = null;
		}
	}

	async #runPresenceAction(action: string): Promise<void>
	{
		try
		{
			const response = await Ajax.runComponentAction(COMPONENT_NAME, action, {
				mode: 'ajax',
				timeout: this.#getPresenceRequestTimeout(),
				json: {
					presenceContext: this.#config.presenceContext,
					// Lets the server answer with the stored roster when this tab is behind, which is how
					// a lost pull event or a reconnect gets repaired without waiting for a join or leave.
					clientRevision: this.#lastRevision ?? 0,
				},
			});
			if (!this.#isRunning())
			{
				return;
			}

			if (response.status !== 'success')
			{
				if (this.#hasTerminalError(response))
				{
					this.#terminate();
				}

				return;
			}

			this.#applyRoster(response.data);
		}
		catch (error)
		{
			if (this.#hasTerminalError(error))
			{
				this.#terminate();
			}
		}
	}

	#startPullClient(pullClient: PullClient): Promise<boolean>
	{
		let timeoutId: ?TimeoutID = null;

		return Promise.race([
			pullClient.start(this.#config.pullConfig),
			new Promise((resolve) => {
				timeoutId = setTimeout(
					() => resolve(false),
					this.#getPresenceRequestTimeout() * MILLISECONDS_IN_SECOND,
				);
			}),
		]).finally(() => {
			if (timeoutId !== null)
			{
				clearTimeout(timeoutId);
			}
		});
	}

	#getPresenceRequestTimeout(): number
	{
		return Math.max(
			PRESENCE_REQUEST_TIMEOUT_MARGIN,
			Math.floor(this.#config.heartbeatInterval / MILLISECONDS_IN_SECOND)
				- PRESENCE_REQUEST_TIMEOUT_MARGIN,
		);
	}

	#handleRoster(roster: PresenceRoster): void
	{
		if (this.#isRunning())
		{
			this.#applyRoster(roster);
		}
	}

	#applyRoster(roster: ?PresenceRoster): void
	{
		if (!this.#isValidRoster(roster)
			|| roster.scope !== this.#config.scope
			|| (this.#lastRevision !== null && roster.revision <= this.#lastRevision))
		{
			return;
		}

		this.#lastRevision = roster.revision;
		this.#onRoster({
			scope: roster.scope,
			revision: roster.revision,
			participants: roster.participants.map((participant) => ({
				id: participant.id,
				name: participant.name,
				avatar: participant.avatar,
			})),
		});
	}

	#isValidRoster(roster: ?PresenceRoster): boolean
	{
		return Boolean(roster
			&& Type.isStringFilled(roster.scope)
			&& Type.isNumber(roster.revision)
			&& Number.isFinite(roster.revision)
			&& roster.revision >= 0
			&& Array.isArray(roster.participants)
			&& roster.participants.every((participant) => this.#isValidParticipant(participant))
		);
	}

	#isValidParticipant(participant: ?PresenceParticipant): boolean
	{
		return Boolean(participant
			&& Type.isNumber(participant.id)
			&& participant.id > 0
			&& Type.isStringFilled(participant.name)
			&& (participant.avatar === null || participant.avatar === undefined || Type.isString(participant.avatar))
		);
	}

	#hasTerminalError(response: any): boolean
	{
		const errors = Array.isArray(response?.errors)
			? response.errors
			: (Array.isArray(response) ? response : [response]);

		return errors.some((error) => TERMINAL_ERROR_CODES.includes(error?.code));
	}

	#terminate(): void
	{
		if (!this.#isRunning())
		{
			return;
		}

		this.#onTerminal();
		// The registration made by this tab outlives a terminal refusal and would sit in the roster
		// until the TTL expires. The server release path drops it without requiring an active
		// session, so the terminal stop still sends a best-effort leave.
		this.#stop(true);
	}

	#stop(sendLeave: boolean): void
	{
		if (this.#stopped)
		{
			return;
		}

		this.#stopped = true;
		if (this.#heartbeatTimer !== null)
		{
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}

		if (this.#pageHideHandler)
		{
			window.removeEventListener('pagehide', this.#pageHideHandler);
			this.#pageHideHandler = null;
		}

		this.#disposePullClient();
		if (sendLeave && this.#enterAttempted && !this.#leaveSent)
		{
			this.#leaveSent = true;
			// A leave that overtakes an in-flight enter or heartbeat is undone by that late request:
			// the server registers this tab again and keeps it in the roster until the TTL expires.
			// Presence requests carry their own timeout, so waiting for one is bounded.
			const pending = this.#presenceRequest;
			if (pending === null)
			{
				this.#sendLeave();
			}
			else
			{
				pending.then(() => this.#sendLeave(), () => this.#sendLeave());
			}
		}
	}

	#sendLeave(): void
	{
		Ajax.runComponentAction(COMPONENT_NAME, this.#config.actions.leave, {
			mode: 'ajax',
			json: {
				presenceContext: this.#config.presenceContext,
				clientRevision: this.#lastRevision ?? 0,
			},
		}).catch(() => {});
	}

	#disposePullClient(): void
	{
		const unsubscribe = this.#unsubscribe;
		this.#unsubscribe = null;
		unsubscribe?.();

		const pullClient = this.#pullClient;
		this.#pullClient = null;
		this.#pullStarted = false;
		pullClient?.stop(PullClient.CloseReasons.MANUAL, PULL_STOP_REASON);
	}

	#bindPageHide(): void
	{
		this.#pageHideHandler = () => this.stopWithBestEffortLeave();
		window.addEventListener('pagehide', this.#pageHideHandler);
	}

	#isRunning(): boolean
	{
		return this.#started && !this.#stopped;
	}

	#isCurrentPullClient(pullClient: PullClient): boolean
	{
		return this.#isRunning() && this.#pullClient === pullClient;
	}
}
