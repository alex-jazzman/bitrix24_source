import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';
import { AbstractActionMenu } from '../abstract-action-menu';
import { OpenChatMenuItem } from '../items/chats/open-chat-menu-item';
import { UnbindChatMenuItem } from '../items/chats/unbund-chat-menu-item';

/**
 * Action menu for chat or channel items in the company structure.
 * Provides menu items to open or unbind a chat/channel.
 */
export class ChatListActionMenu extends AbstractActionMenu
{
	chat: ChatOrChannelDetailed;

	constructor(entityType: number, chat: ChatOrChannelDetailed, entityId: number)
	{
		super(entityId);
		this.chat = chat;
		this.entityType = entityType;
		this.items = this.getFilteredItems();
	}

	getItems(): Array
	{
		return [
			new OpenChatMenuItem(this.entityType, this.chat),
			new UnbindChatMenuItem(this.entityType, this.chat),
		];
	}
}
