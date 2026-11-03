import { Extension } from 'main.core';
import { type SettingsCollection } from 'main.core.collections';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { nextTick } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { ChatType, EventType, Layout, LocalStorageKey, ErrorCode, type ApplicationContext, type LayoutType, type ChatTypeItem } from 'im.v2.const';
import { MessageAccessManager } from 'im.v2.lib.access';
import { Analytics } from 'im.v2.lib.analytics';
import { BulkActionsManager } from 'im.v2.lib.bulk-actions';
import { ChannelManager } from 'im.v2.lib.channel';
import { FeatureManager, Feature, TariffManager } from 'im.v2.lib.feature';
import { FolderManager } from 'im.v2.lib.folder';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';
import { MessageService } from 'im.v2.provider.service.message';

type EntityId = string;

const TypesWithoutContext: Set<string> = new Set([ChatType.comment]);
const LayoutsWithoutLastOpenedElement: Set<LayoutType> = new Set([Layout.channel, Layout.market, Layout.taskComments]);

export class LayoutManager
{
	static #instance: LayoutManager;
	#emitter: EventEmitter;
	#lastOpenedElement: { [layoutName: LayoutType]: EntityId } = {};
	#originLayout: ?ImModelLayout = null;

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

		this.#saveOriginLayout();

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

