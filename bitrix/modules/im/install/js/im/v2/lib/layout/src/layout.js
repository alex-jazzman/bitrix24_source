import { Extension } from 'main.core';
import { type SettingsCollection } from 'main.core.collections';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { ChatType, EventType, Layout, LocalStorageKey, ErrorCode, type ApplicationContext, type LayoutType, type ChatTypeItem } from 'im.v2.const';
import { MessageAccessManager } from 'im.v2.lib.access';
import { Analytics } from 'im.v2.lib.analytics';
import { BulkActionsManager } from 'im.v2.lib.bulk-actions';
import { ChannelManager } from 'im.v2.lib.channel';
import { FeatureManager, Feature, TariffManager } from 'im.v2.lib.feature';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';

type EntityId = string;

const TypesWithoutContext: Set<string> = new Set([ChatType.comment]);
const LayoutsWithoutLastOpenedElement: Set<LayoutType> = new Set([Layout.channel, Layout.market, Layout.taskComments]);

export class LayoutManager
{
	static #instance: LayoutManager;
	#emitter: EventEmitter;
	#lastOpenedElement: { [layoutName: LayoutType]: EntityId } = {};

	static getInstance(): LayoutManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	bindEvents(context: ApplicationContext)
	{
		const { emitter } = context;
		this.#emitter = emitter;

		this.#emitter.subscribe(EventType.dialog.goToMessageContext, this.#onGoToMessageContext.bind(this));
		EventEmitter.subscribe(EventType.desktop.onReload, this.#onDesktopReload.bind(this));
	}

	async setLayout(config: ImModelLayout): Promise
	{
		if (config.contextId)
		{
			const hasAccess = await this.#handleContextAccess(config);
			if (!hasAccess)
			{
				return Promise.resolve();
			}
		}

		if (config.entityId)
		{
			this.setLastOpenedElement(config.name, config.entityId);
		}

		if (this.#isSameChat(config))
		{
			this.#handleSameChatReopen(config);
		}
		else
		{
			this.#handleLayoutChange();
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

	prepareInitialLayout(): Promise
	{
		const layoutConfig = LocalStorageManager.getInstance().get(LocalStorageKey.layoutConfig);
		if (!layoutConfig)
		{
			return this.setLayout({ name: Layout.chat });
		}

		Logger.warn('LayoutManager: last layout was restored', layoutConfig);

		LocalStorageManager.getInstance().remove(LocalStorageKey.layoutConfig);

		return this.setLayout(layoutConfig);
	}

	getLastOpenedElement(layoutName: LayoutType): ?string
	{
		return this.#lastOpenedElement[layoutName] ?? null;
	}

	setLastOpenedElement(layoutName: LayoutType, entityId: string): void
	{
		if (!this.#canSaveLastOpenedElement(layoutName, entityId))
		{
			return;
		}

		this.#lastOpenedElement[layoutName] = entityId;
	}

	clearCurrentLayoutEntityId(): void
	{
		const currentLayoutName = this.getLayout().name;
		void this.setLayout({ name: currentLayoutName });
		void this.deleteLastOpenedElement(currentLayoutName);
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
		this.#emitter.unsubscribe(EventType.dialog.goToMessageContext, this.#onGoToMessageContext);
		EventEmitter.unsubscribe(EventType.desktop.onReload, this.#onDesktopReload.bind(this));
	}

	deleteLastOpenedElement(layoutName: LayoutType): void
	{
		if (LayoutsWithoutLastOpenedElement.has(layoutName))
		{
			return;
		}

		delete this.#lastOpenedElement[layoutName];
	}

	deleteLastOpenedElementById(entityId: string): void
	{
		Object.entries(this.#lastOpenedElement).forEach(([layoutName, lastOpenedId]) => {
			if (lastOpenedId === entityId)
			{
				delete this.#lastOpenedElement[layoutName];
			}
		});
	}

	isEmbeddedMode(): boolean
	{
		return this.isQuickAccessHidden();
	}

	isQuickAccessHidden(): boolean
	{
		const settings: SettingsCollection = Extension.getSettings('im.v2.lib.layout');

		return settings.get('isQuickAccessHidden', false);
	}

	isValidLayout(layoutName: LayoutType): boolean
	{
		return Object.values(Layout).includes(layoutName);
	}

	isChatLayout(layoutName: LayoutType): boolean
	{
		const chatLayouts = new Set([
			Layout.chat,
			Layout.channel,
			Layout.copilot,
			Layout.openlines,
			Layout.openlinesV2,
			Layout.collab,
			Layout.taskComments,
		]);

		return chatLayouts.has(layoutName);
	}

	isChatFormLayout(layoutName: LayoutType): boolean
	{
		const formLayouts = new Set([Layout.createChat, Layout.updateChat]);

		return formLayouts.has(layoutName);
	}

	async #onGoToMessageContext(event: BaseEvent<{dialogId: string, messageId: number}>): void
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

		void this.setLayout({
			name: Layout.chat,
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
		if (currentLayout.name === config.name)
		{
			return;
		}

		if (config.name === Layout.copilot)
		{
			Analytics.getInstance().copilot.onOpenTab();
		}

		Analytics.getInstance().onOpenTab(config.name);
	}

	#isSameChat(config: ImModelLayout): boolean
	{
		const { name, entityId } = this.getLayout();
		const sameLayout = name === config.name;
		const sameEntityId = entityId && entityId === config.entityId;

		return sameLayout && sameEntityId;
	}

	#handleLayoutChange()
	{
		this.#closeChannelComments();
		this.#handleChatChange();
	}

	#handleChatChange()
	{
		const { name, entityId } = this.getLayout();
		if (this.isChatLayout(name) && entityId)
		{
			this.#clearBulkActionsCollection();
		}
	}

	#handleSameChatReopen(config: ImModelLayout): void
	{
		const { entityId: dialogId, contextId } = config;

		this.#closeChannelComments();

		if (contextId)
		{
			this.#emitter.emit(EventType.dialog.goToMessageContext, {
				messageId: contextId,
				dialogId,
			});
		}
	}

	#clearBulkActionsCollection()
	{
		BulkActionsManager.getInstance().clearCollection();
	}

	#closeChannelComments()
	{
		const { entityId: dialogId = '' } = this.getLayout();
		const isChannelOpened = ChannelManager.isChannel(dialogId);
		if (isChannelOpened)
		{
			this.#emitter.emit(EventType.dialog.closeComments);
		}
	}

	async #handleContextAccess(config: ImModelLayout): Promise<boolean>
	{
		const { contextId: messageId, entityId: dialogId } = config;
		if (!messageId)
		{
			return Promise.resolve(true);
		}

		const { hasAccess, errorCode } = await MessageAccessManager.checkMessageAccess(messageId);
		if (!hasAccess && errorCode === ErrorCode.message.accessDeniedByTariff)
		{
			Analytics.getInstance().historyLimit.onGoToContextLimitExceeded({ dialogId });
			TariffManager.chatHistory.openFeatureSlider();

			return Promise.resolve(false);
		}

		return Promise.resolve(true);
	}

	#canSaveLastOpenedElement(layoutName: LayoutType, entityId: string): boolean
	{
		if (LayoutsWithoutLastOpenedElement.has(layoutName))
		{
			return false;
		}

		const { type } = this.#getChat(entityId);
		const isCollabV2Available = FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);

		const isCollab = isCollabV2Available && type === ChatType.collab;
		if (isCollab)
		{
			return false;
		}

		return !this.#isNestedChat(layoutName, entityId);
	}

	#getChat(dialogId: string): ImModelChat
	{
		return Core.getStore().getters['chats/get'](dialogId, true);
	}

	#isNestedChat(layoutName: LayoutType, entityId: string): boolean
	{
		if (!this.isChatLayout(layoutName))
		{
			return false;
		}

		const { parentChatId } = this.#getChat(entityId);

		return parentChatId > 0;
	}
}
