import type { PopupOptions } from 'main.popup';

import { Hint } from 'tasks.v2.lib.hint';

import type { ActionPayload } from './type/action-payload';

class ChatHint extends Hint
{
	#popupId: string = 'tasks-chat-hint';

	async show(text: string, payload: ActionPayload, popupOptions: PopupOptions): Promise<void>
	{
		const options = {
			id: this.#popupId,
			bindElement: payload.bindElement,
			content: text,
			offsetLeft: 40,
			maxWidth: 770,
			padding: 12,
			targetContainer: document.body,
			...popupOptions,
		};

		if (payload.coordinates?.x)
		{
			const bindElementRect = payload.bindElement.getBoundingClientRect();

			options.offsetLeft = payload.coordinates.x - bindElementRect.left;
		}

		await super.showHint(options);
	}
}

export const chatHint = new ChatHint();
