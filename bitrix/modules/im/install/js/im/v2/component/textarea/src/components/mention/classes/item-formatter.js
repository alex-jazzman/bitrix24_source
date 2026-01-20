import { Loc } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

import type { ImModelChat } from 'im.v2.model';
import type { MentionItemType } from '../mention-content';

const ItemTextByChatType = {
	[ChatType.openChannel]: Loc.getMessage('IM_TEXTAREA_MENTION_OPEN_CHANNEL_TYPE'),
	[ChatType.generalChannel]: Loc.getMessage('IM_TEXTAREA_MENTION_OPEN_CHANNEL_TYPE'),
	[ChatType.channel]: Loc.getMessage('IM_TEXTAREA_MENTION_PRIVATE_CHANNEL_TYPE'),
	[ChatType.collab]: Loc.getMessage('IM_TEXTAREA_MENTION_COLLAB_TYPE'),
	default: Loc.getMessage('IM_TEXTAREA_MENTION_CHAT_TYPE'),
};

export class MentionItemFormatter
{
	constructor(dialogId: string)
	{
		this.dialogId = dialogId;
	}

	format(): MentionItemType
	{
		return {
			id: this.dialogId,
			title: this.getTitle(),
			subtitle: this.#getSubtitle(),
		};
	}

	getTitle(): string
	{
		const dialog = this.#getDialog();

		return dialog.name;
	}

	#getSubtitle(): string
	{
		const dialog = this.#getDialog();

		if (dialog.type === ChatType.user)
		{
			return Core.getStore().getters['users/getPosition'](this.dialogId) ?? Loc.getMessage('IM_TEXTAREA_MENTION_USER_TYPE');
		}

		return ItemTextByChatType[dialog.type] ?? ItemTextByChatType.default;
	}

	#getDialog(): ImModelChat
	{
		return Core.getStore().getters['chats/get'](this.dialogId, true);
	}
}
