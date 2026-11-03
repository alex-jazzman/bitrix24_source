import type { BaseEvent } from 'main.core.events';

import type { CallInstantiator } from 'call.engine.registry';
import type { ImStore } from '../adapter/im-store';
import type { TryJoinCallResponse, TryJoinRawCall } from './try-join-call';

type GuestJoinDeps = {
	events: {
		subscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
		unsubscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
	},
	// Guest join is triggered by more than one event (guest identified + guest initial chat open);
	// the same handler is (un)subscribed to every event symmetrically.
	guestEvents: string[],
	hasActiveCurrentCall: (dialogId: string) => boolean,
	tryJoinCall: (dialogId: string) => Promise<TryJoinCallResponse>,
	instantiator: {
		isLegacyCall: CallInstantiator['isLegacyCall'],
		// `call` is narrowed to TryJoinRawCall (the tryJoinCall response shape), not the
		// registry's generic LegacyCallInstance — keep this stricter than CallInstantiator on purpose.
		instantiate: (call: TryJoinRawCall | undefined, callToken: unknown, logToken: unknown, userData: Object | undefined) => Object,
		instantiateLegacy: (
			call: TryJoinRawCall | undefined,
			users: unknown,
			logToken: unknown,
			connectionData: unknown,
			userData: unknown,
		) => Object,
	},
	join: (callId: string, callUuid: string | undefined, dialogId: string, withVideo: boolean) => void,
	// Logging is a side effect kept out of this service: CallManager injects the logger here.
	onWarn?: (message: string, ...args: unknown[]) => void,
};

export class GuestJoinHandler
{
	#store: ImStore;
	#deps: GuestJoinDeps;
	#handler: (event: BaseEvent) => void;

	constructor(store: ImStore, deps: GuestJoinDeps)
	{
		this.#store = store;
		this.#deps = deps;
		this.#handler = (event: { getData: () => { dialogId?: unknown } }) => {
			void this.handleGuestIdentified(event.getData());
		};
	}

	start(): void
	{
		this.#deps.guestEvents.forEach((event) => this.#deps.events.subscribe(event, this.#handler));
	}

	stop(): void
	{
		this.#deps.guestEvents.forEach((event) => this.#deps.events.unsubscribe(event, this.#handler));
	}

	async handleGuestIdentified(payload: { dialogId?: unknown }): Promise<void>
	{
		const dialogId = payload?.dialogId;
		if (!dialogId || (typeof dialogId !== 'string' && typeof dialogId !== 'number'))
		{
			this.#deps.onWarn?.('CallManager: guestIdentified: invalid payload', payload);

			return;
		}

		const normalizedDialogId = String(dialogId);

		if (this.#deps.hasActiveCurrentCall(normalizedDialogId))
		{
			return;
		}

		const storeItem = this.#store.getRecentCallByDialog(normalizedDialogId);
		if (storeItem !== null && storeItem !== undefined)
		{
			const storeCall = storeItem.call;
			this.#deps.join(storeCall.id, storeCall.uuid, normalizedDialogId, true);

			return;
		}

		// Store is empty for guests — query the server for an active call in this chat.
		let response;
		try
		{
			response = await this.#deps.tryJoinCall(normalizedDialogId);
		}
		catch (error)
		{
			this.#deps.onWarn?.('CallManager: guestIdentified: tryJoinCall request failed', error);

			return;
		}

		const data = response?.data;
		if (!data?.success)
		{
			this.#deps.onWarn?.('CallManager: guestIdentified: no active call for dialog', normalizedDialogId);

			return;
		}

		const call = data.call;

		if (this.#deps.instantiator.isLegacyCall(call?.PROVIDER, call?.SCHEME))
		{
			this.#deps.instantiator.instantiateLegacy(call, data.users, data.logToken, data.connectionData, data.userData);
		}
		else
		{
			this.#deps.instantiator.instantiate(call, data.callToken, data.logToken, data.userData);
		}

		// After instantiation, CallEvents::callCreated fires and RecentCallsSync
		// puts the call into recent/calls store. Join explicitly here.
		this.#deps.join(String(call?.ID), call?.UUID, normalizedDialogId, true);
	}
}
