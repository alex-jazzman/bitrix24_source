/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_application_core, im_v2_const, im_v2_lib_access, im_v2_lib_analytics, im_v2_lib_bulkActions, im_v2_lib_channel, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_localStorage, im_v2_lib_logger, im_v2_provider_service_chat, im_v2_provider_service_message) {
	'use strict';

	const TypesWithoutContext = new Set([im_v2_const.ChatType.comment]);
	const LayoutsWithoutLastOpenedElement = new Set([im_v2_const.Layout.channel, im_v2_const.Layout.market, im_v2_const.Layout.taskComments]);
	class LayoutManager {
		static #instance;
		#emitter;
		#lastOpenedElement = {};
		#originLayout = null;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		bindEvents(context) {
			const {
				emitter
			} = context;
			this.#emitter = emitter;
			this.#emitter.subscribe(im_v2_const.EventType.dialog.goToMessageContext, this.#onGoToMessageContext.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.desktop.onReload, this.#onDesktopReload.bind(this));
		}
		async setLayout(config) {
			if (config.contextId) {
				const hasAccess = await this.#handleContextAccess(config);
				if (!hasAccess) {
					return Promise.resolve();
				}
			}
			this.#saveOriginLayout();
			if (config.entityId) {
				this.setLastOpenedElement(config.name, config.entityId);
			}
			if (this.#isSameChat(config)) {
				this.#handleSameChatReopen(config);
			} else {
				this.#handleLayoutChange();
			}
			this.#sendAnalytics(config);
			return im_v2_application_core.Core.getStore().dispatch('application/setLayout', config);
		}
		restoreOriginLayout(newEntityId) {
			let originLayout = this.#originLayout ?? im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
				name: im_v2_const.Layout.chat
			};
			if (newEntityId) {
				originLayout = {
					...originLayout,
					entityId: newEntityId,
					contextId: 0
				};
			}
			this.#originLayout = null;
			return this.setLayout(originLayout);
		}
		getLayout() {
			return im_v2_application_core.Core.getStore().getters['application/getLayout'];
		}
		saveCurrentLayout() {
			const currentLayout = this.getLayout();
			im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.layoutConfig, {
				name: currentLayout.name,
				entityId: currentLayout.entityId,
				params: currentLayout.params
			});
		}
		prepareInitialLayout() {
			const layoutConfig = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.layoutConfig);
			if (!layoutConfig) {
				return this.setLayout(im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
					name: im_v2_const.Layout.chat
				});
			}
			im_v2_lib_logger.Logger.warn('LayoutManager: last layout was restored', layoutConfig);
			im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(im_v2_const.LocalStorageKey.layoutConfig);
			return this.setLayout(this.#resolveSavedLayout(layoutConfig));
		}
		getLastOpenedElement(layoutName) {
			return this.#lastOpenedElement[layoutName] ?? null;
		}
		setLastOpenedElement(layoutName, entityId) {
			if (!this.#canSaveLastOpenedElement(layoutName, entityId)) {
				return;
			}
			this.#lastOpenedElement[layoutName] = entityId;
		}

		// An empty cache leaves the layout untouched instead of writing the missing chat as it is: the
		// cache answers with null, and the store keeps the entityId of a layout a string.
		resolveLayoutEntityId(layout) {
			if (layout.entityId) {
				return layout;
			}
			const lastOpenedElement = this.getLastOpenedElement(layout.name);
			return lastOpenedElement ? {
				...layout,
				entityId: lastOpenedElement
			} : layout;
		}
		clearCurrentLayoutEntityId() {
			const {
				name,
				params
			} = this.getLayout();
			void this.setLayout({
				name,
				params
			});
			void this.deleteLastOpenedElement(name);
		}
		clearCurrentChat(dialogId) {
			const {
				name,
				entityId
			} = this.getLayout();
			const isChatOpen = this.isChatLayout(name) && entityId === dialogId.toString();
			if (!isChatOpen) {
				return;
			}
			this.clearCurrentLayoutEntityId();
			this.deleteLastOpenedElementById(dialogId);
		}
		isChatContextAvailable(dialogId) {
			if (!this.getLayout().contextId) {
				return false;
			}
			const {
				type
			} = this.#getChat(dialogId);
			return !TypesWithoutContext.has(type);
		}
		destroy() {
			this.#emitter.unsubscribe(im_v2_const.EventType.dialog.goToMessageContext, this.#onGoToMessageContext);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.desktop.onReload, this.#onDesktopReload.bind(this));
		}
		deleteLastOpenedElement(layoutName) {
			if (LayoutsWithoutLastOpenedElement.has(layoutName)) {
				return;
			}
			delete this.#lastOpenedElement[layoutName];
		}
		deleteLastOpenedElementById(entityId) {
			Object.entries(this.#lastOpenedElement).forEach(([layoutName, lastOpenedId]) => {
				if (lastOpenedId === entityId) {
					delete this.#lastOpenedElement[layoutName];
				}
			});
		}
		isEmbeddedMode() {
			return this.isQuickAccessHidden();
		}
		isQuickAccessHidden() {
			const settings = main_core.Extension.getSettings('im.v2.lib.layout');
			return settings.get('isQuickAccessHidden', false);
		}
		isValidLayout(layoutName) {
			return Object.values(im_v2_const.Layout).includes(layoutName);
		}
		isChatLayout(layoutName) {
			const chatLayouts = new Set([im_v2_const.Layout.chat, im_v2_const.Layout.channel, im_v2_const.Layout.copilot, im_v2_const.Layout.openlines, im_v2_const.Layout.openlinesV2, im_v2_const.Layout.collab, im_v2_const.Layout.taskComments, im_v2_const.Layout.vibecodeApp, im_v2_const.Layout.folder, im_v2_const.Layout.folderAll]);
			return chatLayouts.has(layoutName);
		}
		isChatFormLayout(layoutName) {
			const formLayouts = new Set([im_v2_const.Layout.createChat, im_v2_const.Layout.updateChat, im_v2_const.Layout.copyCollab]);
			return formLayouts.has(layoutName);
		}
		isFolderFormLayout(layoutName) {
			const formLayouts = new Set([im_v2_const.Layout.createFolder, im_v2_const.Layout.updateFolder, im_v2_const.Layout.folderAllSettings]);
			return formLayouts.has(layoutName);
		}
		isFormLayout(layoutName) {
			return this.isChatFormLayout(layoutName) || this.isFolderFormLayout(layoutName);
		}
		async #onGoToMessageContext(event) {
			const {
				dialogId,
				messageId
			} = event.getData();
			if (this.getLayout().entityId === dialogId) {
				return;
			}
			const sourceChat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			if (sourceChat) {
				this.#openMessageContext(dialogId, messageId, sourceChat.type);
				return;
			}
			void this.#loadChatAndOpenMessageContext(dialogId, messageId);
		}
		async #loadChatAndOpenMessageContext(dialogId, messageId) {
			try {
				await new im_v2_provider_service_chat.ChatService().loadChat(dialogId);
			} catch (error) {
				im_v2_lib_logger.Logger.error('LayoutManager: source chat load for message context failed', dialogId, error);
			}
			const {
				type
			} = this.#getChat(dialogId);
			this.#openMessageContext(dialogId, messageId, type);
		}
		#openMessageContext(dialogId, messageId, chatType) {
			if (chatType === im_v2_const.ChatType.comment) {
				void this.#openCommentMessageContext(dialogId, messageId);
				return;
			}
			const ContextLayoutByChatType = {
				[im_v2_const.ChatType.taskComments]: im_v2_const.Layout.taskComments,
				[im_v2_const.ChatType.lines]: im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2) ? im_v2_const.Layout.openlinesV2 : im_v2_const.Layout.openlines
			};

			// A chat of a special type opens in its own section; everything else opens where regular chats
			// live now - the All folder when folders are on, the chat layout otherwise. The regular layout
			// is spread as a whole: the folder layout carries params besides the name.
			const specialLayoutName = ContextLayoutByChatType[chatType];
			void this.setLayout({
				...(specialLayoutName ? {
					name: specialLayoutName
				} : im_v2_lib_folder.FolderManager.getRegularChatsLayout()),
				entityId: dialogId,
				contextId: messageId
			});
		}
		async #openCommentMessageContext(dialogId, messageId) {
			const {
				chatId: commentChatId,
				parentChatId
			} = this.#getChat(dialogId);
			const channelChat = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](parentChatId);
			if (!channelChat) {
				im_v2_lib_logger.Logger.error('LayoutManager: no channel behind the comment message context', dialogId);
				return;
			}
			const postMessageId = await this.#getCommentPostId(commentChatId, channelChat.chatId);
			if (!postMessageId) {
				return;
			}
			await this.setLayout({
				name: im_v2_const.Layout.chat,
				entityId: channelChat.dialogId,
				contextId: postMessageId
			});
			await ui_vue3.nextTick();
			this.#emitter.emit(im_v2_const.EventType.dialog.openComments, {
				messageId: postMessageId,
				contextId: messageId
			});
		}
		async #getCommentPostId(commentChatId, channelChatId) {
			const knownPostId = im_v2_application_core.Core.getStore().getters['messages/comments/getMessageIdByChatId'](commentChatId);
			if (knownPostId) {
				return knownPostId;
			}
			return new im_v2_provider_service_message.MessageService({
				chatId: channelChatId
			}).loadContextByChatId(commentChatId).catch(error => {
				im_v2_lib_logger.Logger.error('LayoutManager: comment message context load failed', commentChatId, error);
				return 0;
			});
		}
		#onDesktopReload() {
			this.saveCurrentLayout();
		}

		// A saved chat layout would bring the user back to a section the default rule now hides, so the
		// name of the saved config goes through that rule while its chat and params stay. Params are
		// merged and not replaced: the default layout carries the id of the folder to open.
		#resolveSavedLayout(layoutConfig) {
			// The saved name comes from a session of an older version, and layout names do get renamed
			// (taskChat -> taskComments). Nothing is known about the chat of a name the dictionary lost,
			// so the default layout is opened alone.
			if (!this.isValidLayout(layoutConfig.name)) {
				return im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
					name: im_v2_const.Layout.chat
				};
			}
			if (layoutConfig.name !== im_v2_const.Layout.chat) {
				return layoutConfig;
			}
			const defaultLayout = im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
				name: im_v2_const.Layout.chat
			};
			return {
				...defaultLayout,
				entityId: layoutConfig.entityId,
				params: {
					...defaultLayout.params,
					...layoutConfig.params
				}
			};
		}
		#sendAnalytics(config) {
			// Forms open over the section the user is in and give it back on exit, so they are not tabs.
			if (this.isFormLayout(config.name)) {
				return;
			}
			const currentLayout = this.getLayout();
			if (currentLayout.name === config.name) {
				return;
			}
			if (config.name === im_v2_const.Layout.copilot) {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onOpenTab();
			}
			im_v2_lib_analytics.Analytics.getInstance().onOpenTab(config.name);
		}
		#saveOriginLayout() {
			const currentLayout = this.getLayout();
			if (this.isFormLayout(currentLayout.name)) {
				return;
			}
			this.#originLayout = {
				...currentLayout
			};
		}
		#isSameChat(config) {
			const {
				name,
				entityId
			} = this.getLayout();
			const sameLayout = name === config.name;
			const sameEntityId = entityId && entityId === config.entityId;
			return sameLayout && sameEntityId;
		}
		#handleLayoutChange() {
			this.#closeChannelComments();
			this.#handleChatChange();
		}
		#handleChatChange() {
			const {
				name,
				entityId
			} = this.getLayout();
			if (this.isChatLayout(name) && entityId) {
				this.#clearBulkActionsCollection();
			}
		}
		#handleSameChatReopen(config) {
			const {
				entityId: dialogId,
				contextId
			} = config;
			this.#closeChannelComments();
			if (contextId) {
				this.#emitter.emit(im_v2_const.EventType.dialog.goToMessageContext, {
					messageId: contextId,
					dialogId
				});
			}
		}
		#clearBulkActionsCollection() {
			im_v2_lib_bulkActions.BulkActionsManager.getInstance().clearCollection();
		}
		#closeChannelComments() {
			const {
				entityId: dialogId = ''
			} = this.getLayout();
			const isChannelOpened = im_v2_lib_channel.ChannelManager.isChannel(dialogId);
			if (isChannelOpened) {
				this.#emitter.emit(im_v2_const.EventType.dialog.closeComments);
			}
		}
		async #handleContextAccess(config) {
			const {
				contextId: messageId,
				entityId: dialogId
			} = config;
			if (!messageId) {
				return Promise.resolve(true);
			}
			const {
				hasAccess,
				errorCode
			} = await im_v2_lib_access.MessageAccessManager.checkMessageAccess(messageId);
			if (!hasAccess && errorCode === im_v2_const.ErrorCode.message.accessDeniedByTariff) {
				im_v2_lib_analytics.Analytics.getInstance().historyLimit.onGoToContextLimitExceeded({
					dialogId
				});
				im_v2_lib_feature.TariffManager.chatHistory.openFeatureSlider();
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		}
		#canSaveLastOpenedElement(layoutName, entityId) {
			if (LayoutsWithoutLastOpenedElement.has(layoutName)) {
				return false;
			}
			const {
				type
			} = this.#getChat(entityId);
			const isCollabV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			const isCollab = isCollabV2Available && type === im_v2_const.ChatType.collab;
			if (isCollab) {
				return false;
			}
			return !this.#isNestedChat(layoutName, entityId);
		}
		#getChat(dialogId) {
			return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		}
		#isNestedChat(layoutName, entityId) {
			if (!this.isChatLayout(layoutName)) {
				return false;
			}
			const {
				parentChatId
			} = this.#getChat(entityId);
			return parentChatId > 0;
		}
	}

	exports.LayoutManager = LayoutManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service);
//# sourceMappingURL=layout.bundle.js.map
