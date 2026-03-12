import { Core } from 'im.v2.application.core';
import { ChannelManager } from 'im.v2.lib.channel';
import { CopilotManager } from 'im.v2.lib.copilot';
import { ChatType, DataAttribute, MessageComponent } from 'im.v2.const';

// noinspection ES6PreferShortImport
import { MessageMenu } from './classes/message-base';
import { ChannelMessageMenu } from './classes/channel';
import { CommentsMessageMenu } from './classes/comments';
import { CopilotMessageMenu } from './classes/copilot';
import { AiAssistantMessageMenu } from './classes/ai-assistant';
import { TaskCommentsMessageMenu } from './classes/task-comments';

import type { ImModelChat } from 'im.v2.model';
import type { MessageMenuContext } from 'im.v2.lib.menu';
import type { ApplicationContext } from 'im.v2.const';

type MenuCheckFunction = (context: MessageMenuContext) => boolean;
type MessageType = $Values<typeof MessageComponent>;
type OpenMenuPayload = {
	messageContext: MessageMenuContext,
	applicationContext: ApplicationContext,
	target: HTMLElement
};

export class MessageMenuManager
{
	static #instance = null;

	#defaultMenuByCallback: Map<MenuCheckFunction, MessageMenu> = new Map();
	#customMenuByCallback: Map<MenuCheckFunction, MessageMenu> = new Map();
	#menuByMessageType: Map<MessageType, MessageMenu> = new Map();
	#menuInstance = null;

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

	openMenu(payload: OpenMenuPayload): void
	{
		this.destroyMenuInstance();

		const { messageContext, target, applicationContext } = payload;
		const MenuClass = this.#resolveMenuClass(messageContext);
		this.#menuInstance = new MenuClass(applicationContext);
		this.#menuInstance.openMenu(messageContext, target);
	}

	registerMenuByCallback(callback: MenuCheckFunction, menuClass: MessageMenu): void
	{
		this.#customMenuByCallback.set(callback, menuClass);
	}

	unregisterMenuByCallback(callback: MenuCheckFunction): void
	{
		this.#customMenuByCallback.delete(callback);
	}

	destroyMenuInstance(): void
	{
		if (!this.#menuInstance)
		{
			return;
		}

		this.#menuInstance.destroy();
		this.#menuInstance = null;
	}

	shouldUseNativeContextMenu(target: HTMLElement): boolean
	{
		return Boolean(target.closest(`[${DataAttribute.useNativeContextMenu}]`));
	}

	registerMenuByMessageType(messageType: MessageType, menuClass: MessageMenu): void
	{
		if (this.#hasMenuForMessageType(messageType))
		{
			return;
		}

		this.#menuByMessageType.set(messageType, menuClass);
	}

	#resolveMenuClass(context: MessageMenuContext): MessageMenu
	{
		if (!this.#isCustomMenuAllowed(context))
		{
			return this.#getDefaultMenuClass(context);
		}

		const customMenu = this.#getCustomMenuClass(context);

		return customMenu ?? this.#getDefaultMenuClass(context);
	}

	#registerDefaultMenus()
	{
		this.#defaultMenuByCallback.set(this.#isChannel.bind(this), ChannelMessageMenu);
		this.#defaultMenuByCallback.set(this.#isComment.bind(this), CommentsMessageMenu);
		this.#defaultMenuByCallback.set(this.#isCopilot.bind(this), CopilotMessageMenu);
		this.#defaultMenuByCallback.set(this.#isAiAssistant.bind(this), AiAssistantMessageMenu);
		this.#defaultMenuByCallback.set(this.#isTaskComments.bind(this), TaskCommentsMessageMenu);
	}

	#isCustomMenuAllowed(context: MessageMenuContext): boolean
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

	#getChatType(dialogId: string): $Values<typeof ChatType>
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		return chat.type;
	}

	#isChannel(context: MessageMenuContext): boolean
	{
		return ChannelManager.isChannel(context.dialogId);
	}

	#isComment(context: MessageMenuContext): boolean
	{
		const type = this.#getChatType(context.dialogId);

		return type === ChatType.comment;
	}

	#isCopilot(context: MessageMenuContext): boolean
	{
		return (new CopilotManager()).isCopilotChat(context.dialogId);
	}

	#isAiAssistant(context: MessageMenuContext): boolean
	{
		return Core.getStore().getters['users/bots/isAiAssistant'](context.dialogId);
	}

	#isTaskComments(context: MessageMenuContext): boolean
	{
		const type = this.#getChatType(context.dialogId);

		return type === ChatType.taskComments;
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
