/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_application_core, im_v2_const, im_v2_lib_access, im_v2_lib_analytics, im_v2_lib_bulkActions, im_v2_lib_channel, im_v2_lib_feature, im_v2_lib_localStorage, im_v2_lib_logger) {
	'use strict';

	const TypesWithoutContext = new Set([im_v2_const.ChatType.comment]);
	const LayoutsWithoutLastOpenedElement = new Set([im_v2_const.Layout.channel, im_v2_const.Layout.market, im_v2_const.Layout.taskComments]);
	class LayoutManager {
		static #instance;
		#emitter;
		#lastOpenedElement = {};
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
		getLayout() {
			return im_v2_application_core.Core.getStore().getters['application/getLayout'];
		}
		saveCurrentLayout() {
			const currentLayout = this.getLayout();
			im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.layoutConfig, {
				name: currentLayout.name,
				entityId: currentLayout.entityId
			});
		}
		prepareInitialLayout() {
			const layoutConfig = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.layoutConfig);
			if (!layoutConfig) {
				return this.setLayout({
					name: im_v2_const.Layout.chat
				});
			}
			im_v2_lib_logger.Logger.warn('LayoutManager: last layout was restored', layoutConfig);
			im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(im_v2_const.LocalStorageKey.layoutConfig);
			return this.setLayout(layoutConfig);
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
		clearCurrentLayoutEntityId() {
			const currentLayoutName = this.getLayout().name;
			void this.setLayout({
				name: currentLayoutName
			});
			void this.deleteLastOpenedElement(currentLayoutName);
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
			const chatLayouts = new Set([im_v2_const.Layout.chat, im_v2_const.Layout.channel, im_v2_const.Layout.copilot, im_v2_const.Layout.openlines, im_v2_const.Layout.openlinesV2, im_v2_const.Layout.collab, im_v2_const.Layout.taskComments]);
			return chatLayouts.has(layoutName);
		}
		isChatFormLayout(layoutName) {
			const formLayouts = new Set([im_v2_const.Layout.createChat, im_v2_const.Layout.updateChat]);
			return formLayouts.has(layoutName);
		}
		async #onGoToMessageContext(event) {
			const {
				dialogId,
				messageId
			} = event.getData();
			if (this.getLayout().entityId === dialogId) {
				return;
			}
			const {
				type
			} = this.#getChat(dialogId);
			if (TypesWithoutContext.has(type)) {
				return;
			}
			void this.setLayout({
				name: im_v2_const.Layout.chat,
				entityId: dialogId,
				contextId: messageId
			});
		}
		#onDesktopReload() {
			this.saveCurrentLayout();
		}
		#sendAnalytics(config) {
			const currentLayout = this.getLayout();
			if (currentLayout.name === config.name) {
				return;
			}
			if (config.name === im_v2_const.Layout.copilot) {
				im_v2_lib_analytics.Analytics.getInstance().copilot.onOpenTab();
			}
			im_v2_lib_analytics.Analytics.getInstance().onOpenTab(config.name);
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
			} = await im_v2_lib_access.AccessManager.checkMessageAccess(messageId);
			if (!hasAccess && errorCode === im_v2_const.ErrorCode.message.accessDeniedByTariff) {
				im_v2_lib_analytics.Analytics.getInstance().historyLimit.onGoToContextLimitExceeded({
					dialogId
				});
				im_v2_lib_feature.FeatureManager.chatHistory.openFeatureSlider();
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
			const isCollab = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isNestedListAvailable) && type === im_v2_const.ChatType.collab;
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

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=layout.bundle.js.map
