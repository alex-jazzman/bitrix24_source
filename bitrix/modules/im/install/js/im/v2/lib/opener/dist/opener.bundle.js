/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_const, im_v2_lib_call, im_v2_lib_createChat, im_v2_lib_desktopApi, im_v2_lib_feature, im_v2_lib_folder, im_v2_lib_layout, im_v2_lib_logger, im_v2_lib_navigation, im_v2_lib_phone, im_v2_lib_slider, im_v2_lib_utils, im_v2_provider_service_bot, im_v2_provider_service_chat, im_v2_application_core, main_sidepanel, im_v2_lib_recent) {
	'use strict';

	class LinesService {
		async getDialogIdByUserCode(userCode) {
			const result = await im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.linesDialogGet, {
				USER_CODE: userCode
			}).catch(errorResult => {
				console.error('LinesService: error getting dialog id', errorResult.error());
			});
			const {
				dialog_id: dialogId
			} = result.data();
			return dialogId;
		}
	}

	const isChatNestedInCollab = async dialogId => {
		if (!im_v2_lib_utils.Utils.dialog.isChatDialogId(dialogId)) {
			return false;
		}
		const store = im_v2_application_core.Core.getStore();
		if (!store.getters['chats/get'](dialogId)) {
			await new im_v2_provider_service_chat.ChatService().loadChat(dialogId).catch(() => {});
		}
		const chat = store.getters['chats/get'](dialogId);
		return Boolean(chat) && chat.parentChatId > 0 && !im_v2_lib_recent.RecentManager.isTypeWithNestedChats(chat.type);
	};
	const checkHistoryDialogId = dialogId => {
		return im_v2_lib_utils.Utils.dialog.isLinesHistoryId(dialogId) || im_v2_lib_utils.Utils.dialog.isLinesExternalId(dialogId);
	};
	const prepareHistorySliderLink = dialogId => {
		const getParams = new URLSearchParams({
			[im_v2_const.GetParameter.openHistory]: dialogId,
			[im_v2_const.GetParameter.backgroundType]: 'light',
			[im_v2_const.GetParameter.legacyMode]: 'Y'
		});
		return `${im_v2_const.Path.history}?${getParams.toString()}`;
	};
	const openHistoryInSidePanel = dialogId => {
		const sidePanelManager = main_sidepanel.SidePanel.Instance;
		sidePanelManager.open(prepareHistorySliderLink(dialogId), {
			width: im_v2_lib_utils.Utils.dialog.isLinesExternalId(dialogId) ? 700 : 1000,
			allowChangeHistory: false,
			allowChangeTitle: false,
			cacheable: false
		});
	};
	const normalizeEntityId = entityId => {
		if (main_core.Type.isString(entityId)) {
			return entityId;
		}
		if (main_core.Type.isNumber(entityId)) {
			return entityId.toString();
		}
		return '';
	};
	const handleOpenTarget = async config => {
		if (shouldOpenNewTab()) {
			openChatInNewTab(config);
			return;
		}
		await openChatInSlider(config);
	};
	const shouldOpenNewTab = () => {
		if (isEmbeddedModeWithActiveSlider()) {
			return true;
		}
		const messengerSlider = im_v2_lib_slider.MessengerSlider.getInstance();
		return messengerSlider.isOpened() && !messengerSlider.isFocused();
	};
	const isEmbeddedModeWithActiveSlider = () => {
		const sidePanelManager = main_sidepanel.SidePanel.Instance;
		return im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode() && sidePanelManager.getOpenSlidersCount() > 0;
	};
	const openChatInNewTab = ({
		navigationItem,
		dialogId,
		messageId
	}) => {
		const getParams = new URLSearchParams();
		const urlParameter = getUrlParameterForNavigation(navigationItem);
		if (main_core.Type.isStringFilled(dialogId)) {
			getParams.append(urlParameter, dialogId);
		}
		if (messageId > 0) {
			getParams.append(im_v2_const.GetParameter.openMessage, messageId);
		}
		im_v2_lib_utils.Utils.browser.openLink(`${im_v2_const.Path.online}?${getParams.toString()}`);
	};
	const openChatInSlider = async ({
		navigationItem,
		dialogId,
		messageId
	}) => {
		await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
		const layoutParams = {
			name: navigationItem,
			entityId: dialogId
		};
		if (messageId > 0) {
			layoutParams.contextId = messageId;
		}
		await im_v2_lib_layout.LayoutManager.getInstance().setLayout(layoutParams);
	};

	// A layout name outside the map falls back to the chat parameter: the new tab opens `/online/` with
	// the dialog and picks the section on its own, the way the start of a session does.
	const getUrlParameterForNavigation = navigationItem => {
		const navigationToGetParameterMap = {
			[im_v2_const.NavigationMenuItem.chat]: im_v2_const.GetParameter.openChat,
			[im_v2_const.NavigationMenuItem.openlines]: im_v2_const.GetParameter.openLines,
			[im_v2_const.NavigationMenuItem.openlinesV2]: im_v2_const.GetParameter.openLines,
			[im_v2_const.NavigationMenuItem.copilot]: im_v2_const.GetParameter.openCopilotChat,
			[im_v2_const.NavigationMenuItem.channel]: im_v2_const.GetParameter.openChannel,
			[im_v2_const.NavigationMenuItem.collab]: im_v2_const.GetParameter.openCollab,
			[im_v2_const.NavigationMenuItem.tasksTask]: im_v2_const.GetParameter.openTaskComments
		};
		return navigationToGetParameterMap[navigationItem] ?? im_v2_const.GetParameter.openChat;
	};

	const Opener = {
		async openChat(dialogId = '', messageId = 0) {
			const preparedDialogId = dialogId.toString();
			if (im_v2_lib_utils.Utils.dialog.isLinesExternalId(preparedDialogId)) {
				return this.openLines(preparedDialogId);
			}
			const config = {
				navigationItem: im_v2_lib_folder.FolderManager.getRegularChatsLayout().name,
				dialogId: preparedDialogId,
				messageId
			};
			await handleOpenTarget(config);
			return Promise.resolve();
		},
		async openChatWithBotContext(dialogId, context) {
			const preparedDialogId = dialogId.toString();
			const botContextService = new im_v2_provider_service_bot.BotContextService();
			botContextService.scheduleContextRequest(preparedDialogId, context);
			return this.openChat(preparedDialogId);
		},
		async openLines(dialogId = '') {
			let preparedDialogId = dialogId.toString();
			if (im_v2_lib_utils.Utils.dialog.isLinesExternalId(preparedDialogId)) {
				const linesService = new LinesService();
				preparedDialogId = await linesService.getDialogIdByUserCode(preparedDialogId);
			}
			const optionOpenLinesV2Activated = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2);
			const navigationItem = optionOpenLinesV2Activated ? im_v2_const.NavigationMenuItem.openlinesV2 : im_v2_const.NavigationMenuItem.openlines;
			const config = {
				navigationItem,
				dialogId: preparedDialogId
			};
			await handleOpenTarget(config);
			return Promise.resolve();
		},
		async openCopilot(dialogId = '', contextId = 0) {
			const config = {
				navigationItem: im_v2_const.NavigationMenuItem.copilot,
				dialogId: dialogId.toString(),
				messageId: contextId
			};
			await handleOpenTarget(config);
			return Promise.resolve();
		},
		async openCollab(dialogId = '', options = {}) {
			const preparedDialogId = dialogId.toString();
			if (!im_v2_lib_feature.TariffManager.collab.isAvailable()) {
				im_v2_lib_feature.TariffManager.collab.openFeatureSlider();
				return null;
			}
			if (shouldOpenNewTab()) {
				openChatInNewTab({
					navigationItem: im_v2_const.NavigationMenuItem.collab,
					dialogId: preparedDialogId
				});
				return Promise.resolve();
			}
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			if (await isChatNestedInCollab(preparedDialogId)) {
				return im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.collab,
					entityId: preparedDialogId
				});
			}
			const withCollabId = main_core.Type.isStringFilled(preparedDialogId);
			const isCollabV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
			if (!withCollabId || !isCollabV2Available) {
				return im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.collab,
					entityId: preparedDialogId
				});
			}
			if (!im_v2_lib_utils.Utils.dialog.isChatDialogId(dialogId) && !im_v2_lib_utils.Utils.dialog.isGroupExternalId(dialogId)) {
				return Promise.resolve();
			}
			await this.openCollab();
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.openNestedList, {
				parentDialogId: dialogId,
				options
			});
			return Promise.resolve();
		},
		async openChannel(dialogId = '') {
			const config = {
				navigationItem: im_v2_const.NavigationMenuItem.channel,
				dialogId: dialogId.toString()
			};
			await handleOpenTarget(config);
			return Promise.resolve();
		},
		async openTaskComments(dialogId = '', messageId = 0) {
			const config = {
				navigationItem: im_v2_const.NavigationMenuItem.tasksTask,
				dialogId: dialogId.toString(),
				messageId
			};
			await handleOpenTarget(config);
			return Promise.resolve();
		},
		openHistory(dialogId = '') {
			if (im_v2_lib_utils.Utils.dialog.isDialogId(dialogId)) {
				return this.openChat(dialogId);
			}
			if (!checkHistoryDialogId(dialogId)) {
				return Promise.reject();
			}
			if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2) && im_v2_lib_utils.Utils.dialog.isLinesHistoryId(dialogId)) {
				// history app ships with imopenlines, fall back to the legacy slider while that module lags behind
				void main_core.Runtime.loadExtension('imopenlines.v2.application.history').then(({
					LinesHistoryApplication
				}) => {
					if (!LinesHistoryApplication) {
						openHistoryInSidePanel(dialogId);
						return;
					}
					LinesHistoryApplication.openInSlider(dialogId);
				}).catch(error => {
					im_v2_lib_logger.Logger.error('Opener: openHistory V2 delegation failed', error);
					openHistoryInSidePanel(dialogId);
				});
				return Promise.resolve();
			}
			openHistoryInSidePanel(dialogId);
			return Promise.resolve();
		},
		async openNotifications() {
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			await im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.notification
			});
			main_core_events.EventEmitter.emit(im_v2_const.EventType.layout.onOpenNotifications);
			return Promise.resolve();
		},
		async openRecentSearch() {
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			// Search goes where plain chats live and not where the user is sent back: the default folder is
			// whichever one the user put first, and the search event is heard by the chat lists alone.
			await im_v2_lib_layout.LayoutManager.getInstance().setLayout(im_v2_lib_folder.FolderManager.getRegularChatsLayout());
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.openSearch);
			return Promise.resolve();
		},
		async openSettings(sectionName) {
			im_v2_lib_logger.Logger.warn('Slider: openSettings', sectionName);
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			await im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.settings,
				entityId: sectionName
			});
			return Promise.resolve();
		},
		openConference(code = '') {
			im_v2_lib_logger.Logger.warn('Slider: openConference', code);
			if (!im_v2_lib_utils.Utils.conference.isValidCode(code)) {
				return Promise.reject();
			}
			const url = im_v2_lib_utils.Utils.conference.getUrlByCode(code);
			im_v2_lib_utils.Utils.browser.openLink(url, im_v2_lib_utils.Utils.conference.getWindowNameByCode(code));
			return Promise.resolve();
		},
		async openChatCreation(chatType, params) {
			im_v2_lib_logger.Logger.warn('Slider: openChatCreation', chatType);
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			return im_v2_lib_createChat.CreateChatManager.getInstance().startChatCreation(chatType, params);
		},
		async openChatUpdate(dialogId) {
			im_v2_lib_logger.Logger.warn('Slider: openChatUpdate', dialogId);
			await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			await new im_v2_provider_service_chat.ChatService().loadChat(dialogId);
			return im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.updateChat,
				entityId: dialogId
			});
		},
		startVideoCall(dialogId = '', withVideo = true, callOptions = null) {
			im_v2_lib_logger.Logger.warn('Slider: onStartVideoCall', dialogId, withVideo);
			if (!im_v2_lib_utils.Utils.dialog.isDialogId(dialogId)) {
				im_v2_lib_logger.Logger.error('Slider: onStartVideoCall - dialogId is not correct', dialogId);
				return false;
			}
			im_v2_lib_call.CallManager.getInstance().startCall(dialogId, withVideo, callOptions);
			return Promise.resolve();
		},
		startPhoneCall(number, params) {
			im_v2_lib_logger.Logger.warn('Slider: startPhoneCall', number, params);
			void im_v2_lib_phone.PhoneManager.getInstance().startCall(number, params);
			return Promise.resolve();
		},
		startCallList(callListId, params) {
			im_v2_lib_logger.Logger.warn('Slider: startCallList', callListId, params);
			im_v2_lib_phone.PhoneManager.getInstance().startCallList(callListId, params);
			return Promise.resolve();
		},
		openNewTab(path) {
			if (im_v2_lib_desktopApi.DesktopApi.isChatTab() && im_v2_lib_desktopApi.DesktopApi.isFeatureSupported(im_v2_lib_desktopApi.DesktopFeature.openNewTab.id)) {
				im_v2_lib_desktopApi.DesktopApi.createImTab(`${path}&${im_v2_const.GetParameter.desktopChatTabMode}=Y`);
			} else {
				im_v2_lib_utils.Utils.browser.openLink(path);
			}
		},
		async openNavigationItem(payload) {
			const {
				id,
				entityId,
				target,
				asLink
			} = payload;
			const isMarketApp = im_v2_lib_navigation.NavigationManager.isMarketApp(payload);
			if (!asLink || isMarketApp) {
				await im_v2_lib_slider.MessengerSlider.getInstance().openSlider();
			}
			im_v2_lib_navigation.NavigationManager.open({
				id: id.toString(),
				entityId: normalizeEntityId(entityId),
				target,
				asLink
			});
		},
		isChatOpened(dialogId) {
			const currentLayout = im_v2_lib_layout.LayoutManager.getInstance().getLayout();
			if (!im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(currentLayout.name)) {
				return false;
			}
			return currentLayout.entityId === dialogId;
		}
	};

	exports.Opener = Opener;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.SidePanel, BX.Messenger.v2.Lib);
//# sourceMappingURL=opener.bundle.js.map
