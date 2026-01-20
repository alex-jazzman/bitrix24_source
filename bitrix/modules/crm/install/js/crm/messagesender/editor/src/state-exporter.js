import { Runtime } from 'main.core';
import { type Store } from 'ui.vue3.vuex';
import type { State } from './editor';

export class StateExporter
{
	#store: Store;
	#emitter: EventEmitter;
	#unwatches: Array<() => void> = [];
	#emitStateChangeDebounced: ?() => void = null;

	constructor({ store, eventEmitter })
	{
		this.#store = store;
		this.#emitter = eventEmitter;

		this.#bindEvents();
	}

	#bindEvents(): void
	{
		this.#watchChannel();
		this.#watchFrom();
		this.#watchReceiver();
		this.#watchMessageBody();
		this.#watchTemplate();
	}

	#watchChannel(): void
	{
		this.#unwatches.push(
			this.#store.watch(
				(state, getters) => getters['channels/current'],
				(newValue: ?Channel, oldValue: ?Channel) => {
					if (newValue?.id !== oldValue?.id)
					{
						this.#emitOnStateChange();
						this.#emit('onChannelChange', { channel: newValue, oldChannel: oldValue });
					}
				},
			),
		);
	}

	#watchFrom(): void
	{
		this.#unwatches.push(
			this.#store.watch(
				(state, getters) => getters['channels/from'],
				(newValue, oldValue) => {
					if (newValue?.id !== oldValue?.id)
					{
						this.#emitOnStateChange();
						this.#emit('onFromChange', { from: newValue, oldFrom: oldValue });
					}
				},
			),
		);
	}

	#watchReceiver(): void
	{
		const emit = (newValue, oldValue) => {
			this.#emitOnStateChange();
			this.#emit('onToChange', { to: newValue, oldTo: oldValue });
		};

		this.#unwatches.push(
			this.#store.watch(
				(state, getters) => getters['channels/receiver'],
				(newValue, oldValue) => {
					if (!newValue && oldValue)
					{
						emit(newValue, oldValue);
					}

					if (newValue && !oldValue)
					{
						emit(newValue, oldValue);
					}

					if (newValue && oldValue && !newValue.isEqualTo(oldValue))
					{
						emit(newValue, oldValue);
					}
				},
			),
		);
	}

	#watchMessageBody(): void
	{
		let lastNewValue = null;
		let lastOldValue = null;

		const throttledWatcher = Runtime.throttle(() => {
			if (lastNewValue !== lastOldValue)
			{
				this.#emitOnStateChange();
				this.#emit('onMessageBodyChange', { body: lastNewValue, oldBody: lastOldValue });
			}
		}, 200);

		this.#unwatches.push(
			this.#store.watch(
				(state, getters) => getters['message/body'],
				(newValue, oldValue) => {
					// noinspection ReuseOfLocalVariableJS
					lastNewValue = newValue;
					// noinspection ReuseOfLocalVariableJS
					lastOldValue = oldValue;

					throttledWatcher();
				},
			),
		);
	}

	#watchTemplate(): void
	{
		this.#unwatches.push(
			this.#store.watch(
				(state, getters) => getters['templates/current'],
				(newValue, oldValue) => {
					if (newValue?.ORIGINAL_ID !== oldValue?.ORIGINAL_ID)
					{
						this.#emitOnStateChange();
						this.#emit('onTemplateChange', {
							// clone mutable data to avoid external mutations
							template: Runtime.clone(newValue),
							oldTemplate: Runtime.clone(oldValue),
						});
					}
				},
			),
		);
	}

	#emitOnStateChange(): void
	{
		// on channel change there usually from, to, template and message body changes
		// fire only one event in such cases
		this.#emitStateChangeDebounced ??= Runtime.debounce(() => {
			this.#emit('onStateChange');
		}, 25);

		this.#emitStateChangeDebounced();
	}

	#emit(eventName: string, eventData: Object = {}): void
	{
		this.#emitter.emit(eventName, eventData);
	}

	destroy(): void
	{
		this.#unwatches.forEach((unwatch) => unwatch());
		this.#unwatches = null;

		this.#emitter = null;

		Runtime.destroy(this);
	}

	getState(): ?State
	{
		const state = {
			channel: this.#store.getters['channels/current'],
			from: this.#store.getters['channels/from'],
			to: this.#store.getters['channels/receiver'],
			message: {
				body: this.#store.getters['message/body'],
			},
		};

		const chan = this.#store.getters['channels/current'];
		if (chan?.backend.senderCode === 'bitrix24')
		{
			state.notificationTemplate = this.#store.state.application.notificationTemplate;
		}
		else if (chan?.isTemplatesBased)
		{
			// clone mutable data to avoid external mutations
			state.template = Runtime.clone(this.#store.getters['templates/current']);
		}

		return state;
	}
}
