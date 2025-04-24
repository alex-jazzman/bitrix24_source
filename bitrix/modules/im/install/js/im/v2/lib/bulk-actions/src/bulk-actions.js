import { BaseEvent, EventEmitter } from 'main.core.events';
import { Event } from 'main.core';

import { EventType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';

export class BulkActionsManager
{
	static #instance: BulkActionsManager;

	static getInstance(): BulkActionsManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	static init()
	{
		BulkActionsManager.getInstance();
	}

	constructor()
	{
		EventEmitter.subscribe(EventType.dialog.openBulkActionsMode, this.enableBulkMode.bind(this));
		EventEmitter.subscribe(EventType.dialog.closeBulkActionsMode, this.disableBulkMode.bind(this));
	}

	enableBulkMode(event: BaseEvent<{messageId: number, dialogId: string}>)
	{
		const { messageId, dialogId } = event.getData();

		void Core.getStore().dispatch('messages/select/enableBulkMode', {
			messageId,
			dialogId,
		});

		this.keyPressHandler = this.#onKeyPressCloseBulkActions.bind(this);

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
		Event.bind(document, 'keydown', this.keyPressHandler);
	}

	#unbindEscHandler()
	{
		Event.unbind(document, 'keydown', this.keyPressHandler);
	}

	#onKeyPressCloseBulkActions(event: KeyboardEvent)
	{
		if (Utils.key.isCombination(event, 'Escape'))
		{
			this.clearCollection();
		}
	}
}
