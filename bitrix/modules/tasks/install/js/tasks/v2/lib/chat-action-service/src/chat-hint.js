import type { PopupOptions } from 'main.popup';

import { Hint } from 'tasks.v2.lib.hint';

import type { ActionPayload } from './type/action-payload';

class ChatHint extends Hint
{
	#popupId: string = 'tasks-chat-hint';

	async show(text: string, payload: ActionPayload, popupOptions: PopupOptions = {}): Promise<void>
	{
		const options = {
			id: this.#popupId,
			role: 'status',
			bindElement: payload.bindElement,
			content: text,
			fixed: true,
			trackAnchor: true,
			offsetLeft: 40,
			maxWidth: 770,
			padding: 12,
			targetContainer: document.body,
			...popupOptions,
		};

		if (payload.coordinates?.x)
		{
			const bindElementRect = payload.bindElement.getBoundingClientRect();
			const desiredOffsetLeft = payload.coordinates.x - bindElementRect.left;
			const clampToWidth = (width: number): number => Math.min(Math.max(desiredOffsetLeft, 0), width);

			options.offsetLeft = clampToWidth(bindElementRect.width);
			options.resolveOffsetLeft = (rect: DOMRect): number => clampToWidth(rect.width);
		}

		await super.showHint(options);
	}
}

export function toPlainText(text: string): string
{
	return text.replaceAll(/<[^>]*>/gu, ' ').replaceAll(/\s+/gu, ' ').trim();
}

export const chatHint = new ChatHint();
