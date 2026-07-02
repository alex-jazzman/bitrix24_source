/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_desktop, im_v2_lib_call, main_core_events) {
	'use strict';

	const SoundFile = {
		[im_v2_const.SoundType.reminder]: '/bitrix/js/im/audio/reminder.mp3',
		[im_v2_const.SoundType.newMessage1]: '/bitrix/js/im/audio/new-message-1.mp3',
		[im_v2_const.SoundType.newMessage2]: '/bitrix/js/im/audio/new-message-2.mp3',
		[im_v2_const.SoundType.send]: '/bitrix/js/im/audio/send.mp3',
		[im_v2_const.SoundType.dialtone]: '/bitrix/js/im/audio/video-dialtone.mp3',
		[im_v2_const.SoundType.ringtone]: '/bitrix/js/im/audio/video-ringtone.mp3',
		[im_v2_const.SoundType.ringtoneModern]: '/bitrix/js/im/audio/video-ringtone-modern.mp3?v2',
		[im_v2_const.SoundType.start]: '/bitrix/js/im/audio/video-start.mp3',
		[im_v2_const.SoundType.stop]: '/bitrix/js/im/audio/video-stop.mp3',
		[im_v2_const.SoundType.error]: '/bitrix/js/im/audio/video-error.mp3'
	};
	class SoundPlayer {
		static syncEvent = 'im-sound-stop';
		#isPlayingLoop = false;
		#currentPlayingSound;
		#loopTimers = {};
		constructor() {
			main_core_events.EventEmitter.subscribe('onLocalStorageSet', event => {
				const [changedLocalStorageData] = event.getData();
				if (changedLocalStorageData.key !== SoundPlayer.syncEvent) {
					return;
				}
				this.stop(changedLocalStorageData.value.soundType, true);
			});
		}
		playSingle(type) {
			if (this.#currentPlayingSound) {
				this.stop(type);
			}
			this.#notifyOtherTabs(type);
			this.#currentPlayingSound = new Audio(SoundFile[type]);
			this.#currentPlayingSound.play().catch(() => {
				this.#currentPlayingSound = null;
			});
		}
		playLoop(type, timeout = 5000) {
			if (this.#currentPlayingSound) {
				this.stop(type);
			}
			this.#isPlayingLoop = false;
			this.playSingle(type);
			this.#isPlayingLoop = true;
			this.#loopTimers[type] = setTimeout(() => {
				this.playLoop(type, timeout);
			}, timeout);
		}
		stop(type, skip = false) {
			if (!skip) {
				this.#notifyOtherTabs(type);
			}
			if (this.#loopTimers[type]) {
				this.#isPlayingLoop = false;
				clearTimeout(this.#loopTimers[type]);
			}
			if (!this.#currentPlayingSound) {
				return;
			}
			if (!this.#currentPlayingSound.src.endsWith(SoundFile[type])) {
				return;
			}
			this.#currentPlayingSound.pause();
			this.#currentPlayingSound.currentTime = 0;
			this.#currentPlayingSound = null;
		}
		#notifyOtherTabs(soundType) {
			const localStorageTtl = 1;
			BX.localStorage.set(SoundPlayer.syncEvent, {
				soundType
			}, localStorageTtl);
		}
	}

	class SoundNotificationManager {
		static instance = null;
		static getInstance() {
			if (!this.instance) {
				const store = im_v2_application_core.Core.getStore();
				const desktopManager = im_v2_lib_desktop.DesktopManager.getInstance();
				const callManager = im_v2_lib_call.CallManager.getInstance();
				const soundPlayer = new SoundPlayer();
				this.instance = new this(store, desktopManager, callManager, soundPlayer);
			}
			return this.instance;
		}
		constructor(store, desktopManager, callManager, soundPlayer) {
			this.store = store;
			this.desktopManager = desktopManager;
			this.soundPlayer = soundPlayer;
			this.callManager = callManager;
		}
		playOnce(type) {
			if (this.#hasActiveCall() || !this.#canPlayInContext()) {
				return;
			}
			if (!this.#isSoundEnabled() || this.#isUserDnd()) {
				return;
			}
			this.soundPlayer.playSingle(type);
		}
		forcePlayOnce(type) {
			if (!this.#canPlayInContext()) {
				return;
			}
			if (!this.#isSoundEnabled()) {
				return;
			}
			this.soundPlayer.playSingle(type);
		}
		playLoop(type, timeout = 5000, force = false) {
			if (this.#hasActiveCall() && !force) {
				return;
			}
			if (!this.#canPlayInContext()) {
				return;
			}
			if (force) {
				this.soundPlayer.playLoop(type, timeout);
				return;
			}
			if (this.#isUserDnd() || !this.#isSoundEnabled()) {
				return;
			}
			this.soundPlayer.playLoop(type, timeout);
		}
		stop(type) {
			this.soundPlayer.stop(type);
		}
		#canPlayInContext() {
			return im_v2_lib_desktop.DesktopManager.isDesktop() || !this.desktopManager.isDesktopActive();
		}
		#isUserDnd() {
			const status = this.store.getters['application/settings/get'](im_v2_const.Settings.user.status);
			return status === im_v2_const.UserStatus.dnd;
		}
		#hasActiveCall() {
			return this.callManager.hasCurrentCall();
		}
		#isSoundEnabled() {
			return this.store.getters['application/settings/get'](im_v2_const.Settings.notification.enableSound);
		}
	}

	exports.SoundNotificationManager = SoundNotificationManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Event);
//# sourceMappingURL=sound-notification-manager.bundle.js.map
