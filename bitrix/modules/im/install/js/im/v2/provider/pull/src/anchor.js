import { Core } from 'im.v2.application.core';

import type { ImModelAnchor } from 'im.v2.model';
import type { DeleteChatAnchorsParams } from './types/anchor';

export class AnchorPullHandler
{
	constructor()
	{
		this.store = Core.getStore();
	}

	getModuleId(): string
	{
		return 'im';
	}

	handleAddAnchor(anchor: ImModelAnchor): void
	{
		this.store.dispatch('messages/anchors/addAnchor', { anchor });
	}

	handleDeleteAnchor(anchor: ImModelAnchor): void
	{
		this.store.dispatch('messages/anchors/removeAnchor', { anchor });
	}

	handleDeleteAnchors(payload: { chatIds: number[] }): void
	{
		const { chatIds } = payload;

		chatIds.forEach((chatId) => {
			void this.store.dispatch('messages/anchors/removeChatAnchors', chatId);
		});
	}

	handleDeleteChatAnchors(payload: DeleteChatAnchorsParams): void
	{
		this.store.dispatch('messages/anchors/removeChatAnchors', payload.chatId);
	}
}