	restoreOriginLayout(newEntityId?: string): Promise
	{
		let originLayout = this.#originLayout ?? FolderManager.getDefaultLayout() ?? { name: Layout.chat };
		if (newEntityId)
		{
			originLayout = { ...originLayout, entityId: newEntityId, contextId: 0 };
		}
		this.#originLayout = null;

		return this.setLayout(originLayout);
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
			params: currentLayout.params,
		});
	}

	prepareInitialLayout(): Promise
	{
		const layoutConfig = LocalStorageManager.getInstance().get(LocalStorageKey.layoutConfig);
		if (!layoutConfig)
		{
			return this.setLayout(FolderManager.getDefaultLayout() ?? { name: Layout.chat });
		}

		Logger.warn('LayoutManager: last layout was restored', layoutConfig);

		LocalStorageManager.getInstance().remove(LocalStorageKey.layoutConfig);

		return this.setLayout(this.#resolveSavedLayout(layoutConfig));
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

	// An empty cache leaves the layout untouched instead of writing the missing chat as it is: the
	// cache answers with null, and the store keeps the entityId of a layout a string.
	resolveLayoutEntityId(layout: ImModelLayout): ImModelLayout
	{
		if (layout.entityId)
		{
			return layout;
		}

		const lastOpenedElement = this.getLastOpenedElement(layout.name);

		return lastOpenedElement ? { ...layout, entityId: lastOpenedElement } : layout;
	}

	clearCurrentLayoutEntityId(): void
	{
		const { name, params } = this.getLayout();
		void this.setLayout({ name, params });
		void this.deleteLastOpenedElement(name);
	}

	clearCurrentChat(dialogId: string): void
	{
		const { name, entityId } = this.getLayout();
		const isChatOpen = this.isChatLayout(name) && entityId === dialogId.toString();
		if (!isChatOpen)
		{
			return;
		}

		this.clearCurrentLayoutEntityId();
		this.deleteLastOpenedElementById(dialogId);
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
			Layout.vibecodeApp,
			Layout.folder,
			Layout.folderAll,
		]);

		return chatLayouts.has(layoutName);
	}

	isChatFormLayout(layoutName: LayoutType): boolean
	{
		const formLayouts = new Set([
			Layout.createChat,
			Layout.updateChat,
			Layout.copyCollab,
		]);

		return formLayouts.has(layoutName);
	}

	isFolderFormLayout(layoutName: LayoutType): boolean
	{
		const formLayouts = new Set([
			Layout.createFolder,
			Layout.updateFolder,
			Layout.folderAllSettings,
		]);

		return formLayouts.has(layoutName);
	}

	isFormLayout(layoutName: LayoutType): boolean
	{
		return this.isChatFormLayout(layoutName) || this.isFolderFormLayout(layoutName);
	}

	async #onGoToMessageContext(event: BaseEvent<{dialogId: string, messageId: number}>): void
	{
		const { dialogId, messageId } = event.getData();
		if (this.getLayout().entityId === dialogId)
		{
			return;
		}

		const sourceChat: ?ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		if (sourceChat)
		{
			this.#openMessageContext(dialogId, messageId, sourceChat.type);

			return;
		}

		void this.#loadChatAndOpenMessageContext(dialogId, messageId);
	}

	async #loadChatAndOpenMessageContext(dialogId: string, messageId: number): Promise<void>
	{
		try
		{
			await new ChatService().loadChat(dialogId);
		}
		catch (error)
		{
			Logger.error('LayoutManager: source chat load for message context failed', dialogId, error);
		}

		const { type }: ImModelChat = this.#getChat(dialogId);
		this.#openMessageContext(dialogId, messageId, type);
	}

	#openMessageContext(dialogId: string, messageId: number, chatType: ChatTypeItem): void
	{
		if (chatType === ChatType.comment)
		{
			void this.#openCommentMessageContext(dialogId, messageId);

			return;
		}

		const ContextLayoutByChatType: { [ChatTypeItem]: LayoutType } = {
			[ChatType.taskComments]: Layout.taskComments,
			[ChatType.lines]: FeatureManager.isFeatureAvailable(Feature.openLinesV2) ? Layout.openlinesV2 : Layout.openlines,
		};

		// A chat of a special type opens in its own section; everything else opens where regular chats
		// live now - the All folder when folders are on, the chat layout otherwise. The regular layout
		// is spread as a whole: the folder layout carries params besides the name.
		const specialLayoutName = ContextLayoutByChatType[chatType];

		void this.setLayout({
			...(specialLayoutName ? { name: specialLayoutName } : FolderManager.getRegularChatsLayout()),
			entityId: dialogId,
			contextId: messageId,
		});
	}

	async #openCommentMessageContext(dialogId: string, messageId: number): Promise<void>
	{
		const { chatId: commentChatId, parentChatId } = this.#getChat(dialogId);
		const channelChat: ?ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);
		if (!channelChat)
		{
			Logger.error('LayoutManager: no channel behind the comment message context', dialogId);

			return;
		}

		const postMessageId = await this.#getCommentPostId(commentChatId, channelChat.chatId);
		if (!postMessageId)
		{
			return;
		}

		await this.setLayout({
			name: Layout.chat,
			entityId: channelChat.dialogId,
			contextId: postMessageId,
		});
		await nextTick();

		this.#emitter.emit(EventType.dialog.openComments, { messageId: postMessageId, contextId: messageId });
	}

	async #getCommentPostId(commentChatId: number, channelChatId: number): Promise<number>
	{
		const knownPostId = Core.getStore().getters['messages/comments/getMessageIdByChatId'](commentChatId);
		if (knownPostId)
		{
			return knownPostId;
		}

		return new MessageService({ chatId: channelChatId })
			.loadContextByChatId(commentChatId)
			.catch((error) => {
				Logger.error('LayoutManager: comment message context load failed', commentChatId, error);

				return 0;
			});
	}

	#onDesktopReload()
	{
		this.saveCurrentLayout();
	}

	// A saved chat layout would bring the user back to a section the default rule now hides, so the
	// name of the saved config goes through that rule while its chat and params stay. Params are
	// merged and not replaced: the default layout carries the id of the folder to open.
	#resolveSavedLayout(layoutConfig: ImModelLayout): ImModelLayout
	{
		// The saved name comes from a session of an older version, and layout names do get renamed
		// (taskChat -> taskComments). Nothing is known about the chat of a name the dictionary lost,
		// so the default layout is opened alone.
		if (!this.isValidLayout(layoutConfig.name))
		{
			return FolderManager.getDefaultLayout() ?? { name: Layout.chat };
		}

		if (layoutConfig.name !== Layout.chat)
		{
			return layoutConfig;
		}

		const defaultLayout = FolderManager.getDefaultLayout() ?? { name: Layout.chat };

		return {
			...defaultLayout,
			entityId: layoutConfig.entityId,
			params: { ...defaultLayout.params, ...layoutConfig.params },
		};
	}

	#sendAnalytics(config: ImModelLayout)
	{
		// Forms open over the section the user is in and give it back on exit, so they are not tabs.
		if (this.isFormLayout(config.name))
		{
			return;
		}

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

	#saveOriginLayout()
	{
		const currentLayout = this.getLayout();
		if (this.isFormLayout(currentLayout.name))
		{
			return;
		}

		this.#originLayout = { ...currentLayout };
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
