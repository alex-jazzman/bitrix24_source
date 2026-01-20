import { BaseEvent } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { EscEventAction } from 'im.v2.lib.esc-manager';

import type { EventEmitter } from 'main.core.events';
import type { ApplicationContext } from 'im.v2.const';

export class BulkActionsManager
{
	static #instance: BulkActionsManager;
	#emitter: EventEmitter;

	static getInstance(): BulkActionsManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	constructor()
	{
		this.keyPressHandler = this.#onKeyPressCloseBulkActions.bind(this);
	}

	bindEvents(context: ApplicationContext)
	{
		const { emitter } = context;
		this.#emitter = emitter;

		this.#emitter.subscribe(EventType.dialog.openBulkActionsMode, this.enableBulkMode.bind(this));
		this.#emitter.subscribe(EventType.dialog.closeBulkActionsMode, this.disableBulkMode.bind(this));
	}

	enableBulkMode(event: BaseEvent<{messageId: number, dialogId: string}>)
	{
		const { messageId, dialogId } = event.getData();

		void Core.getStore().dispatch('messages/select/enableBulkMode', {
			messageId,
			dialogId,
		});

		this.#bindEscHandler();
	}

	disableBulkMode(event: BaseEvent<{dialogId: string}>)
	{
		const { dialogId } = event.getData();

		void Core.getStore().dispatch('messages/select/disableBulkMode', {
			dialogId,
		});

		this.#unbindEscHandler();
	}

	clearCollection()
	{
		void Core.getStore().dispatch('messages/select/clearCollection');

		this.#unbindEscHandler();
	}

	#bindEscHandler()
	{
		this.#emitter.subscribe(EventType.key.onBeforeEscape, this.keyPressHandler);
	}

	#unbindEscHandler()
	{
		this.#emitter.unsubscribe(EventType.key.onBeforeEscape, this.keyPressHandler);
	}

	#onKeyPressCloseBulkActions(): $Values<typeof EscEventAction>
	{
		this.clearCollection();

		return EscEventAction.handled;
	}
}
