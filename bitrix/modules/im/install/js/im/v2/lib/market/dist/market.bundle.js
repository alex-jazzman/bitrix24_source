/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_logger, im_v2_const, im_public) {
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
			switch (marketType) {
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
				origin,
				data: rawIframeContext
			} = messageEvent;
			if (!this.#isOriginValid(origin) || !this.#isContextValid(rawIframeContext)) {
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
				messageEvent
			};
			const handler = this.#methodHandlers[method];
			if (handler) {
				handler(context, params);
			}
		}
		async #handleGetImTextareaContent(context) {
			try {
				const chatId = this.#getChatId();
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
				const chatId = this.#getChatId();
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
		#isOriginValid(origin) {
			if (origin === window.location.origin) {
				return true;
			}
			return this.#isRegisteredAppOrigin(origin);
		}
		#isRegisteredAppOrigin(origin) {
			return Object.values(BX.rest.layoutList).some(layout => {
				const {
					appProto,
					appHost,
					appPort
				} = layout.params;
				const appOrigin = `${appProto}://${appHost}`;
				const originWithPort = `${origin}:${appPort}`;
				return origin === appOrigin || originWithPort === appOrigin;
			});
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
			const isMethodValid = method in this.#methodHandlers;
			return isRequestIdValid && isParamsValid && isMethodValid;
		}
		#getChatId() {
			const dialogId = this.#store.getters['application/getLayout'].entityId;
			const dialog = this.#store.getters['chats/get'](dialogId, true);
			return dialog.chatId;
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

	class MarketManager {
		static #instance;
		#store;
		#marketService;
		#availabilityManager;
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
			const {
				marketApps
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('MarketManager: marketApps', marketApps);
			this.#init(marketApps);
		}
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
		unloadPlacement(placementId) {
			const appLayoutNew = Object.values(BX.rest.layoutList).filter(layout => {
				return layout.params.placementId === placementId;
			});
			if (appLayoutNew.length > 0) {
				appLayoutNew.forEach(layout => {
					layout.destroy();
				});
			}
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

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=market.bundle.js.map
