/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_sidepanel, im_v2_application_core, im_v2_lib_call, im_v2_lib_phone, im_v2_lib_smileManager, im_v2_lib_user, im_v2_lib_counter, im_v2_lib_logger, im_v2_lib_messageNotifier, im_v2_lib_market, im_v2_lib_desktop, im_v2_lib_promo, im_v2_lib_permission, im_v2_lib_updateState_manager, im_v2_lib_router, im_v2_lib_guest, im_v2_const, im_public) {
	'use strict';

	const BindingsCondition = {
		openLinesHistory: new RegExp(`\\?${im_v2_const.GetParameter.openHistory}=([^&]+)`, 'i'),
		openLines: new RegExp(`\\?${im_v2_const.GetParameter.openLines}=([^&]+)`, 'i'),
		openCopilotChat: new RegExp(`\\?${im_v2_const.GetParameter.openCopilotChat}=([^&]+)`, 'i'),
		openChannel: new RegExp(`\\?${im_v2_const.GetParameter.openChannel}=([^&]+)`, 'i'),
		openCollab: new RegExp(`\\?${im_v2_const.GetParameter.openCollab}=([^&]+)`, 'i'),
		openSharedLink: new RegExp(`\\?${im_v2_const.GetParameter.openSharedLink}=([^&]+)`, 'i'),
		openTaskComments: new RegExp(`\\?${im_v2_const.GetParameter.openTaskComments}=([^&]+)(&${im_v2_const.GetParameter.openMessage}=([^&]+))?`, 'i'),
		openBotContext: new RegExp(`\\?${im_v2_const.GetParameter.openChat}=([^&]+)(&${im_v2_const.GetParameter.botContext}=([^&]+))`, 'i'),
		openChat: new RegExp(`\\?${im_v2_const.GetParameter.openChat}=([^&]+)(&${im_v2_const.GetParameter.openMessage}=([^&]+))?`, 'i'),
		openOriginRoot: new RegExp(`${location.origin}/online/$`),
		openRoot: /^\/online\/$/,
		openExtranetRoot: /^\/extranet\/online\/$/,
		openCollabLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openCollab}(?=&|$)`, 'i'),
		openCopilotChatLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openCopilotChat}(?=&|$)`, 'i'),
		openChannelLayout: new RegExp(`/online/\\?${im_v2_const.GetParameter.openChannel}(?=&|$)`, 'i')
	};

	class BindingsManager {
		#conditionHandler = {
			[BindingsCondition.openCopilotChat]: params => this.#openCopilot(params),
			[BindingsCondition.openChannel]: params => this.#openChannel(params),
			[BindingsCondition.openLinesHistory]: params => this.#openLinesHistory(params),
			[BindingsCondition.openLines]: params => this.#openLines(params),
			[BindingsCondition.openCollab]: params => this.#openCollab(params),
			[BindingsCondition.openTaskComments]: params => this.#openTaskComments(params),
			[BindingsCondition.openBotContext]: params => this.#openChatWithBotContext(params),
			[BindingsCondition.openChat]: params => this.#openChat(params),
			[BindingsCondition.openSharedLink]: params => this.#openSharedLink(params),
			[BindingsCondition.openOriginRoot]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.chat
			}),
			[BindingsCondition.openRoot]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.chat
			}),
			[BindingsCondition.openExtranetRoot]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.chat
			}),
			[BindingsCondition.openChannelLayout]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.channel
			}),
			[BindingsCondition.openCollabLayout]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.collab
			}),
			[BindingsCondition.openCopilotChatLayout]: () => this.#openNavigationItem({
				id: im_v2_const.ChatType.copilot
			})
		};
		routeLink(url) {
			const condition = this.#findMatchingCondition(url);
			if (!this.#conditionHandler[condition]) {
				return;
			}
			const currentUrl = new URL(url, location.origin);
			const searchParams = currentUrl.searchParams;
			this.#conditionHandler[condition](searchParams);
		}
		#findMatchingCondition(url) {
			for (const regex of Object.values(BindingsCondition)) {
				const isMatch = regex.exec(url);
				if (isMatch) {
					return regex;
				}
			}
			return null;
		}
		#openNavigationItem({
			id,
			asLink = true
		}) {
			void im_public.Messenger.openNavigationItem({
				id,
				asLink
			});
		}
		#openLinesHistory(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openHistory);
			void im_public.Messenger.openLinesHistory(dialogId);
		}
		#openLines(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openLines);
			void im_public.Messenger.openLines(dialogId);
		}
		#openCopilot(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openCopilotChat);
			void im_public.Messenger.openCopilot(dialogId);
		}
		#openChannel(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openChannel);
			void im_public.Messenger.openChannel(dialogId);
		}
		#openCollab(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openCollab);
			void im_public.Messenger.openCollab(dialogId);
		}
		#openTaskComments(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openTaskComments);
			const messageId = Number(params.get(im_v2_const.GetParameter.openMessage)) || 0;
			void im_public.Messenger.openTaskComments(dialogId, messageId);
		}
		#openChat(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openChat);
			const messageId = Number(params.get(im_v2_const.GetParameter.openMessage)) || 0;
			void im_public.Messenger.openChat(dialogId, messageId);
		}
		#openChatWithBotContext(params) {
			const dialogId = params.get(im_v2_const.GetParameter.openChat);
			const botContext = params.get(im_v2_const.GetParameter.botContext);
			let decodedContext = {};
			try {
				decodedContext = JSON.parse(decodeURIComponent(botContext));
			} catch (error) {
				console.error('Im bindings: incorrect bot context', error);
			}
			void im_public.Messenger.openChatWithBotContext(dialogId, decodedContext);
		}
		#openSharedLink(params) {
			const code = params.get(im_v2_const.GetParameter.openSharedLink);
			void im_public.Messenger.joinChatByCode(code);
		}
	}

	const PreloadedEntity = {
		users: 'users'
	};

	class InitManager {
		static #instance;
		static #inited = false;
		static getInstance() {
			InitManager.#instance = InitManager.#instance ?? new InitManager();
			return InitManager.#instance;
		}
		static init() {
			InitManager.getInstance();
		}
		constructor() {
			if (InitManager.#inited) {
				return;
			}
			this.#initLogger();
			im_v2_lib_logger.Logger.warn('InitManager: start');
			this.#initSettings();
			this.#initTariffRestrictions();
			this.#initAnchors();
			this.#initCallManager();
			this.#initCopilot();
			this.#initPreloadedEntities();
			this.#initCurrentUserAdminStatus();
			this.#initGuestState();
			this.#initBindings();
			im_v2_lib_counter.CounterManager.init();
			im_v2_lib_permission.PermissionManager.init();
			im_v2_lib_promo.PromoManager.init();
			im_v2_lib_market.MarketManager.init();
			im_v2_lib_phone.PhoneManager.init();
			im_v2_lib_smileManager.SmileManager.init();
			im_v2_lib_messageNotifier.MessageNotifierManager.init();
			im_v2_lib_desktop.DesktopManager.init();
			im_v2_lib_updateState_manager.UpdateStateManager.init();
			im_v2_lib_router.Router.handleGetParams();
			InitManager.#inited = true;
		}
		#initLogger() {
			const {
				loggerConfig
			} = im_v2_application_core.Core.getApplicationData();
			if (!loggerConfig) {
				return;
			}
			im_v2_lib_logger.Logger.setConfig(loggerConfig);
		}
		#initSettings() {
			const {
				settings
			} = im_v2_application_core.Core.getApplicationData();
			if (!settings) {
				return;
			}
			im_v2_lib_logger.Logger.warn('InitManager: settings', settings);
			void im_v2_application_core.Core.getStore().dispatch('application/settings/set', settings);
		}
		#initTariffRestrictions() {
			const {
				tariffRestrictions
			} = im_v2_application_core.Core.getApplicationData();
			if (!tariffRestrictions) {
				return;
			}
			im_v2_lib_logger.Logger.warn('InitManager: tariffRestrictions', tariffRestrictions);
			void im_v2_application_core.Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
		}
		#initCallManager() {
			const {
				activeCalls
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_call.CallManager.getInstance().updateRecentCallsList(activeCalls);
		}
		#initAnchors() {
			const {
				anchors
			} = im_v2_application_core.Core.getApplicationData();
			if (!anchors) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('messages/anchors/setAnchors', {
				anchors
			});
		}
		#initCopilot() {
			const {
				copilot
			} = im_v2_application_core.Core.getApplicationData();
			void im_v2_application_core.Core.getStore().dispatch('copilot/setName', copilot.botName);
			void im_v2_application_core.Core.getStore().dispatch('copilot/setAgentName', copilot.agentName);
			void im_v2_application_core.Core.getStore().dispatch('copilot/setSuggests', copilot.suggests ?? []);
			if (!copilot.availableEngines) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('copilot/setAvailableAIModels', copilot.availableEngines);
		}
		#initPreloadedEntities() {
			const {
				preloadedEntities
			} = im_v2_application_core.Core.getApplicationData();
			if (!preloadedEntities) {
				return;
			}
			const preloadedEntitiesHandler = {
				[PreloadedEntity.users]: users => new im_v2_lib_user.UserManager().setUsersToModel(users)
			};
			Object.entries(preloadedEntities).forEach(([entityType, items]) => {
				if (preloadedEntitiesHandler[entityType]) {
					preloadedEntitiesHandler[entityType](items);
				}
			});
		}
		#initCurrentUserAdminStatus() {
			const {
				isCurrentUserAdmin
			} = im_v2_application_core.Core.getApplicationData();
			void im_v2_application_core.Core.getStore().dispatch('users/setCurrentUserAdminStatus', isCurrentUserAdmin);
		}
		#initGuestState() {
			const {
				isGuestWelcome,
				videoCallsTermsUrl
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_guest.GuestManager.getInstance().setGuestNamePopupState(isGuestWelcome);
			im_v2_lib_guest.GuestManager.getInstance().setTermsOfServiceUrl(videoCallsTermsUrl);
		}
		#initBindings() {
			main_sidepanel.SidePanel.Instance.bindAnchors({
				rules: [{
					condition: Object.values(BindingsCondition),
					handler(event, link) {
						new BindingsManager().routeLink(link.url);
						event.preventDefault();
					}
				}]
			});
		}
	}

	exports.InitManager = InitManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.SidePanel, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=init.bundle.js.map
