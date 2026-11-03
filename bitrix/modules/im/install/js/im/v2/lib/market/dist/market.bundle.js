/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_public, main_loader, main_popup) {
	'use strict';

	const MarketTypes = Object.freeze({
		user: 'user',
		chat: 'chat',
		lines: 'lines',
		crm: 'crm',
		all: 'all'
	});
	class AvailabilityManager {
		getAvailablePlacements(placements, dialogType = '') {
			return placements.filter(placement => this.#canShowPlacementInChat(placement, dialogType));
		}
		#canShowPlacementInChat(placement, dialogType) {
			if (!placement.options.context || !dialogType) {
				return true;
			}
			return placement.options.context.some(marketType => this.#matchDialogType(marketType, dialogType));
		}
		#matchDialogType(marketType, dialogType) {
			switch (String(marketType).toLowerCase()) {
				case MarketTypes.user:
					return this.#isUser(dialogType);
				case MarketTypes.chat:
					return this.#isChat(dialogType);
				case MarketTypes.lines:
					return this.#isLines(dialogType);
				case MarketTypes.crm:
					return this.#isCrm(dialogType);
				case MarketTypes.all:
					return true;
				default:
					return false;
			}
		}
		#isUser(dialogType) {
			return dialogType === im_v2_const.ChatType.user;
		}
		#isChat(dialogType) {
			return dialogType !== im_v2_const.ChatType.lines && dialogType !== im_v2_const.ChatType.crm && dialogType !== im_v2_const.ChatType.user;
		}
		#isLines(dialogType) {
			return dialogType === im_v2_const.ChatType.lines;
		}
		#isCrm(dialogType) {
			return dialogType === im_v2_const.ChatType.crm;
		}
	}

	class IframeCommunicationManager {
		#methodHandlers;
		#store;
		static init() {
			return new IframeCommunicationManager();
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#methodHandlers = {
				'im:getImTextareaContent': this.#handleGetImTextareaContent.bind(this),
				'im:setImTextareaContent': this.#handleSetImTextareaContent.bind(this)
			};
			main_core.Event.bind(window, 'message', this.#onMessageEvent.bind(this));
		}
		#onMessageEvent(messageEvent) {
			const {
				data: rawIframeContext,
				source
			} = messageEvent;
			if (!this.#isContextValid(rawIframeContext)) {
				return;
			}
			const sourcePlacement = this.#findSourcePlacement(source);
			if (!this.#isSenderValid(messageEvent, sourcePlacement)) {
				return;
			}
			const {
				method,
				requestId,
				callback,
				params
			} = rawIframeContext;
			const context = {
				requestId,
				callback,
				dialogId: this.#getSenderDialogId(sourcePlacement),
				messageEvent
			};
			const handler = this.#methodHandlers[method];
			if (handler) {
				handler(context, params);
			}
		}
		async #handleGetImTextareaContent(context) {
			try {
				const chatId = this.#getChatId(context.dialogId);
				const text = await im_public.Messenger.textarea.getText(chatId);
				this.#sendResponseToIframe(context, {
					result: {
						text
					}
				});
			} catch (error) {
				this.#sendResponseToIframe(context, {
					error: {
						message: error.message
					}
				});
			}
		}
		#handleSetImTextareaContent(context, params) {
			try {
				const {
					text = '',
					withNewLine = false,
					replace = false
				} = params;
				const chatId = this.#getChatId(context.dialogId);
				im_public.Messenger.textarea.insertText(chatId, text, {
					withNewLine,
					replace
				});
				this.#sendResponseToIframe(context, {
					result: {
						success: true
					}
				});
			} catch (error) {
				this.#sendResponseToIframe(context, {
					error: {
						message: error.message
					}
				});
			}
		}

		// a placement iframe stays alive while its popup is hidden, so the bridge cannot trust the origin
		// alone: a frame recognized among the loaded placements passes the whole set of checks - frame
		// identity, visibility, the origin of the application it was loaded for (a page the frame navigated
		// away to keeps no access) and the presence of the chat the placement was opened for. a window that
		// belongs to no placement is trusted by its origin alone, and only when it is the page origin
		// itself - a script running there already owns the whole document
		#isSenderValid(messageEvent, sourcePlacement) {
			if (!sourcePlacement) {
				return messageEvent.origin === window.location.origin;
			}
			const {
				layout,
				frame
			} = sourcePlacement;
			return this.#isFrameVisible(frame) && this.#isAppOrigin(layout, messageEvent.origin) && main_core.Type.isStringFilled(this.#getPlacementDialogId(layout));
		}

		// the frame of an application on its own hosting is loaded by a form submit and has no src,
		// so the origin is compared with the application parameters of the layout, the way rest does it
		#isAppOrigin(layout, origin) {
			const {
				appProto,
				appHost,
				appPort
			} = layout.params;
			if (!main_core.Type.isStringFilled(appProto) || !main_core.Type.isStringFilled(appHost)) {
				return false;
			}
			const appOrigin = `${appProto}://${appHost}`;

			// appHost keeps the port written in the application url, while the origin omits a default one
			return origin === appOrigin || `${origin}:${appPort}` === appOrigin;
		}
		#findSourcePlacement(source) {
			if (!source) {
				return null;
			}

			// a destroyed layout leaves a null record in the list instead of removing it
			const placements = Object.values(BX.rest?.layoutList ?? {}).filter(layout => main_core.Type.isObject(layout?.params)).map(layout => {
				return {
					layout,
					frame: document.getElementById(layout.params.frameName)
				};
			});
			return placements.find(({
				frame
			}) => frame?.contentWindow === source) ?? null;
		}
		#isFrameVisible(frame) {
			return frame.getClientRects().length > 0;
		}
		#isContextValid(rawContext) {
			if (!main_core.Type.isObject(rawContext)) {
				return false;
			}
			const {
				requestId,
				params,
				method
			} = rawContext;
			const isRequestIdValid = main_core.Type.isStringFilled(requestId);
			const isParamsValid = main_core.Type.isObject(params) || main_core.Type.isString(params);
			const isMethodValid = Object.hasOwn(this.#methodHandlers, method);
			return isRequestIdValid && isParamsValid && isMethodValid;
		}

		// a placement works with the chat it was opened for, and not with the one open in the messenger:
		// a chat shown over another chat keeps its own placements
		#getSenderDialogId(sourcePlacement) {
			if (!sourcePlacement) {
				return this.#getCurrentDialogId();
			}
			return this.#getPlacementDialogId(sourcePlacement.layout);
		}
		#getPlacementDialogId(layout) {
			return layout.params.placementOptions?.dialogId ?? '';
		}
		#getCurrentDialogId() {
			return this.#store.getters['application/getLayout'].entityId;
		}
		#getChatId(dialogId) {
			const dialog = this.#store.getters['chats/get'](dialogId, true);
			// the getter answers with a blank chat when the dialog is not in the collection
			const chatId = dialog?.chatId ?? 0;
			if (chatId <= 0) {
				throw new Error('Chat of the placement dialog is not available');
			}
			return chatId;
		}
		#sendResponseToIframe(context, data) {
			const {
				messageEvent,
				requestId,
				callback
			} = context;
			if (!messageEvent.source || !callback) {
				return;
			}
			const message = this.#buildResponseMessage(callback, requestId, data);
			messageEvent.source.postMessage(message, messageEvent.origin);
		}
		#buildResponseMessage(callback, requestId, data) {
			const payload = data.result ?? data.error ?? {};
			return `${callback}:${JSON.stringify({
			requestId,
			...payload
		})}`;
		}
	}

	class MarketService {
		#loadLink = '';
		openPlacement(item, context) {
			return new Promise((resolve, reject) => {
				const formData = new FormData();
				Object.entries(item.loadConfiguration).forEach(([key, value]) => {
					formData.append(`PARAMS[params][${key}]`, value);
				});
				Object.entries(this.#getPlacementOptions(context)).forEach(([key, value]) => {
					formData.append(`PARAMS[params][PLACEMENT_OPTIONS][${key}]`, value);
				});
				const requestPrams = {
					method: 'POST',
					body: formData
				};
				fetch(this.#loadLink, requestPrams).then(response => response.text()).then(textResponse => resolve(textResponse)).catch(error => reject(error));
			});
		}
		setLoadLink(link) {
			this.#loadLink = link;
		}
		#getPlacementOptions(context) {
			const placementOptions = {};
			if (context.dialogId) {
				placementOptions.dialogId = context.dialogId;
			}
			if (context.messageId) {
				placementOptions.messageId = context.messageId;
			}
			return placementOptions;
		}
	}

	const POPUP_ID_PREFIX = 'im-market-app-popup';
	const POPUP_BORDER_RADIUS = '10px';
	// compensates the margin the popup reserves above the bind element for its shadow
	const POPUP_OFFSET_TOP = -10;
	const LOADER_SIZE = 40;
	const MAX_LIVE_PLACEMENTS = 8;
	const getKey = (dialogId, appId) => `${dialogId}|${appId}`;

	/**
	 * Owns the popups of the textarea placements: an iframe is only alive while it stays in the DOM,
	 * so both the popup and its container are created here and outlive the Vue panel of the chat.
	 */
	class PlacementPopupManager {
		#loadPlacement;
		#unloadPlacement;
		#store;

		// popup instances must stay out of any reactive proxy - Vue breaks their private fields,
		// so only this map lives here, while all the readable state belongs to the market model
		#placements = new Map();
		constructor(handlers) {
			this.#loadPlacement = handlers.loadPlacement;
			this.#unloadPlacement = handlers.unloadPlacement;
			this.#store = handlers.store;
		}
		show(options) {
			const {
				dialogId,
				appId,
				bindElement
			} = options;
			const openedAppId = this.#getOpenedAppId(dialogId);
			if (main_core.Type.isStringFilled(openedAppId) && openedAppId !== appId) {
				this.close(dialogId, openedAppId);
			}
			const placement = this.#getAlivePlacement(dialogId, appId) ?? this.#createPlacement(options);
			this.#touchPlacement(placement);

			// the panel of every chat has its own icons, so the anchor is taken anew on each show
			placement.popup.setBindElement(bindElement);
			placement.popup.show();
			placement.popup.adjustPosition({
				forceBindPosition: true,
				position: 'top'
			});
			void this.#store.dispatch('market/setOpenedPlacement', {
				dialogId,
				appId
			});
			this.#evictExtraPlacements();
		}
		close(dialogId, appId) {
			// Popup.destroy() emits no close event, so a popup destroyed from outside
			// has to be disassembled here - otherwise the chat keeps it as opened
			this.#getAlivePlacement(dialogId, appId)?.popup.close();
		}
		closeDialog(dialogId) {
			const openedAppId = this.#getOpenedAppId(dialogId);
			if (main_core.Type.isStringFilled(openedAppId)) {
				this.close(dialogId, openedAppId);
			}
		}
		destroyPlacement(dialogId, appId) {
			const key = getKey(dialogId, appId);
			const placement = this.#placements.get(key);
			if (!placement) {
				return;
			}
			this.#placements.delete(key);
			this.#setLivePlacements(this.#getLivePlacements().filter(livePlacement => {
				return getKey(livePlacement.dialogId, livePlacement.appId) !== key;
			}));
			this.#clearOpenedApp(dialogId, appId);
			this.#unloadPlacement(appId, dialogId);
			placement.popup.destroy();
			im_v2_lib_logger.Logger.warn(`MarketManager: placement ${key} destroyed`);
		}
		destroyAll() {
			[...this.#placements.values()].forEach(({
				dialogId,
				appId
			}) => {
				this.destroyPlacement(dialogId, appId);
			});
		}
		#getAlivePlacement(dialogId, appId) {
			const placement = this.#placements.get(getKey(dialogId, appId)) ?? null;
			if (placement && placement.popup.isDestroyed()) {
				// somebody outside destroyed the popup and its DOM, so the iframe is dead anyway
				this.destroyPlacement(dialogId, appId);
				return null;
			}
			return placement;
		}
		#createPlacement(options) {
			const {
				dialogId,
				appId,
				width,
				height,
				bindElement
			} = options;
			const key = getKey(dialogId, appId);
			const frameContainer = main_core.Tag.render`<div class="bx-im-market-placement__frame"></div>`;
			const loaderContainer = main_core.Tag.render`<div class="bx-im-market-placement__loader"></div>`;
			const content = main_core.Tag.render`
			<div class="bx-im-market-placement__container">${loaderContainer}${frameContainer}</div>
		`;
			const popupId = `${POPUP_ID_PREFIX}-${dialogId}-${appId}`;
			main_popup.PopupManager.getPopupById(popupId)?.destroy();
			const placement = {
				key,
				dialogId,
				appId,
				frameContainer,
				popup: new main_popup.Popup({
					id: popupId,
					content,
					width,
					height,
					bindElement,
					bindOptions: {
						position: 'top'
					},
					offsetTop: POPUP_OFFSET_TOP,
					offsetLeft: 0,
					padding: 0,
					className: 'bx-im-messenger__scope',
					// a closed popup keeps its content: the iframe survives until the placement is destroyed
					cacheable: true,
					closeIcon: false,
					autoHide: true,
					closeByEsc: true,
					animation: false,
					borderRadius: POPUP_BORDER_RADIUS,
					contentBorderRadius: POPUP_BORDER_RADIUS,
					events: {
						onPopupClose: () => this.#onPopupClose(placement)
					}
				})
			};
			this.#placements.set(key, placement);
			this.#loadFrame(placement, loaderContainer);
			im_v2_lib_logger.Logger.warn(`MarketManager: placement ${key} created`);
			return placement;
		}
		#loadFrame(placement, loaderContainer) {
			const loader = new main_loader.Loader({
				target: loaderContainer,
				size: LOADER_SIZE,
				mode: 'inline'
			});
			void loader.show();
			const releaseLoader = () => {
				loader.destroy();
				main_core.Dom.remove(loaderContainer);
			};
			void this.#loadPlacement(placement.appId, placement.dialogId).then(layoutHtml => {
				releaseLoader();

				// the same key may already belong to a recreated placement - only the own one counts
				if (this.#placements.get(placement.key) !== placement) {
					return;
				}
				main_core.Runtime.html(placement.frameContainer, layoutHtml);
			}).catch(() => {
				releaseLoader();
				if (this.#placements.get(placement.key) !== placement) {
					return;
				}
				this.destroyPlacement(placement.dialogId, placement.appId);
			});
		}
		#onPopupClose(placement) {
			this.#clearOpenedApp(placement.dialogId, placement.appId);
		}
		#getOpenedAppId(dialogId) {
			return this.#store.getters['market/getOpenedAppId'](dialogId);
		}
		#getLivePlacements() {
			return this.#store.getters['market/getLivePlacements'];
		}
		#setLivePlacements(placements) {
			void this.#store.dispatch('market/setLivePlacements', {
				placements
			});
		}
		#touchPlacement({
			dialogId,
			appId
		}) {
			const rest = this.#getLivePlacements().filter(livePlacement => {
				return getKey(livePlacement.dialogId, livePlacement.appId) !== getKey(dialogId, appId);
			});
			this.#setLivePlacements([{
				dialogId,
				appId
			}, ...rest]);
		}
		#evictExtraPlacements() {
			const livePlacements = this.#getLivePlacements();
			const overflow = livePlacements.length - MAX_LIVE_PLACEMENTS;
			if (overflow <= 0) {
				return;
			}

			// walk from the least recent tail; an opened placement is visible right now and is never evicted
			const extraPlacements = [...livePlacements].reverse().filter(({
				dialogId,
				appId
			}) => this.#getOpenedAppId(dialogId) !== appId).slice(0, overflow);
			extraPlacements.forEach(({
				dialogId,
				appId
			}) => {
				this.destroyPlacement(dialogId, appId);
			});
		}
		#clearOpenedApp(dialogId, appId) {
			// the action itself keeps the record when another application is already opened there
			void this.#store.dispatch('market/clearOpenedPlacement', {
				dialogId,
				appId
			});
		}
	}

	class MarketManager {
		static #instance;
		#store;
		#marketService;
		#availabilityManager;
		#placementPopupManager;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		static init() {
			MarketManager.getInstance();
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#marketService = new MarketService();
			this.#availabilityManager = new AvailabilityManager();
			this.#placementPopupManager = new PlacementPopupManager({
				loadPlacement: (appId, dialogId) => this.loadPlacement(appId, {
					dialogId
				}),
				unloadPlacement: (appId, dialogId) => this.unloadPlacement(appId, dialogId),
				store: this.#store
			});

			// third-party iframes must not outlive the messenger they were opened in
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.slider.onClose, this.#onSliderClose);
			const {
				marketApps
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('MarketManager: marketApps', marketApps);
			this.#init(marketApps);
		}
		#onSliderClose = () => {
			this.#placementPopupManager.destroyAll();
		};
		getAvailablePlacementsByType(placementType, dialogId = '') {
			const placements = this.#store.getters['market/getByPlacement'](placementType);
			const dialog = this.#store.getters['chats/get'](dialogId);
			const dialogType = dialog ? dialog.type : '';
			return this.#availabilityManager.getAvailablePlacements(placements, dialogType);
		}
		loadPlacement(id, context = {}) {
			const placement = this.#store.getters['market/getById'](Number.parseInt(id, 10));
			return this.#marketService.openPlacement(placement, context);
		}
		unloadPlacement(placementId, dialogId = '') {
			const placementLayouts = Object.values(BX.rest?.layoutList ?? {}).filter(layout => {
				// a destroyed layout leaves a null record in the list instead of removing it
				if (!main_core.Type.isObject(layout?.params)) {
					return false;
				}
				if (layout.params.placementId !== placementId) {
					return false;
				}

				// the same application can be loaded in several chats at once (chat over chat) -
				// when the dialog is known, only its own layouts are destroyed
				return !main_core.Type.isStringFilled(dialogId) || layout.params.placementOptions?.dialogId === dialogId;
			});
			placementLayouts.forEach(layout => {
				layout.destroy();
			});
		}
		showPlacement(options) {
			this.#placementPopupManager.show(options);
		}
		closePlacement(dialogId, appId) {
			this.#placementPopupManager.close(dialogId, appId);
		}
		closeDialogPlacement(dialogId) {
			this.#placementPopupManager.closeDialog(dialogId);
		}
		static async openSlider(placement, context) {
			await main_core.Runtime.loadExtension('applayout');
			BX.rest.AppLayout.openApplication(placement.loadConfiguration.ID, context, placement.loadConfiguration);
		}
		static openChatMarket() {
			const placementCode = 'IM_CHAT';
			BX.SidePanel.Instance.open(`/market/?placement=${placementCode}`);
		}
		#init(marketApps) {
			if (!marketApps) {
				return;
			}
			void this.#store.dispatch('market/set', marketApps);
			this.#marketService.setLoadLink(marketApps.links.load);
			IframeCommunicationManager.init();
		}
	}

	exports.MarketManager = MarketManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Main);
//# sourceMappingURL=market.bundle.js.map
