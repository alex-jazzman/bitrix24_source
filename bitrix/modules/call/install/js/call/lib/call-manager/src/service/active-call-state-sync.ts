import type { BaseEvent } from 'main.core.events';

import type { ImStore } from '../adapter/im-store';

type Events = {
	subscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
	unsubscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
};

type PullEventData = {
	command?: string,
	params?: { call?: { UUID?: string } },
};

type GetActiveResponse = {
	data?: {
		calls?: Record<string, { UUID?: string, USER_STATE?: string }>,
	},
};

type ActiveCallStateSyncDeps = {
	// Multi-tab broadcast through the active engine: (callUuid, { silent }) => booleans, one per tab.
	broadcast: (callUuid: string, options: { silent: boolean }) => Promise<boolean[]>,
	// Conference broadcast (call.application.conference-channel).
	conferenceRequest: (conferenceCode: string) => Promise<boolean[]>,
	// Facade startCall — used by the take-over retry loop.
	startCall: (dialogId: string) => void,
	// Finishes the call on the server before taking it over on this tab.
	finishCall: (callUuid: string) => Promise<unknown>,
	// Fetches the list of active calls to confirm the call is live on the leader tab.
	fetchActiveCalls: () => Promise<GetActiveResponse>,
	// Global EventEmitter for call-start lifecycle events (callStartFailed / callCreated).
	events: Events,
	// window `onPullEvent-call` custom-event (un)subscription.
	subscribePull: (handler: (data: PullEventData) => void) => void,
	unsubscribePull: (handler: (data: PullEventData) => void) => void,
	status: { joined: string },
};

export class ActiveCallStateSync
{
	#store: ImStore;
	#deps: ActiveCallStateSyncDeps;

	constructor(store: ImStore, deps: ActiveCallStateSyncDeps)
	{
		this.#store = store;
		this.#deps = deps;
	}

	async syncActiveCallState(dialogId: string, callUuid: string): Promise<void>
	{
		const activeCalls = await this.#deps.broadcast(callUuid, { silent: true });

		if (activeCalls.some(Boolean))
		{
			this.#applyJoinedCallState(dialogId);

			return;
		}

		await this.#syncActiveStateAcrossTabs(dialogId, callUuid, 'im-call-check');
	}

	async syncActiveConferenceState(dialogId: string, callUuid: string, conferenceCode: string): Promise<void>
	{
		const activeConferences = await this.#deps.conferenceRequest(conferenceCode);

		if (activeConferences.some(Boolean))
		{
			this.#applyJoinedCallState(dialogId);

			return;
		}

		await this.#syncActiveStateAcrossTabs(dialogId, callUuid, 'im-conf-check');
	}

	async takeOverCall(dialogId: string, callUuid: string): Promise<void>
	{
		const waitForFinish = new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				this.#deps.unsubscribePull(onPullFinish);
				resolve();
			}, 5000);

			const onPullFinish = (data: PullEventData): void => {
				if (data.command === 'Call::finish' && data.params?.call?.UUID === callUuid)
				{
					clearTimeout(timeout);
					this.#deps.unsubscribePull(onPullFinish);
					resolve();
				}
			};

			this.#deps.subscribePull(onPullFinish);
		});

		await this.#deps.finishCall(callUuid);
		await waitForFinish;
		await this.#startCallWithRetry(dialogId);
	}

	async #syncActiveStateAcrossTabs(dialogId: string, callUuid: string, lockPrefix: string): Promise<void>
	{
		const channelName = `${lockPrefix}:${callUuid}`;

		// Web Locks is [SecureContext]-only: on an http portal, inside a non-secure iframe or in
		// browsers older than Safari 15.4 / Firefox 96 `navigator.locks` is undefined. Without leader
		// election there is nobody to elect — every tab hits the same branch, so each asks the server
		// on its own. Broadcasting the answer would be pointless: BroadcastChannel does not deliver to
		// the sender, and the only listener lives in the follower branch below, which needs locks.
		if (!navigator.locks)
		{
			if (await this.#fetchIsCallActive(callUuid))
			{
				this.#applyJoinedCallState(dialogId);
			}

			return;
		}

		const resultChannel = new BroadcastChannel(channelName);

		try
		{
			await navigator.locks.request(
				channelName,
				{ ifAvailable: true },
				async (lock) => {
					if (!lock)
					{
						await new Promise<void>((resolve) => {
							resultChannel.onmessage = ({ data }) => {
								if (data.isActive)
								{
									this.#applyJoinedCallState(dialogId);
								}
								resolve();
							};
							setTimeout(resolve, 3000);
						});

						return;
					}

					const isActive = await this.#fetchIsCallActive(callUuid);
					resultChannel.postMessage({ isActive });
					if (isActive)
					{
						this.#applyJoinedCallState(dialogId);
					}
				},
			);
		}
		finally
		{
			resultChannel.close();
		}
	}

	#applyJoinedCallState(dialogId: string): void
	{
		this.#store.updateActiveCall(dialogId, { state: this.#deps.status.joined });
	}

	async #startCallWithRetry(dialogId: string): Promise<void>
	{
		const maxAttempts = 3;
		const delayMs = 100;

		await new Promise((resolve) => {
			setTimeout(resolve, delayMs);
		});

		for (let attempt = 0; attempt < maxAttempts; attempt++)
		{
			// eslint-disable-next-line no-await-in-loop
			const succeeded = await new Promise<boolean>((resolve) => {
				const onFail = () => {
					cleanup();
					resolve(false);
				};

				const onSuccess = () => {
					cleanup();
					resolve(true);
				};

				const cleanup = () => {
					this.#deps.events.unsubscribe('CallEvents::callStartFailed', onFail);
					this.#deps.events.unsubscribe('CallEvents::callCreated', onSuccess);
				};

				this.#deps.events.subscribe('CallEvents::callStartFailed', onFail);
				this.#deps.events.subscribe('CallEvents::callCreated', onSuccess);
				this.#deps.startCall(dialogId);
			});

			if (succeeded)
			{
				return;
			}

			if (attempt < maxAttempts - 1)
			{
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve) => {
					setTimeout(resolve, delayMs);
				});
			}
		}
	}

	async #fetchIsCallActive(callUuid: string): Promise<boolean>
	{
		const response = await this.#deps.fetchActiveCalls();
		const calls = response?.data?.calls ?? {};

		return Object.values(calls).some(
			(call) => call.UUID === callUuid && call.USER_STATE === 'ready',
		);
	}
}
