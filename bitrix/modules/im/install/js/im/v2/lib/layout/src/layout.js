import { EventEmitter, BaseEvent } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { Analytics } from 'im.v2.lib.analytics';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { ChatType, EventType, Layout, LocalStorageKey } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';

import type { ImModelLayout, ImModelChat } from 'im.v2.model';

type EntityId = string;

const TypesWithoutContext: Set<string> = new Set([ChatType.comment]);
const LayoutsWithoutLastOpenedElement: Set<string> = new Set([Layout.channel.name]);

export class LayoutManager
{
	static #instance: LayoutManager;

	#lastOpenedElement: { [layoutName: string]: EntityId } = {};

	static getInstance(): LayoutManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	static init(): void
	{
		LayoutManager.getInstance();
	}

	constructor()
	{
		EventEmitter.subscribe(EventType.dialog.goToMessageContext, this.#onGoToMessageContext.bind(this));
		EventEmitter.subscribe(EventType.desktop.onReload, this.#onDesktopReload.bind(this));
	}

	async setLayout(config: ImModelLayout): Promise
	{
		if (config.entityId)
		{
			this.setLastOpenedElement(config.name, config.entityId);
		}

		if (this.#isSameChat(config))
		{
			this.#onSameChatReopen(config);
		}

		this.#sendAnalytics(config);

		return Core.getStore().dispatch('application/setLayout', config);
	}

	getLayout(): ImModelLayout
	{
		return Core.getStore().getters['application/getLayout'];
	}

	saveCurrentLayout(): void
	{
		const currentLayout = this.getLayout();

		LocalStorageManager.getInstance().set(LocalStorageKey.layoutConfig, {
			name: currentLayout.name,
			entityId: currentLayout.entityId,
		});
	}

	restoreLastLayout(): Promise
	{
		const layoutConfig = LocalStorageManager.getInstance().get(LocalStorageKey.layoutConfig);
		if (!layoutConfig)
		{
			return Promise.resolve();
		}

		Logger.warn('LayoutManager: last layout was restored', layoutConfig);

		LocalStorageManager.getInstance().remove(LocalStorageKey.layoutConfig);

		return this.setLayout(layoutConfig);
	}

	getLastOpenedElement(layoutName: string): null | string
	{
		return this.#lastOpenedElement[layoutName] ?? null;
	}

	setLastOpenedElement(layoutName: string, entityId: string): void
	{
		if (LayoutsWithoutLastOpenedElement.has(layoutName))
		{
			return;
		}

		this.#lastOpenedElement[layoutName] = entityId;
	}

	isChatContextAvailable(dialogId: string): boolean
	{
		if (!this.getLayout().contextId)
		{
			return false;
		}

		const { type }: ImModelChat = this.#getChat(dialogId);

		return !TypesWithoutContext.has(type);
	}

	destroy(): void
	{
		EventEmitter.unsubscribe(EventType.dialog.goToMessageContext, this.#onGoToMessageContext);
		EventEmitter.unsubscribe(EventType.desktop.onReload, this.#onDesktopReload.bind(this));
	}

	#onGoToMessageContext(event: BaseEvent<{dialogId: string, messageId: number}>): void
	{
		const { dialogId, messageId } = event.getData();
		if (this.getLayout().entityId === dialogId)
		{
			return;
		}

		const { type }: ImModelChat = this.#getChat(dialogId);
		if (TypesWithoutContext.has(type))
		{
			return;
		}

		const isCopilotLayout = type === ChatType.copilot;

		void this.setLayout({
			name: isCopilotLayout ? Layout.copilot.name : Layout.chat.name,
			entityId: dialogId,
			contextId: messageId,
		});
	}

	#onDesktopReload()
	{
		this.saveCurrentLayout();
	}

	#sendAnalytics(config: ImModelLayout)
	{
		const currentLayout = this.getLayout();
		if (currentLayout.name === Layout.copilot.name && currentLayout.entityId === '')
		{
			return;
		}

		if (config.name === Layout.copilot.name && config.entityId === '')
		{
			Analytics.getInstance().openCopilotTab(config.entityId);
		}
	}

	#isSameChat(config: ImModelLayout): boolean
	{
		const { name, entityId } = this.getLayout();
		const sameLayout = name === config.name;
		const sameEntityId = entityId && entityId === config.entityId;

		return sameLayout && sameEntityId;
	}

	#onSameChatReopen(config: ImModelLayout): void
	{
		const { entityId: dialogId, contextId } = config;
		const { type }: ImModelChat = this.#getChat(dialogId);
		const isChannel = [ChatType.openChannel, ChatType.channel].includes(type);
		if (isChannel)
		{
			EventEmitter.emit(EventType.dialog.closeComments);
		}

		if (contextId)
		{
			EventEmitter.emit(EventType.dialog.goToMessageContext, {
				messageId: contextId,
				dialogId,
			});
		}
	}

	#getChat(dialogId: string): ImModelChat
	{
		return Core.getStore().getters['chats/get'](dialogId, true);
	}
}
