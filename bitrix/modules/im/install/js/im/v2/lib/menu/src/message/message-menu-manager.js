import { Core } from 'im.v2.application.core';
import { ChannelManager } from 'im.v2.lib.channel';
import { CopilotManager } from 'im.v2.lib.copilot';
import { ChatType, MessageComponent } from 'im.v2.const';

// noinspection ES6PreferShortImport
import { MessageMenu } from './classes/message-base';
import { ChannelMessageMenu } from './classes/channel';
import { CommentsMessageMenu } from './classes/comments';
import { CopilotMessageMenu } from './classes/copilot';

import type { ImModelChat } from 'im.v2.model';
import type { MessageMenuContext } from 'im.v2.lib.menu';

type MenuCheckFunction = (context: MessageMenuContext) => boolean;
type MessageType = $Values<typeof MessageComponent>;

export class MessageMenuManager
{
	static #instance = null;

	#defaultMenuByCallback: Map<MenuCheckFunction, MessageMenu> = new Map();
	#customMenuByCallback: Map<MenuCheckFunction, MessageMenu> = new Map();
	#menuByMessageType: Map<MessageType, MessageMenu> = new Map();

	static getInstance(): MessageMenuManager
	{
		if (!this.#instance)
		{
			this.#instance = new MessageMenuManager();
		}

		return this.#instance;
	}

	constructor()
	{
		this.#registerDefaultMenus();
	}

	openMenu(context: MessageMenuContext, bindElement: HTMLElement): void
	{
		const DefaultMenuClass = this.#getDefaultMenuClass(context);
		if (!this.#contextCanBeCustomized(context))
		{
			(new DefaultMenuClass()).openMenu(context, bindElement);

			return;
		}

		const CustomMenuClass = this.#getCustomMenuClass(context);
		if (CustomMenuClass)
		{
			(new CustomMenuClass()).openMenu(context, bindElement);

			return;
		}

		(new DefaultMenuClass()).openMenu(context, bindElement);
	}

	registerMenuByCallback(callback: MenuCheckFunction, menuClass: MessageMenu): void
	{
		this.#customMenuByCallback.set(callback, menuClass);
	}

	registerMenuByMessageType(messageType: MessageType, menuClass: MessageMenu): void
	{
		if (this.#hasMenuForMessageType(messageType))
		{
			return;
		}

		this.#menuByMessageType.set(messageType, menuClass);
	}

	#registerDefaultMenus()
	{
		this.#defaultMenuByCallback.set(this.#isChannel.bind(this), ChannelMessageMenu);
		this.#defaultMenuByCallback.set(this.#isComment.bind(this), CommentsMessageMenu);
		this.#defaultMenuByCallback.set(this.#isCopilot.bind(this), CopilotMessageMenu);
	}

	#contextCanBeCustomized(context: MessageMenuContext): boolean
	{
		return !ChannelManager.isCommentsPostMessage(context, context.dialogId);
	}

	#getDefaultMenuClass(context: MessageMenuContext): MessageMenu
	{
		const MenuClass = this.#getClassByMap(this.#defaultMenuByCallback, context);

		return MenuClass ?? MessageMenu;
	}

	#getCustomMenuClass(context: MessageMenuContext): MessageMenu | null
	{
		if (this.#hasMenuForMessageType(context.componentId))
		{
			return this.#getMenuForMessageType(context.componentId);
		}

		return this.#getClassByMap(this.#customMenuByCallback, context);
	}

	#getClassByMap(menuMap: Map<MenuCheckFunction, MessageMenu>, context: MessageMenuContext): MessageMenu | null
	{
		const menuMapEntries = menuMap.entries();
		for (const [callback, MenuClass] of menuMapEntries)
		{
			if (callback(context))
			{
				return MenuClass;
			}
		}

		return null;
	}

	#getDialog(dialogId: string): ImModelChat
	{
		return Core.getStore().getters['chats/get'](dialogId, true);
	}

	#isChannel(context: MessageMenuContext): boolean
	{
		return ChannelManager.isChannel(context.dialogId);
	}

	#isComment(context: MessageMenuContext): boolean
	{
		const chat = this.#getDialog(context.dialogId);

		return chat.type === ChatType.comment;
	}

	#isCopilot(context: MessageMenuContext): boolean
	{
		return (new CopilotManager()).isCopilotChat(context.dialogId);
	}

	#hasMenuForMessageType(messageType: MessageType): boolean
	{
		return this.#menuByMessageType.has(messageType);
	}

	#getMenuForMessageType(messageType: MessageType): MessageMenu
	{
		return this.#menuByMessageType.get(messageType);
	}
}
