/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, voximplant, voximplant_phoneCalls, im_v2_application_core, im_v2_lib_call, im_v2_lib_desktopApi, im_v2_lib_logger, im_v2_lib_soundNotification) {
	'use strict';

	class PhoneManager {
		static #instance;
		#controller;
		#settings;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		static init() {
			PhoneManager.getInstance();
		}
		constructor() {
			const {
				phoneSettings
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('PhoneManager: phoneSettings', phoneSettings);
			this.#init(phoneSettings);
		}
		canCall() {
			return this.#settings.phoneEnabled && this.#settings.canPerformCallsByUser;
		}
		openKeyPad(params) {
			this.#controller?.openKeyPad(params);
		}
		closeKeyPad() {
			this.#controller?.closeKeyPad();
		}
		async startCall(number, rawParams = {}) {
			if (!this.#settings.canPerformCallsByLimits) {
				void this.#showCallLimitSlider();
				return;
			}
			if (!this.#controller) {
				return;
			}
			let params = rawParams;
			if (main_core.Type.isStringFilled(params)) {
				params = this.#parseStartCallParams(params);
			}

			// await this.#controller.loadPhoneLines();
			//
			// const lineId = params.LINE_ID ?? this.#controller.defaultLineId;
			// if (this.#controller.isRestLine(lineId))
			// {
			// 	this.#controller.startCallViaRestApp(number, lineId, params);
			// }

			this.closeKeyPad();
			this.#controller.phoneCall(number, params);
		}
		startCallList(rawCallListId, params) {
			if (!this.#controller) {
				return;
			}
			const callListId = Number.parseInt(rawCallListId, 10);
			if (callListId === 0 || Number.isNaN(callListId)) {
				return;
			}
			this.#controller.startCallList(callListId, params);
		}
		toggleDebugFlag(debug) {
			if (!this.#controller) {
				return;
			}
			this.#controller.debug = debug;
		}
		getPhoneCallView() {
			if (!this.#controller) {
				return null;
			}
			return this.#controller?.callView;
		}
		#init(phoneSettings) {
			this.#settings = phoneSettings;
			if (!main_core.Reflection.getClass('BX.Voximplant.PhoneCallsController')) {
				return;
			}
			this.#controller = this.#getController(phoneSettings);
		}
		#getController(phoneSettings) {
			const soundManager = im_v2_lib_soundNotification.SoundNotificationManager.getInstance();
			return new voximplant_phoneCalls.PhoneCallsController({
				phoneEnabled: phoneSettings.phoneEnabled,
				userId: im_v2_application_core.Core.getUserId(),
				isAdmin: this.#isCurrentUserAdmin(),
				restApps: phoneSettings.restApps,
				canInterceptCall: phoneSettings.canInterceptCall,
				deviceActive: phoneSettings.deviceActive,
				defaultLineId: phoneSettings.defaultLineId,
				availableLines: phoneSettings.availableLines,
				messengerFacade: {
					isThemeDark: () => false,
					isDesktop: () => im_v2_lib_desktopApi.DesktopApi.isDesktop(),
					hasActiveCall: () => im_v2_lib_call.CallManager.getInstance().hasCurrentCall(),
					repeatSound: (melodyName, time, force) => soundManager.playLoop(melodyName, time, force),
					stopRepeatSound: melodyName => soundManager.stop(melodyName),
					playSound: (melodyName, force) => {
						if (force) {
							soundManager.forcePlayOnce(melodyName);
							return;
						}
						soundManager.playOnce(melodyName);
					},
					setLocalConfig: () => {},
					getLocalConfig: () => {},
					getAvatar: userId => this.#getUserAvatar(userId)
				},
				events: {
					[voximplant_phoneCalls.PhoneCallsController.Events.onCallCreated]: () => this.#onCallCreated(),
					[voximplant_phoneCalls.PhoneCallsController.Events.onCallConnected]: event => this.#onCallConnected(event),
					[voximplant_phoneCalls.PhoneCallsController.Events.onCallDestroyed]: () => this.#onCallDestroyed(),
					[voximplant_phoneCalls.PhoneCallsController.Events.onDeviceCallStarted]: () => this.#onDeviceCallStarted()
				}
			});
		}
		#onCallCreated() {
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return;
			}
			im_v2_lib_desktopApi.DesktopApi.stopDiskSync();
		}
		#onCallDestroyed() {
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return;
			}
			im_v2_lib_desktopApi.DesktopApi.startDiskSync();
		}
		#onDeviceCallStarted() {
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return;
			}
			const target = im_v2_lib_desktopApi.DesktopApi.findWindow('callWindow') ?? window;
			im_v2_lib_desktopApi.DesktopApi.activateWindow(target);
			// close desktop topmost window?
		}
		#onCallConnected(event) {
			const {
				isIncoming,
				isDeviceCall
			} = event.getData();
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop() || isIncoming || isDeviceCall) {
				return;
			}
			const target = im_v2_lib_desktopApi.DesktopApi.findWindow('callWindow') ?? window;
			im_v2_lib_desktopApi.DesktopApi.activateWindow(target);
		}
		#isCurrentUserAdmin() {
			return im_v2_application_core.Core.getStore().getters['users/isCurrentUserAdmin'];
		}
		#getUserAvatar(userId) {
			const user = im_v2_application_core.Core.getStore().getters['users/get'](userId, true);
			return user.avatar;
		}
		#parseStartCallParams(jsonParams) {
			let params = jsonParams;
			try {
				params = JSON.parse(params);
			} catch {
				params = {};
			}
			return params;
		}
		async #showCallLimitSlider() {
			const SLIDER_EXTENSION = 'voximplant.common';
			await main_core.Runtime.loadExtension(SLIDER_EXTENSION);
			BX.Voximplant.openLimitSlider();
		}
	}

	exports.PhoneManager = PhoneManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX, BX.Voximplant, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=phone.bundle.js.map
