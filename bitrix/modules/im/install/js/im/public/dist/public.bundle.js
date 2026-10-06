/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	/* eslint-disable no-console */
	const legacyMessenger = {};
	legacyMessenger.openMessenger = function (...args) {
		console.warn("Developer: method BXIM.openMessenger is deprecated. Use method 'Messenger.openChat' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.openChat(...args);
	};
	legacyMessenger.openMessengerSlider = function (dialogId) {
		console.warn("Developer: method BXIM.openMessengerSlider is deprecated. Use method 'Messenger.openChat' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.openChat(dialogId);
	};
	legacyMessenger.openHistory = function (...args) {
		console.warn("Developer: method BXIM.openHistory is deprecated. Use method 'Messenger.openChat' from 'im.public' or 'im.public.iframe' extension.");
		const Opener = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Opener');
		return Opener?.openHistory(...args);
	};
	legacyMessenger.openNotify = function (...args) {
		console.warn("Developer: method BXIM.openNotify is deprecated. Use method 'Messenger.openNotifications' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.openNotifications(...args);
	};
	legacyMessenger.openSettings = function (...args) {
		console.warn("Developer: method BXIM.openSettings is deprecated. Use method 'Messenger.openSettings' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.openSettings(...args);
	};
	legacyMessenger.openVideoconf = function (code) {
		console.warn("Developer: method BXIM.openVideoconf is deprecated. Use method 'Messenger.openConference' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.openConference({
			code
		});
	};
	legacyMessenger.openVideoconfByUrl = function (link) {
		console.warn("Developer: method BXIM.openVideoconfByUrl is deprecated. Use method 'Messenger.openConference' from 'im.public' or 'im.public.iframe' extension.");
		const Utils = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Utils');
		if (Utils && main_core.Type.isStringFilled(url) && !Utils.conference.isCurrentPortal(url)) {
			return false;
		}
		messenger.openConference({
			link
		});
		return true;
	};
	legacyMessenger.callTo = function (...args) {
		console.warn("Developer: method BXIM.callTo is deprecated. Use method 'Messenger.startVideoCall' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.startVideoCall(...args);
	};
	legacyMessenger.phoneTo = function (...args) {
		console.warn("Developer: method BXIM.phoneTo is deprecated. Use method 'Messenger.startPhoneCall' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.startPhoneCall(...args);
	};
	legacyMessenger.startCallList = function (...args) {
		console.warn("Developer: method BXIM.startCallList is deprecated. Use method 'Messenger.startCallList' from 'im.public' or 'im.public.iframe' extension.");
		return messenger.startCallList(...args);
	};
	legacyMessenger.disk = {
		saveToDiskAction(...args) {
			console.warn("Developer: method BXIM.disk.saveToDiskAction is deprecated. Use method 'Messenger.saveFileToDisk' from 'im.public' or 'im.public.iframe' extension.");
			const [, params] = args;
			if (!params || !params.fileId) {
				return Promise.reject();
			}
			return messenger.saveFileToDisk(params.fileId);
		}
	};
	legacyMessenger.messenger = {};
	legacyMessenger.messenger.popupPopupMenu = false;
	legacyMessenger.settings = {};
	const legacyDesktop = {
		init: () => {},
		enableInVersion: () => false,
		getApiVersion: () => 0,
		addCustomEvent: () => {},
		onCustomEvent: () => {},
		ready: () => true,
		log: () => {}
	};

	class Desktop {
		constructor() {
			const settings = main_core.Extension.getSettings('im.public');
			this.v2enabled = settings.get('v2enabled', false);
		}
		async openPage(url, options = {}) {
			if (!this.v2enabled) {
				return Promise.resolve(false);
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			if (DesktopManager.isDesktop()) {
				return Promise.resolve(true);
			}
			const targetUrl = new URL(url);
			if (targetUrl.host !== location.host) {
				return Promise.resolve(false);
			}
			const skipNativeBrowser = Boolean(options.skipNativeBrowser);
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForOpenBrowserPage();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().openPage(targetUrl.href, {
					skipNativeBrowser
				});
			}
			if (skipNativeBrowser === true) {
				return Promise.resolve(false);
			}
			window.open(targetUrl.href, '_blank');
			return Promise.resolve(true);
		}
	}

	const AvailableSectionNameMap = {
		appearance: 'appearance',
		notify: 'notification',
		notification: 'notification',
		hotkey: 'hotkey',
		recent: 'recent',
		desktop: 'desktop'
	};
	const prepareSettingsSection = rawSectionName => {
		return AvailableSectionNameMap[rawSectionName] ?? '';
	};

	class Textarea {
		async getText(chatId) {
			const {
				EventType
			} = main_core.Reflection.getClass('BX.Messenger.v2.Const');
			if (!EventType) {
				return '';
			}
			const dialogId = this.#getDialogIdByChatId(chatId);
			if (!dialogId) {
				return '';
			}
			const result = await main_core_events.EventEmitter.emitAsync(EventType.textarea.getText, {
				dialogId
			});
			if (result.length === 0) {
				return '';
			}
			return result[0];
		}
		insertQuote(chatId, text, options = {}) {
			const {
				Quote
			} = main_core.Reflection.getClass('BX.Messenger.v2.Lib');
			if (!Quote) {
				return;
			}
			const formattedText = Quote.wrapWithDelimiters(text);
			this.insertText(chatId, formattedText, {
				withNewLine: true,
				...options
			});
		}
		insertText(chatId, text, options = {}) {
			const {
				EventType
			} = main_core.Reflection.getClass('BX.Messenger.v2.Const');
			if (!EventType) {
				return;
			}
			const dialogId = this.#getDialogIdByChatId(chatId);
			if (!dialogId) {
				return;
			}
			const config = {
				dialogId,
				text,
				withNewLine: false,
				replace: false,
				...options
			};
			main_core_events.EventEmitter.emit(EventType.textarea.insertText, config);
		}
		#getDialogIdByChatId(chatId) {
			const {
				Core
			} = main_core.Reflection.getClass('BX.Messenger.v2.Application');
			if (!Core) {
				return '';
			}
			const dialog = Core.getStore().getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return '';
			}
			return dialog.dialogId;
		}
	}

	class SharedLinkService {
		joinChatByCode(code) {
			const {
				runAction
			} = main_core.Reflection.getClass('BX.Messenger.v2.Lib');
			const {
				RestMethod
			} = main_core.Reflection.getClass('BX.Messenger.v2.Const');
			if (!runAction || !RestMethod) {
				return Promise.resolve();
			}
			return runAction(RestMethod.imV2ChatJoinByCode, {
				data: {
					code
				}
			}).catch(([error]) => {
				console.error('SharedLinkService: joinChatByCode error', error);
				throw error;
			});
		}
	}

	class Messenger {
		v2enabled = false;
		desktop = new Desktop();
		textarea = new Textarea();
		constructor() {
			const settings = main_core.Extension.getSettings('im.public');
			this.v2enabled = settings.get('v2enabled', false);
		}
		async openChat(dialogId = '', messageId = 0) {
			if (!this.v2enabled) {
				window.BXIM.openMessenger(dialogId);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToChat(dialogId, messageId);
			}
			return getOpener()?.openChat(dialogId, messageId);
		}
		async openChatWithBotContext(dialogId = '', context = {}) {
			if (!this.v2enabled) {
				window.BXIM.openMessenger(dialogId);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToChatWithBotContext(dialogId, context);
			}
			return getOpener()?.openChatWithBotContext(dialogId, context);
		}
		async openLines(dialogId = '') {
			if (!this.v2enabled) {
				const preparedDialogId = dialogId === '' ? 0 : dialogId;
				window.BXIM.openMessenger(preparedDialogId, 'im-ol');
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToLines(dialogId);
			}
			return getOpener()?.openLines(dialogId);
		}
		async openCopilot(dialogId = '', contextId = 0) {
			if (!this.v2enabled) {
				window.BXIM.openMessenger(dialogId);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToCopilot(dialogId);
			}
			return getOpener()?.openCopilot(dialogId, contextId);
		}
		async openCollab(dialogId = '', options = {}) {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToCollab(dialogId, options);
			}
			return getOpener()?.openCollab(dialogId, options);
		}
		async openChannel(dialogId = '') {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToChannel(dialogId);
			}
			return getOpener()?.openChannel(dialogId);
		}
		async openTaskComments(dialogId = '', messageId = 0) {
			const FeatureManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.FeatureManager');
			const Feature = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Feature');
			if (!FeatureManager?.isFeatureAvailable(Feature.isTasksRecentListAvailable)) {
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToTaskComments(dialogId, messageId);
			}
			return getOpener()?.openTaskComments(dialogId, messageId);
		}
		async openLinesHistory(dialogId = '') {
			if (!this.v2enabled) {
				window.BXIM.openHistory(dialogId);
				return Promise.resolve();
			}
			return getOpener()?.openHistory(dialogId);
		}
		async openNotifications() {
			if (!this.v2enabled) {
				window.BXIM.openNotify();
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToNotifications();
			}
			return getOpener()?.openNotifications();
		}
		async openRecentSearch() {
			if (!this.v2enabled) {
				window.BXIM.openMessenger();
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToRecentSearch();
			}
			return getOpener()?.openRecentSearch();
		}
		async openSettings(options = {}) {
			if (!this.v2enabled) {
				const params = {};
				if (main_core.Type.isPlainObject(options)) {
					if (main_core.Type.isStringFilled(options.selected)) {
						params.active = options.selected;
					}
					if (main_core.Type.isStringFilled(options.section)) {
						params.onlyPanel = options.section;
					}
				}
				window.BXIM.openSettings(params);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToSettings(options.onlyPanel ?? '');
			}
			const settingsSection = prepareSettingsSection(options.onlyPanel ?? '');
			return getOpener()?.openSettings(settingsSection);
		}
		async openConference(options = {}) {
			if (!this.v2enabled) {
				if (main_core.Type.isPlainObject(options)) {
					if (main_core.Type.isStringFilled(options.code)) {
						window.BXIM.openVideoconf(options.code);
					}
					if (main_core.Type.isStringFilled(options.link)) {
						window.BXIM.openVideoconfByUrl(options.link);
					}
				}
				return Promise.resolve();
			}
			const Utils = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Utils');
			if (main_core.Type.isStringFilled(options.url) && !Utils.conference.isCurrentPortal(options.url)) {
				Utils.browser.openLink(options.url);
				return Promise.resolve();
			}
			const code = Utils.conference.getCodeByOptions(options);
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			if (DesktopManager?.isDesktop()) {
				return DesktopManager?.getInstance().openConference(code);
			}
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToConference(code);
			}
			return getOpener()?.openConference(code);
		}
		async openChatCreation(chatType, params = {}) {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToChatCreation(chatType);
			}
			return getOpener()?.openChatCreation(chatType, params);
		}
		async openChatUpdate(dialogId) {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToChatUpdate(dialogId);
			}
			return getOpener()?.openChatUpdate(dialogId);
		}
		async startVideoCall(dialogId = '', withVideo = true) {
			if (!this.v2enabled) {
				window.BXIM.callTo(dialogId, withVideo);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			if (isRedirectAllowed) {
				return DesktopManager?.getInstance().redirectToVideoCall(dialogId, withVideo);
			}
			return getOpener()?.startVideoCall(dialogId, withVideo);
		}
		async startPhoneCall(number, params) {
			if (!this.v2enabled) {
				window.BXIM.phoneTo(number, params);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const desktopIsActive = await DesktopManager?.getInstance().checkStatusInDifferentContext();
			if (desktopIsActive && !DesktopManager.isDesktop()) {
				return DesktopManager?.getInstance().redirectToPhoneCall(number, params);
			}
			return getOpener()?.startPhoneCall(number, params);
		}
		async startCallList(callListId, params) {
			if (!this.v2enabled) {
				window.BXIM.startCallList(callListId, params);
				return Promise.resolve();
			}
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const desktopIsActive = await DesktopManager?.getInstance().checkStatusInDifferentContext();
			if (desktopIsActive && !DesktopManager.isDesktop()) {
				return DesktopManager?.getInstance().redirectToCallList(callListId, params);
			}
			return getOpener()?.startCallList(callListId, params);
		}
		enableDesktopRedirect() {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			DesktopManager?.getInstance().enableRedirect();
		}
		disableDesktopRedirect() {
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			DesktopManager?.getInstance().disableRedirect();
		}
		setWebRTCDebug(debug = false) {
			if (!this.v2enabled) {
				return;
			}
			const PhoneManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.PhoneManager');
			PhoneManager?.getInstance().toggleDebugFlag(debug);
			const CallManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.CallManager');
			CallManager?.getInstance().toggleDebugFlag(debug);
		}
		async joinChatByCode(code) {
			const {
				Notifier
			} = main_core.Reflection.getClass('BX.Messenger.v2.Lib');
			try {
				const {
					dialogId
				} = await new SharedLinkService().joinChatByCode(code);
				void this.openChat(dialogId);
			} catch {
				if (Notifier) {
					Notifier.sharedLink.onClickInvalidLinkError();
				}
				console.error('Messenger.joinChatByCode error');
			}
		}
		async saveFileToDisk(fileId) {
			const {
				DiskService
			} = main_core.Reflection.getClass('BX.Messenger.v2.Service');
			if (!DiskService) {
				return;
			}
			await new DiskService().save([fileId]).catch(error => {
				console.error('Messenger.saveFileToDisk error:', error);
			});
			const Notifier = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Notifier');
			Notifier?.file.onDiskSaveComplete();
		}
		async openNavigationItem(payload) {
			const {
				id,
				entityId
			} = payload;
			const DesktopManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager');
			const LayoutManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.LayoutManager');
			const isRedirectAllowed = await DesktopManager?.getInstance().checkForRedirect();
			const isLayout = LayoutManager?.getInstance().isValidLayout(id);
			if (isRedirectAllowed && isLayout) {
				return DesktopManager?.getInstance().redirectToLayout({
					id,
					entityId
				});
			}
			if (DesktopManager?.isChatWindow()) {
				return getOpener()?.openNavigationItem({
					...payload,
					asLink: false
				});
			}
			return getOpener()?.openNavigationItem(payload);
		}
		isEmbeddedMode() {
			const LayoutManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.LayoutManager');
			if (!LayoutManager) {
				return false;
			}
			return LayoutManager.getInstance().isEmbeddedMode();
		}
		isMessengerSliderOpened() {
			const MessengerSlider = main_core.Reflection.getClass('BX.Messenger.v2.Lib.MessengerSlider');
			if (!MessengerSlider) {
				return false;
			}
			return MessengerSlider.getInstance().isOpened();
		}
		isChatOpened(dialogId) {
			return getOpener()?.isChatOpened(dialogId);
		}
		async initApplication(applicationName, config = {}) {
			const launch = main_core.Reflection.getClass('BX.Messenger.v2.Application.Launch');
			if (!launch) {
				return Promise.reject();
			}
			return launch(applicationName, {
				...config,
				embedded: true
			});
		}
	}
	const getOpener = () => {
		return main_core.Reflection.getClass('BX.Messenger.v2.Lib.Opener');
	};
	const messenger = new Messenger();

	// pretty export
	const namespace = main_core.Reflection.getClass('BX.Messenger');
	if (namespace) {
		namespace.Public = messenger;
	}

	// compatibility layer
	if (messenger.v2enabled && main_core.Type.isUndefined(window.BXIM) && window.parent === window) {
		window.BXIM = legacyMessenger;
	}
	if (messenger.v2enabled && main_core.Type.isUndefined(window.BX.desktop) && main_core.Type.isObject(window.BXDesktopSystem) && window.parent === window) {
		window.BX.desktop = legacyDesktop;
	}

	exports.Messenger = messenger;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event);
//# sourceMappingURL=public.bundle.js.map
