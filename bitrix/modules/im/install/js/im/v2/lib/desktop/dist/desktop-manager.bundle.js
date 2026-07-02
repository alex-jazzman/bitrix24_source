/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_v2_lib_desktopApi, im_v2_lib_layout, im_v2_lib_feature, im_v2_lib_utils, im_v2_lib_desktop, im_public, im_v2_lib_rest, im_v2_lib_call, im_v2_provider_service_chat, im_v2_provider_service_recent, im_v2_lib_messageNotifier) {
	'use strict';

	const IMAGE_DESKTOP_RUN = 'icon.png';
	const IMAGE_DESKTOP_TWO_WINDOW_MODE = 'internal.png';
	const IMAGE_CHECK_URL = 'http://127.0.0.1:20141';
	const IMAGE_CHECK_TIMEOUT = 500;
	const IMAGE_CLASS = 'bx-im-messenger__out-of-view';
	const checkTimeoutList = {};
	const CheckUtils = {
		testImageLoad(image = IMAGE_DESKTOP_RUN) {
			let resolvePromise = null;
			const loadCheckPromise = new Promise(resolve => {
				resolvePromise = resolve;
			});
			const dateCheck = Date.now();
			let isPromiseResolvedToFalse = false;
			const imageForCheck = main_core.Dom.create({
				tag: 'img',
				attrs: {
					src: `${IMAGE_CHECK_URL}/${image}?${dateCheck}`,
					'data-id': dateCheck
				},
				props: {
					className: IMAGE_CLASS
				},
				events: {
					error() {
						if (isPromiseResolvedToFalse) {
							return;
						}
						const checkId = this.dataset.id;
						resolvePromise(false);
						clearTimeout(checkTimeoutList[checkId]);
						main_core.Dom.remove(this);
					},
					load() {
						const checkId = this.dataset.id;
						resolvePromise(true);
						clearTimeout(checkTimeoutList[checkId]);
						main_core.Dom.remove(this);
					}
				}
			});
			document.body.append(imageForCheck);
			checkTimeoutList[dateCheck] = setTimeout(() => {
				isPromiseResolvedToFalse = true;
				resolvePromise(false);
				main_core.Dom.remove(imageForCheck);
			}, IMAGE_CHECK_TIMEOUT);
			return loadCheckPromise;
		},
		testInternetConnection() {
			const currentTimestamp = Date.now();
			const settings = main_core.Extension.getSettings('im.v2.lib.desktop');
			const internetCheckUrl = settings.get('internetCheckUrl');
			return new Promise(resolve => {
				fetch(`${internetCheckUrl}.${currentTimestamp}`).then(response => {
					if (response.status === 200) {
						resolve(true);
						return;
					}
					resolve(false);
				}).catch(() => {
					resolve(false);
				});
			});
		},
		IMAGE_DESKTOP_RUN,
		IMAGE_DESKTOP_TWO_WINDOW_MODE
	};

	let conferenceList = [];
	let conferenceIndex = 0;
	const Conference = {
		openConference(code) {
			if (!im_v2_lib_utils.Utils.conference.isValidCode(code)) {
				return false;
			}
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return false;
			}
			let windowSize = null;
			const sizes = [{
				width: 2560,
				height: 1440
			}, {
				width: 2048,
				height: 1152
			}, {
				width: 1920,
				height: 1080
			}, {
				width: 1600,
				height: 900
			}, {
				width: 1366,
				height: 768
			}, {
				width: 1024,
				height: 576
			}];
			for (const size of sizes) {
				windowSize = size;
				if (screen.width > size.width && screen.height > size.height) {
					break;
				}
			}
			conferenceList = conferenceList.filter(name => {
				return Boolean(im_v2_lib_desktopApi.DesktopApi.findWindow(name));
			});
			conferenceList.push(im_v2_lib_utils.Utils.conference.getWindowNameByCode(code));
			im_v2_lib_desktopApi.DesktopApi.createWindow(im_v2_lib_utils.Utils.conference.getWindowNameByCode(code), controller => {
				controller.SetProperty('title', main_core.Loc.getMessage('IM_LIB_DESKTOP_CONFERENCE_TITLE'));
				controller.SetProperty('clientSize', {
					Width: windowSize.width,
					Height: windowSize.height
				});

				// we need the first 'center' command to prevent the window from jumping after we show it
				controller.ExecuteCommand('center');
				controller.SetProperty('minClientSize', {
					Width: 940,
					Height: 400
				});
				controller.SetProperty('backgroundColor', '#2B3038');
				controller.ExecuteCommand('html.load', `<script>location.href="/video/${code}/";</script>`);
				controller.ExecuteCommand('show');

				// we need the second 'center' command because we know the exact size of the window after we show it
				controller.ExecuteCommand('center');
			});
			return true;
		},
		toggleConference() {
			if (conferenceIndex > conferenceList.length - 1) {
				conferenceIndex = 0;
				im_v2_lib_desktopApi.DesktopApi.showWindow();
				return true;
			}
			conferenceList = conferenceList.filter(name => {
				return Boolean(im_v2_lib_desktopApi.DesktopApi.findWindow(name));
			});
			for (let index = conferenceIndex; index < conferenceList.length; index++) {
				conferenceIndex++;
				const target = im_v2_lib_desktopApi.DesktopApi.findWindow(conferenceList[index]);
				if (target) {
					im_v2_lib_desktopApi.DesktopApi.activateWindow(target);
					break;
				}
			}
			return true;
		}
	};

	const ENCODE_SEPARATOR = '!!';
	const Encoder = {
		encodeParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				return '';
			}
			let result = '';
			Object.entries(params).forEach(([key, value]) => {
				const prefix = '' ;
				result += `${prefix}${key}${ENCODE_SEPARATOR}${value}`;
			});
			return result;
		},
		decodeParams(encodedParams) {
			const result = {};
			if (!main_core.Type.isStringFilled(encodedParams)) {
				return result;
			}
			const chunks = encodedParams.split(ENCODE_SEPARATOR);
			for (let i = 0; i < chunks.length; i += 2) {
				const key = chunks[i];
				const value = chunks[i + 1];
				result[key] = value;
			}
			return result;
		},
		encodeParamsJson(params) {
			if (!main_core.Type.isPlainObject(params)) {
				return '{}';
			}
			let result = '';
			try {
				result = encodeURIComponent(JSON.stringify(params));
			} catch (error) {
				console.error('DesktopUtils: could not encode params.', error);
				result = '{}';
			}
			return result;
		},
		decodeParamsJson(encodedParams) {
			let result = {};
			if (!main_core.Type.isStringFilled(encodedParams)) {
				return result;
			}
			try {
				result = JSON.parse(decodeURIComponent(encodedParams));
			} catch (error) {
				console.error('DesktopUtils: could not decode encoded params.', error);
			}
			return result;
		}
	};

	const BxLinkProcessor = {
		handleCommand(command, rawParams) {
			const params = rawParams ?? {};
			Object.entries(params).forEach(([key, value]) => {
				params[key] = decodeURIComponent(value);
			});
			if (command !== im_v2_const.DesktopBxLink.openPage) {
				im_v2_lib_desktopApi.DesktopApi.activateWindow();
			}
			if (command === im_v2_const.DesktopBxLink.chat) {
				const messageId = params.messageId ?? 0;
				void im_public.Messenger.openChat(params.dialogId, messageId);
			} else if (command === im_v2_const.DesktopBxLink.lines) {
				void im_public.Messenger.openLines(params.dialogId);
			} else if (command === im_v2_const.DesktopBxLink.conference) {
				void im_v2_lib_desktop.DesktopManager.getInstance().openConference(params.code);
			} else if (command === im_v2_const.DesktopBxLink.call) {
				const withVideo = params.withVideo !== 'N';
				void im_public.Messenger.startVideoCall(params.dialogId, withVideo);
			} else if (command === im_v2_const.DesktopBxLink.phone) {
				const decodedParams = Encoder.decodeParamsJson(params.phoneParams);
				void im_public.Messenger.startPhoneCall(params.number, decodedParams);
			} else if (command === im_v2_const.DesktopBxLink.callList) {
				const decodedParams = Encoder.decodeParamsJson(params.callListParams);
				void im_public.Messenger.startCallList(params.callListId, decodedParams);
			} else if (command === im_v2_const.DesktopBxLink.notifications) {
				void im_public.Messenger.openNotifications();
			} else if (command === im_v2_const.DesktopBxLink.recentSearch) {
				void im_public.Messenger.openRecentSearch();
			} else if (command === im_v2_const.DesktopBxLink.copilot) {
				void im_public.Messenger.openCopilot(params.dialogId);
			} else if (command === im_v2_const.DesktopBxLink.collab) {
				void im_public.Messenger.openCollab(params.dialogId);
			} else if (command === im_v2_const.DesktopBxLink.channel) {
				void im_public.Messenger.openChannel(params.dialogId);
			} else if (command === im_v2_const.DesktopBxLink.taskComments) {
				const messageId = params.messageId ?? 0;
				void im_public.Messenger.openTaskComments(params.dialogId, messageId);
			} else if (command === im_v2_const.DesktopBxLink.settings) {
				void im_public.Messenger.openSettings({
					onlyPanel: params.section
				});
			} else if (command === im_v2_const.DesktopBxLink.chatCreation) {
				void im_public.Messenger.openChatCreation(params.chatType);
			} else if (command === im_v2_const.DesktopBxLink.openLayout) {
				const {
					id,
					entityId
				} = params;
				void im_public.Messenger.openNavigationItem({
					id,
					entityId
				});
			} else if (command === im_v2_const.DesktopBxLink.timeManager) {
				BX.Timeman?.Monitor?.openReport();
			} else if (command === im_v2_const.DesktopBxLink.openTab) {
				im_v2_lib_desktopApi.DesktopApi.setActiveTab();
			} else if (command === im_v2_const.DesktopBxLink.openPage) {
				const options = Encoder.decodeParamsJson(params.options);
				im_v2_lib_desktopApi.DesktopApi.openPage(options.url, options.options);
			} else if (command === im_v2_const.DesktopBxLink.botContext) {
				const {
					dialogId,
					context
				} = params;
				const decodedContext = Encoder.decodeParamsJson(context);
				void im_public.Messenger.openChatWithBotContext(dialogId, decodedContext);
			}
		},
		handleLegacyCommand(command, rawParams) {
			const params = rawParams ?? {};
			Object.entries(params).forEach(([key, value]) => {
				params[key] = decodeURIComponent(value);
			});
			if (command === im_v2_const.LegacyDesktopBxLink.messenger) {
				if (params.dialog) {
					void im_public.Messenger.openChat(params.dialog);
				} else if (params.chat) {
					const dialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(params.chat);
					void im_public.Messenger.openChat(dialogId);
				} else {
					void im_public.Messenger.openChat();
				}
			} else if (command === im_v2_const.LegacyDesktopBxLink.chat && params.id) {
				const dialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(params.id);
				void im_public.Messenger.openChat(dialogId);
			} else if (command === im_v2_const.LegacyDesktopBxLink.notify) {
				void im_public.Messenger.openNotifications();
			} else if (command === im_v2_const.LegacyDesktopBxLink.callTo) {
				if (params.video) {
					void im_public.Messenger.startVideoCall(params.video);
				} else if (params.audio) {
					void im_public.Messenger.startVideoCall(params.audio, false);
				} else if (params.phone) {
					void im_public.Messenger.startPhoneCall(params.phone);
				}
			} else if (command === im_v2_const.LegacyDesktopBxLink.callList) {
				void im_public.Messenger.openRecentSearch();
			}
		}
	};

	class BxLinkHandler {
		static init() {
			return new BxLinkHandler();
		}
		constructor() {
			this.#subscribeToBxProtocolEvent();
			this.#subscribeToLegacyBxProtocolEvent();
		}
		#subscribeToBxProtocolEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onBxLink, async (command, rawParams) => {
				await im_v2_lib_desktopApi.DesktopApi.showBrowserWindow();
				if (im_v2_lib_desktopApi.DesktopApi.isFeatureSupported(im_v2_lib_desktopApi.DesktopFeature.portalTabActivation.id)) {
					await im_v2_lib_desktopApi.DesktopApi.handlePortalTabActivation();
				}
				im_v2_lib_desktop.DesktopBroadcastManager.getInstance().sendActionMessage({
					action: im_v2_const.DesktopBroadcastAction.bxLink,
					params: {
						command,
						rawParams
					}
				});
			});
		}
		#subscribeToLegacyBxProtocolEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onBxLink, (command, rawParams) => {
				BxLinkProcessor.handleLegacyCommand(command, rawParams);
			});
		}
	}

	class AuthHandler {
		static init() {
			return new AuthHandler();
		}
		constructor() {
			this.#subscribeToLogoutEvent();
		}
		#subscribeToLogoutEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onExit, this.#onExit.bind(this));
		}
		#onExit() {
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2DesktopLogout).finally(() => {
				im_v2_lib_desktopApi.DesktopApi.shutdown();
			});
		}
	}

	class StatusHandler {
		static init() {
			return new StatusHandler();
		}
		constructor() {
			this.#subscribeToAwayEvent();
			this.#subscribeToFocusEvent();
			this.#subscribeToBlurEvent();
			this.#subscribeToIconClickEvent();
			this.#setInitialStatus();
			this.#subscribeToStatusChange();
		}

		// region icon click
		#subscribeToIconClickEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onIconClick, this.#onIconClick.bind(this));
		}
		#onIconClick() {
			im_v2_lib_desktop.DesktopManager.getInstance().toggleConference();
		}

		// endregion icon click

		// region away
		#subscribeToAwayEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onUserAway, this.#onUserAway.bind(this));
		}
		#onUserAway(away) {
			const method = away ? im_v2_const.RestMethod.imUserStatusIdleStart : im_v2_const.RestMethod.imUserStatusIdleEnd;
			im_v2_application_core.Core.getRestClient().callMethod(method).catch(error => {
				console.error(`Desktop: error in ${method}  - ${error}`);
			});
		}
		// endregion away

		// region focus/blur events
		#subscribeToFocusEvent() {
			main_core.Event.bind(window, 'focus', this.#removeNativeNotifications.bind(this));
		}
		#subscribeToBlurEvent() {
			// TODO remove this after refactor notification balloons
			main_core.Event.bind(window, 'blur', this.#removeNativeNotifications.bind(this));
		}
		#removeNativeNotifications() {
			if (!main_core.Browser.isWin() || !im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				return;
			}
			im_v2_lib_desktopApi.DesktopApi.removeNativeNotifications();
		}
		// endregion focus/blur events

		// region user status
		#setInitialStatus() {
			const status = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.user.status);
			im_v2_lib_desktopApi.DesktopApi.setIconStatus(status);
		}
		#subscribeToStatusChange() {
			const statusWatcher = (state, getters) => {
				return getters['application/settings/get'](im_v2_const.Settings.user.status);
			};
			im_v2_application_core.Core.getStore().watch(statusWatcher, newStatus => {
				im_v2_lib_desktopApi.DesktopApi.setIconStatus(newStatus);
			});
		}
		// endregion user status
	}

	class CounterHandler {
		#store;
		static init() {
			return new CounterHandler();
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#onCounterChange();
			this.#subscribeToCountersChange();
		}
		#subscribeToCountersChange() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.counter.onNotificationCounterChange, this.#onCounterChange.bind(this));
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.counter.onChatCounterChange, this.#onCounterChange.bind(this));
		}
		#onCounterChange() {
			const chatCounter = this.#store.getters['counters/getTotalChatCounter'];
			const notificationCounter = this.#store.getters['notifications/getCounter'];
			const isImportant = chatCounter > 0;
			im_v2_lib_desktopApi.DesktopApi.setCounter(chatCounter + notificationCounter, isImportant);
		}
	}

	class HotkeyHandler {
		static init() {
			return new HotkeyHandler();
		}
		constructor() {
			this.#bindHotkeys();
		}
		#bindHotkeys() {
			main_core.Event.bind(window, 'keydown', event => {
				const logFolderCombination = im_v2_lib_utils.Utils.key.isCombination(event, 'Ctrl+Shift+L');
				if (logFolderCombination) {
					im_v2_lib_desktopApi.DesktopApi.openLogsFolder();
					im_v2_lib_logger.Logger.desktop('NOTICE: User open log folder (hotkey)');
					return;
				}
				const devToolsCombination = im_v2_lib_utils.Utils.key.isCombination(event, 'Ctrl+Shift+D');
				if (devToolsCombination) {
					im_v2_lib_desktopApi.DesktopApi.openDeveloperTools();
					im_v2_lib_logger.Logger.desktop('NOTICE: User open developer tools (hotkey)');
				}
			});
		}
	}

	class NewTabHandler {
		static init() {
			return new NewTabHandler();
		}
		constructor() {
			this.#subscribeToNewTabEvent();
		}
		#subscribeToNewTabEvent() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onNewTabClick, this.#onNewTabClick.bind(this));
		}
		#onNewTabClick() {
			im_v2_lib_desktopApi.DesktopApi.createTab('/desktop/menu/');
		}
	}

	const SliderBindings = {
		init() {
			const sliderBindingStatus = im_v2_lib_desktopApi.DesktopApi.getSliderBindingsStatus();
			if (sliderBindingStatus) {
				BX.SidePanel.Instance.enableAnchorBinding();
				return;
			}
			BX.SidePanel.Instance.disableAnchorBinding();
		}
	};

	const DesktopDataUpdater = {
		async reloadChatInfo() {
			await im_v2_provider_service_recent.LegacyRecentService.getInstance().requestItems({
				firstPage: true
			});
			const currentLayout = im_v2_lib_layout.LayoutManager.getInstance().getLayout();
			if (currentLayout.entityId) {
				await this.reopenChat(currentLayout);
			}
		},
		async reopenChat(currentLayout) {
			im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
			const chatService = new im_v2_provider_service_chat.ChatService();
			await chatService.resetChat(currentLayout.entityId);
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout(currentLayout);
		}
	};

	class WakeUpHandler {
		#initDate;
		#wakeUpTimer = null;
		sidePanelManager = BX.SidePanel.Instance;
		static init() {
			return new WakeUpHandler();
		}
		constructor() {
			this.#initDate = new Date();
			im_v2_lib_desktopApi.DesktopApi.subscribe(im_v2_const.EventType.desktop.onWakeUp, this.#onWakeUp.bind(this));
		}
		async #onWakeUp() {
			const hasConnection = await CheckUtils.testInternetConnection();
			if (!hasConnection) {
				im_v2_lib_logger.Logger.desktop('StatusHandler: onWakeUp event, no internet connection, delay 60 sec');
				clearTimeout(this.#wakeUpTimer);
				this.#wakeUpTimer = setTimeout(this.#onWakeUp.bind(this), 60 * 1000);
				return;
			}
			if (im_v2_lib_utils.Utils.date.isSameHour(new Date(), this.#initDate)) {
				im_v2_lib_logger.Logger.desktop('StatusHandler: onWakeUp event, same hour - restart pull client');
				im_v2_application_core.Core.getPullClient().restart();
			} else {
				if (this.sidePanelManager.opened) {
					clearTimeout(this.#wakeUpTimer);
					this.#wakeUpTimer = setTimeout(this.#onWakeUp.bind(this), 60 * 1000);
					im_v2_lib_logger.Logger.desktop('StatusHandler: onWakeUp event, slider is open, delay 60 sec');
					return;
				}
				if (im_v2_lib_call.CallManager.getInstance().hasCurrentCall()) {
					clearTimeout(this.#wakeUpTimer);
					this.#wakeUpTimer = setTimeout(this.#onWakeUp.bind(this), 60 * 1000);
					im_v2_lib_logger.Logger.desktop('StatusHandler: onWakeUp event, call is active, delay 60 sec');
					return;
				}
				if (!im_v2_lib_desktop.DesktopManager.getInstance().canReloadWindow()) {
					await DesktopDataUpdater.reloadChatInfo();
					return;
				}
				im_v2_lib_logger.Logger.desktop('StatusHandler: onWakeUp event, reload window');
				im_v2_lib_desktopApi.DesktopApi.reloadWindow();
			}
		}
	}

	const ONE_HOUR = 60 * 60 * 1000;
	class ReloadChecker {
		#initDate;
		#sidePanelManager = BX.SidePanel.Instance;
		static init() {
			return new ReloadChecker();
		}
		constructor() {
			this.#initDate = new Date();
			this.#startReloadCheck();
			this.#subscribeToReloadEvent();
		}
		#startReloadCheck() {
			setInterval(async () => {
				const isReloadNeeded = await this.#isReloadNeeded();
				if (!isReloadNeeded) {
					return;
				}
				if (!im_v2_lib_desktop.DesktopManager.getInstance().canReloadWindow()) {
					await DesktopDataUpdater.reloadChatInfo();
					return;
				}
				this.#reloadWindow();
			}, ONE_HOUR);
		}
		async #isReloadNeeded() {
			if (im_v2_lib_utils.Utils.date.isSameDay(new Date(), this.#initDate)) {
				return false;
			}
			if (this.#sidePanelManager.opened) {
				im_v2_lib_logger.Logger.desktop('Checker: checkDayForReload, slider is open - delay reload');
				return false;
			}
			if (im_v2_lib_call.CallManager.getInstance().hasCurrentCall()) {
				im_v2_lib_logger.Logger.desktop('Checker: checkDayForReload, call is active - delay reload');
				return false;
			}
			return CheckUtils.testInternetConnection();
		}
		#reloadWindow() {
			im_v2_lib_logger.Logger.desktop('Checker: checkDayForReload, new day - reload window');
			im_v2_lib_desktopApi.DesktopApi.reloadWindow();
		}
		#subscribeToReloadEvent() {
			main_core.Event.bind(window, 'beforeunload', () => {
				const event = new main_core_events.BaseEvent();
				main_core_events.EventEmitter.emit(window, im_v2_const.EventType.desktop.onReload, event);
			});
		}
	}

	/* eslint-disable no-undef */
	class DesktopChatWindow {
		static init() {
			return new DesktopChatWindow();
		}
		constructor() {
			ReloadChecker.init();
			WakeUpHandler.init();
			StatusHandler.init();
			AuthHandler.init();
			BxLinkHandler.init();
			CounterHandler.init();
			HotkeyHandler.init();
			NewTabHandler.init();
			SliderBindings.init();
			this.#sendInitEvent();
			this.#subscribeOnErrorEvent();
			this.#initComplete();
		}
		#sendInitEvent() {
			const {
				preloadedEntities: {
					legacyCurrentUser
				}
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_desktopApi.DesktopApi.emit(im_v2_const.EventType.desktop.onInit, [{
				userInfo: legacyCurrentUser
			}]);
		}
		#initComplete() {
			im_v2_lib_desktopApi.DesktopApi.setLogInfo = function (...params) {
				im_v2_lib_logger.Logger.desktop(...params);
			};
			window.BX.debugEnable(true);
			im_v2_lib_desktopApi.DesktopApi.printWelcomePrompt();
		}
		#subscribeOnErrorEvent() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.request.onAuthError, () => {
				return this.#handleInvalidAuthError();
			});
		}
		#handleInvalidAuthError() {
			return im_v2_lib_desktopApi.DesktopApi.login();
		}
	}

	/* eslint-disable no-undef */
	class DesktopBrowserWindow {
		static init() {
			return new DesktopBrowserWindow();
		}
		constructor() {
			ReloadChecker.init();
			WakeUpHandler.init();
			HotkeyHandler.init();
			SliderBindings.init();
			NewTabHandler.init();
			this.#initComplete();
		}
		#initComplete() {
			im_v2_lib_desktopApi.DesktopApi.setLogInfo = function (...params) {
				im_v2_lib_logger.Logger.desktop(...params);
			};
		}
	}

	const CHANNEL_DESKTOP = 'im-channel-desktop';
	class DesktopBroadcastManager {
		#actionHandlers = {
			[im_v2_const.DesktopBroadcastAction.notification]: this.#onNotifierClick.bind(this),
			[im_v2_const.DesktopBroadcastAction.answerButtonClick]: this.#onAnswerButtonClick.bind(this),
			[im_v2_const.DesktopBroadcastAction.bxLink]: this.#handleBxLinkCommand.bind(this)
		};
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		static init() {
			DesktopBroadcastManager.getInstance();
		}
		constructor() {
			this.initBroadcastHandler();
		}
		initBroadcastHandler() {
			this.channel = new BroadcastChannel(CHANNEL_DESKTOP);
			if (im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				return;
			}
			main_core.Event.bind(this.channel, 'message', event => {
				const {
					data
				} = event;
				if (!im_v2_lib_desktopApi.DesktopApi.isActiveTab()) {
					return;
				}
				const handleAction = this.#actionHandlers[data.action];
				if (!handleAction) {
					return;
				}
				handleAction(data.params);
			});
		}
		sendActionMessage(message) {
			this.channel.postMessage(message);
		}
		#onNotifierClick(params) {
			im_v2_lib_messageNotifier.MessageNotifierManager.getInstance().onNotifierClick(params);
		}
		#onAnswerButtonClick(params) {
			const {
				mediaParams,
				callParams
			} = params;
			im_v2_lib_call.CallManager.getInstance().onAnswerButtonClick(mediaParams, callParams);
		}
		#handleBxLinkCommand(params) {
			BxLinkProcessor.handleCommand(params.command, params.rawParams);
		}
	}

	const DESKTOP_PROTOCOL_VERSION = 2;
	const LOCATION_RESET_TIMEOUT = 1000;
	class DesktopManager {
		#desktopIsActive;
		#desktopActiveVersion;
		#locationChangedToBx = false;
		#enableRedirectCounter = 1;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		static init() {
			DesktopManager.getInstance();
		}
		static isDesktop() {
			return im_v2_lib_desktopApi.DesktopApi.isDesktop();
		}
		static isChatWindow() {
			return im_v2_lib_desktopApi.DesktopApi.isChatWindow();
		}
		constructor() {
			this.#initDesktopStatus();
			if (!DesktopManager.isDesktop()) {
				return;
			}
			DesktopBroadcastManager.init();
			if (im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				DesktopChatWindow.init();
			} else {
				DesktopBrowserWindow.init();
			}
		}
		isDesktopActive() {
			if (DesktopManager.isDesktop()) {
				return true;
			}
			return this.#desktopIsActive;
		}
		setDesktopActive(flag) {
			this.#desktopIsActive = flag;
		}
		setDesktopVersion(version) {
			this.#desktopActiveVersion = version;
		}
		getDesktopVersion() {
			return this.#desktopActiveVersion;
		}
		isLocationChangedToBx() {
			return this.#locationChangedToBx;
		}
		canReloadWindow() {
			return im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode();
		}
		redirectToChat(dialogId = '', messageId = 0) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToChat', dialogId);
			let link = `bx://${im_v2_const.DesktopBxLink.chat}/dialogId/${dialogId}`;
			if (messageId > 0) {
				link += `/messageId/${messageId}`;
			}
			this.openBxLink(link);
			return Promise.resolve();
		}
		redirectToChatWithBotContext(dialogId = '', context = {}) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToChatWithBotContext', dialogId);
			let link = `bx://${im_v2_const.DesktopBxLink.botContext}/dialogId/${dialogId}`;
			if (!main_core.Type.isPlainObject(context)) {
				return Promise.reject();
			}
			const preparedContext = Encoder.encodeParamsJson(context);
			link += `/context/${preparedContext}`;
			this.openBxLink(link);
			return Promise.resolve();
		}
		redirectToLines(dialogId = '') {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToLines', dialogId);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.lines}/dialogId/${dialogId}`);
			return Promise.resolve();
		}
		redirectToCopilot(dialogId = '') {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToCopilot', dialogId);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.copilot}/dialogId/${dialogId}`);
			return Promise.resolve();
		}
		redirectToCollab(dialogId = '') {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToCollab', dialogId);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.collab}/dialogId/${dialogId}`);
			return Promise.resolve();
		}
		redirectToChannel(dialogId = '') {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToChannel', dialogId);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.channel}/dialogId/${dialogId}`);
			return Promise.resolve();
		}
		redirectToTaskComments(dialogId = '', messageId = 0) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToTaskComments', dialogId);
			let link = `bx://${im_v2_const.DesktopBxLink.taskComments}/dialogId/${dialogId}`;
			if (messageId > 0) {
				link += `/messageId/${messageId}`;
			}
			this.openBxLink(link);
			return Promise.resolve();
		}
		redirectToNotifications() {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToNotifications');
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.notifications}`);
			return Promise.resolve();
		}
		redirectToRecentSearch() {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToRecentSearch');
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.recentSearch}`);
			return Promise.resolve();
		}
		redirectToConference(code) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToConference', code);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.conference}/code/${code}`);
			return Promise.resolve();
		}
		redirectToSettings(sectionName) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToSettings', sectionName);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.settings}/section/${sectionName}`);
			return Promise.resolve();
		}
		openConference(code) {
			im_v2_lib_logger.Logger.warn('Desktop: openConference', code);
			const result = Conference.openConference(code);
			if (!result) {
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		}
		toggleConference() {
			im_v2_lib_logger.Logger.warn('Desktop: toggleConference');
			Conference.toggleConference();
		}
		redirectToChatCreation(chatType) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToChatCreation', chatType);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.chatCreation}/chatType/${chatType}/`);
			return Promise.resolve();
		}
		redirectToVideoCall(dialogId = '', withVideo = true) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToVideoCall', dialogId, withVideo);
			const withVideoParam = withVideo ? 'Y' : 'N';
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.call}/dialogId/${dialogId}/withVideo/${withVideoParam}`);
			return Promise.resolve();
		}
		redirectToPhoneCall(number, params) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToPhoneCall', number, params);
			const encodedParams = Encoder.encodeParamsJson(params);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.phone}/number/${number}/phoneParams/${encodedParams}`);
			return Promise.resolve();
		}
		redirectToCallList(callListId, params) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToCallList', callListId, params);
			const encodedParams = Encoder.encodeParamsJson(params);
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.callList}/callListId/${callListId}/callListParams/${encodedParams}`);
			return Promise.resolve();
		}
		openAccountTab(domainName) {
			this.openBxLink(`bx://v2/${domainName}/${im_v2_const.DesktopBxLink.openTab}`);
		}
		openPage(url, options = {}) {
			const encodedParams = Encoder.encodeParamsJson({
				url,
				options
			});
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.openPage}/options/${encodedParams}`);
		}
		redirectToLayout({
			id,
			entityId
		}) {
			im_v2_lib_logger.Logger.warn('Desktop: redirectToLayout', id, entityId);
			const preparedEntityId = entityId ?? '';
			this.openBxLink(`bx://${im_v2_const.DesktopBxLink.openLayout}/id/${id}/entityId/${preparedEntityId}`);
			return Promise.resolve();
		}
		async checkStatusInDifferentContext() {
			if (!this.isDesktopActive()) {
				return false;
			}
			if (im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				return false;
			}
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop() && !im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				return true;
			}
			return CheckUtils.testImageLoad();
		}
		checkForRedirect() {
			if (!this.isRedirectEnabled() || !this.isRedirectOptionEnabled()) {
				return Promise.resolve(false);
			}
			return this.checkStatusInDifferentContext();
		}
		async checkForOpenBrowserPage() {
			await im_v2_application_core.Core.ready();
			if (!this.isDesktopActive() || !this.isRedirectOptionEnabled()) {
				return false;
			}
			const desktopVersion = this.getDesktopVersion();
			if (!im_v2_lib_desktopApi.DesktopApi.isFeatureSupportedInVersion(desktopVersion, im_v2_lib_desktopApi.DesktopFeature.openPage.id)) {
				return false;
			}
			return CheckUtils.testImageLoad(CheckUtils.IMAGE_DESKTOP_TWO_WINDOW_MODE);
		}
		isRedirectEnabled() {
			return this.#enableRedirectCounter > 0;
		}
		enableRedirect() {
			this.#enableRedirectCounter++;
		}
		disableRedirect() {
			this.#enableRedirectCounter--;
		}
		isRedirectOptionEnabled() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isDesktopRedirectAvailable)) {
				return false;
			}
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop() && !im_v2_lib_desktopApi.DesktopApi.isChatWindow()) {
				return true;
			}
			return im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.desktop.enableRedirect);
		}
		openBxLink(rawUrl) {
			const preparedUrl = this.#prepareBxUrl(rawUrl);
			this.#locationChangedToBx = true;
			setTimeout(() => {
				const event = new main_core_events.BaseEvent({
					compatData: []
				});
				main_core_events.EventEmitter.emit(window, 'BXLinkOpened', event);
				this.#locationChangedToBx = false;
			}, LOCATION_RESET_TIMEOUT);
			location.href = preparedUrl;
		}
		#prepareBxUrl(url) {
			if (/^bx:\/\/v(\d)\//.test(url)) {
				return url;
			}
			return url.replace('bx://', `bx://v${DESKTOP_PROTOCOL_VERSION}/${location.hostname}/`);
		}
		#initDesktopStatus() {
			const settings = main_core.Extension.getSettings('im.v2.lib.desktop');
			this.setDesktopActive(settings.get('desktopIsActive'));
			this.setDesktopVersion(settings.get('desktopActiveVersion'));
		}
	}

	exports.DesktopBroadcastManager = DesktopBroadcastManager;
	exports.DesktopManager = DesktopManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Lib);
//# sourceMappingURL=desktop-manager.bundle.js.map
