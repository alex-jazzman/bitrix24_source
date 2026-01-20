import { Messenger } from 'im.public';
import { EventType, KeyboardButtonAction } from 'im.v2.const';
import { SendingService } from 'im.v2.provider.service.sending';
import { PhoneManager } from 'im.v2.lib.phone';
import { Notifier } from 'im.v2.lib.notifier';

import type { EventEmitter } from 'main.core.events';
import type { ApplicationContext } from 'im.v2.const';
import type { ActionEvent } from '../types/events';

type ActionConfig = {
	[$Values<typeof KeyboardButtonAction>]: (payload: string) => void,
};

export class ActionManager
{
	#dialogId: string;
	#emitter: EventEmitter;
	#actionHandlers: ActionConfig = {
		[KeyboardButtonAction.send]: this.#sendMessage.bind(this),
		[KeyboardButtonAction.put]: this.#insertText.bind(this),
		[KeyboardButtonAction.call]: this.#startCall.bind(this),
		[KeyboardButtonAction.copy]: this.#copyText.bind(this),
		[KeyboardButtonAction.dialog]: this.#openChat.bind(this),
	};

	constructor(payload: { dialogId: string, context: ApplicationContext })
	{
		const { dialogId, context: { emitter } } = payload;
		this.#dialogId = dialogId;
		this.#emitter = emitter;
	}

	handleAction(event: ActionEvent): void
	{
		const { action, payload } = event;
		if (!this.#actionHandlers[action])
		{
			// eslint-disable-next-line no-console
			console.error('Keyboard: action not found');
		}

		this.#actionHandlers[action](payload);
	}

	#sendMessage(payload: string): void
	{
		SendingService.getInstance().sendMessage({
			text: payload,
			dialogId: this.#dialogId,
		});
	}

	#insertText(payload: string): void
	{
		this.#emitter.emit(EventType.textarea.insertText, {
			text: payload,
			dialogId: this.#dialogId,
		});
	}

	#startCall(payload: string): void
	{
		void PhoneManager.getInstance().startCall(payload);
	}

	#copyText(payload: string): void
	{
		if (BX.clipboard?.copy(payload))
		{
			Notifier.onCopyTextComplete();
		}
	}

	#openChat(payload: string): void
	{
		void Messenger.openChat(payload);
	}
}
