import type { BaseEvent } from 'main.core.events';

import type { ImStore } from '../adapter/im-store';
import type { CallEventHandler, CallInstantiator, CallLifecycleEventNames, LegacyCallInstance } from 'call.engine.registry';

type RecentSyncDeps = {
	events: {
		subscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
		unsubscribe: (event: string, handler: (baseEvent: BaseEvent) => void) => void,
	},
	callEvent: CallLifecycleEventNames,
	status: { joined: string, waiting: string },
	connectedStates: string[],
	instantiator: CallInstantiator,
	addCallListener: (call: LegacyCallInstance, event: string, handler: CallEventHandler) => void,
	removeCallListener: (call: LegacyCallInstance, event: string, handler: CallEventHandler) => void,
};

export class RecentCallsSync
{
	#store: ImStore;
	#deps: RecentSyncDeps;
	#onJoin: (event: any) => void;
	#onLeave: (event: any) => void;
	#onDestroy: (event: any) => void;
	#onCreated: (event: any) => void;

	constructor(store: ImStore, deps: RecentSyncDeps)
	{
		this.#store = store;
		this.#deps = deps;
		this.#onJoin = (event) => this.#handleJoin(event);
		this.#onLeave = (event) => this.#handleLeave(event);
		this.#onDestroy = (event) => this.#handleDestroy(event);
		this.#onCreated = (event) => this.handleCallCreated(event.getData()[0].call);
	}

	start(): void
	{
		this.#deps.events.subscribe('CallEvents::callCreated', this.#onCreated);
	}

	stop(): void
	{
		this.#deps.events.unsubscribe('CallEvents::callCreated', this.#onCreated);
	}

	deleteRecentCall(dialogId: string): void
	{
		this.#store.deleteActiveCall(dialogId);
	}

	updateFromActiveCalls(activeCalls: Object): void
	{
		// Snapshot before instantiating: instantiation fires CallEvents::callCreated synchronously, and
		// handleCallCreated puts the fresh call into the store. A JWT instance carries no server id
		// (Engine.instantiateCall does not pass one), so reading the list afterwards would treat it as
		// stale and drop it in the cleanup pass below.
		const recentCalls = this.#store.getRecentCalls();
		const activeCallsMap = new Map(Object.values(activeCalls).map((call: any) => [call.ID, call]));

		activeCallsMap.forEach((call: any) => {
			const instance = this.#deps.instantiator.isLegacyCall(call.PROVIDER, call.SCHEME)
				? this.#deps.instantiator.instantiateLegacy(
					call,
					call.USERS,
					call.LOG_TOKEN,
					call.CONNECTION_DATA,
					call.USER_DATA,
				)
				: this.#deps.instantiator.instantiate(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
			this.#subscribeToCallEvents(instance);
		});

		recentCalls
			.filter((oldCall: any) => !activeCallsMap.has(oldCall.call.id))
			.forEach((oldCall: any) => this.#store.deleteActiveCall(oldCall.dialogId));
	}

	// Additive counterpart of updateFromActiveCalls: instantiates active calls missing from recent
	// and never removes calls absent from the snapshot. Finished calls leave recent through the
	// durable Call::finish -> onDestroy path, so a snapshot that lags behind must not delete them.
	addMissingActiveCalls(activeCalls: Object): void
	{
		const existingUuids = this.#existingCallUuids();

		Object.values(activeCalls).forEach((call: any) => {
			if (existingUuids.has(call.UUID))
			{
				return;
			}

			// A Call::finish may have arrived while the snapshot was in flight.
			if (this.#deps.instantiator.isFinished(call))
			{
				return;
			}

			const instance = this.#deps.instantiator.isLegacyCall(call.PROVIDER, call.SCHEME)
				? this.#deps.instantiator.instantiateLegacy(
					call,
					call.USERS,
					call.LOG_TOKEN,
					call.CONNECTION_DATA,
					call.USER_DATA,
				)
				: this.#deps.instantiator.instantiate(call, call.CALL_TOKEN, call.LOG_TOKEN, call.USER_DATA);
			this.#subscribeToCallEvents(instance);
		});
	}

	// Whether the snapshot holds a call recent does not know about. Lets a caller probe with the
	// lean getActive payload and pull the heavy USERS/USER_DATA form only when something is missing.
	hasMissingActiveCalls(activeCalls: Object): boolean
	{
		const existingUuids = this.#existingCallUuids();

		return Object.values(activeCalls).some((call: any) => !existingUuids.has(call.UUID));
	}

	#existingCallUuids(): Set<string>
	{
		return new Set(this.#store.getRecentCalls().map((item: any) => item.call?.uuid));
	}

	handleCallCreated(call: any): void
	{
		const currentCall: any = this.#store.getRecentCallByDialog(call.associatedEntity.id);
		const isNewCall = currentCall?.call.uuid !== call.uuid;
		const state = this.#deps.connectedStates.includes(call.state)
			? this.#deps.status.joined
			: this.#deps.status.waiting;

		if (isNewCall)
		{
			if (currentCall)
			{
				this.#unsubscribeFromCallEvents(currentCall.call);
			}

			this.#subscribeToCallEvents(call);
			this.#addChatToModel(call);
			this.#store.addActiveCall({
				dialogId: call.associatedEntity.id,
				name: call.associatedEntity.name,
				call,
				state,
			});

			return;
		}

		this.#store.updateActiveCall(call.associatedEntity.id, {
			name: call.associatedEntity.name,
			state,
			call,
		});
	}

	#handleJoin(event: any): void
	{
		this.#store.updateActiveCall(event.call.associatedEntity.id, { state: this.#deps.status.joined });
	}

	#handleLeave(event: any): void
	{
		this.#store.updateActiveCall(event.call.associatedEntity.id, { state: this.#deps.status.waiting });
	}

	#handleDestroy(event: any): void
	{
		const dialogId = event.call.associatedEntity.id;
		const currentCall: any = this.#store.getRecentCallByDialog(dialogId);

		if (currentCall)
		{
			this.#unsubscribeFromCallEvents(currentCall.call);
		}

		if (currentCall?.call.uuid === event.call.uuid)
		{
			this.#store.deleteActiveCall(dialogId);
		}
	}

	#subscribeToCallEvents(call: Object): void
	{
		this.#deps.addCallListener(call, this.#deps.callEvent.onJoin, this.#onJoin);
		this.#deps.addCallListener(call, this.#deps.callEvent.onLeave, this.#onLeave);
		this.#deps.addCallListener(call, this.#deps.callEvent.onDestroy, this.#onDestroy);
	}

	#unsubscribeFromCallEvents(call: Object): void
	{
		this.#deps.removeCallListener(call, this.#deps.callEvent.onJoin, this.#onJoin);
		this.#deps.removeCallListener(call, this.#deps.callEvent.onLeave, this.#onLeave);
		this.#deps.removeCallListener(call, this.#deps.callEvent.onDestroy, this.#onDestroy);
	}

	#addChatToModel(call: any): void
	{
		const entity = call.associatedEntity;
		this.#store.addChat({
			dialogId: entity.id,
			type: entity.advanced?.chatType,
			name: entity.name,
			avatar: entity.avatar,
			color: entity.avatarColor,
		});
	}
}
