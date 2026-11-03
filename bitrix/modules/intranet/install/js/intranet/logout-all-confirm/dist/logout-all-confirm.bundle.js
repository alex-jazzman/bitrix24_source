/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_system_dialog, main_core_cache, ui_buttons, main_core, ui_notification) {
	'use strict';

	function bootstrap({
		ready,
		restore
	}) {
		ready(restore);
	}

	class NetworkLogoutFlow {
		static RECONNECT_MARKER_KEY = 'intranet.logout-all-confirm.reconnect';
		static RECONNECT_MARKER_TTL = 5 * 60 * 1000;
		static NETWORK_RETURN_HANDLED_STATE_KEY = 'intranet.logout-all-confirm.network-return-handled';
		#isCloud;
		#location;
		#navigationLocation;
		#storage;
		#history;
		#clock;
		constructor({
			isCloud,
			location = window.location,
			navigationLocation = window.top.location,
			storage = window.sessionStorage,
			history = window.history,
			clock = () => Date.now()
		}) {
			this.#isCloud = isCloud === true;
			this.#location = location;
			this.#navigationLocation = navigationLocation;
			this.#storage = storage;
			this.#history = history;
			this.#clock = clock;
		}
		createRequestData(data) {
			if (!this.#isCloud) {
				return data;
			}
			return {
				...data,
				backurl: this.#location.href
			};
		}
		handleLogoutSuccess(response, shouldReconnect, handlers) {
			if (!this.#isCloud) {
				if (shouldReconnect) {
					handlers.reconnect();
				} else {
					handlers.notify();
				}
				return;
			}
			const networkLogoutUrl = response?.data?.networkLogoutUrl;
			if (main_core.Type.isStringFilled(networkLogoutUrl)) {
				if (shouldReconnect) {
					this.#storeReconnectMarker();
				}
				this.#navigationLocation.replace(networkLogoutUrl);
				return;
			}
			if (shouldReconnect) {
				handlers.reconnect();
			} else {
				handlers.notify();
			}
		}
		restoreAfterNetworkReturn(handlers) {
			if (!this.#isCloud) {
				return false;
			}
			let url = null;
			try {
				url = new URL(this.#location.href);
			} catch {
				return false;
			}
			if (url.searchParams.get('justLoggedOut') !== '1') {
				return false;
			}
			if (this.#isNetworkReturnHandled()) {
				return false;
			}
			this.#markNetworkReturnHandled();
			if (this.#consumeReconnectMarker()) {
				handlers.reconnect();
			} else {
				handlers.notify();
			}
			return true;
		}
		#isNetworkReturnHandled() {
			try {
				return this.#history.state?.[NetworkLogoutFlow.NETWORK_RETURN_HANDLED_STATE_KEY] === true;
			} catch {
				return false;
			}
		}
		#markNetworkReturnHandled() {
			try {
				const state = main_core.Type.isPlainObject(this.#history.state) ? this.#history.state : {};
				this.#history.replaceState({
					...state,
					[NetworkLogoutFlow.NETWORK_RETURN_HANDLED_STATE_KEY]: true
				}, '');
			} catch {
				// History failure must not block existing Network return UX.
			}
		}
		#storeReconnectMarker() {
			try {
				this.#storage.setItem(NetworkLogoutFlow.RECONNECT_MARKER_KEY, JSON.stringify({
					reconnect: true,
					createdAt: this.#clock()
				}));
			} catch {
				// Storage failure must not block the Network round-trip.
			}
		}
		#consumeReconnectMarker() {
			let marker = null;
			try {
				marker = this.#storage.getItem(NetworkLogoutFlow.RECONNECT_MARKER_KEY);
				this.#storage.removeItem(NetworkLogoutFlow.RECONNECT_MARKER_KEY);
			} catch {
				return false;
			}
			if (!main_core.Type.isStringFilled(marker)) {
				return false;
			}
			try {
				const data = JSON.parse(marker);
				if (!main_core.Type.isPlainObject(data) || !main_core.Type.isNumber(data.createdAt)) {
					return false;
				}
				const age = this.#clock() - data.createdAt;
				return data.reconnect === true && age >= 0 && age <= NetworkLogoutFlow.RECONNECT_MARKER_TTL;
			} catch {
				return false;
			}
		}
	}

	function createNotificationContent(notificationContent) {
		return main_core.Tag.render`
		<div
			data-testid="intranet-logout-all-confirm-success"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			${notificationContent}
		</div>
	`;
	}

	class LogoutAllConfirm {
		#cache = new main_core_cache.MemoryCache();
		#networkLogoutFlow;
		constructor() {
			this.#networkLogoutFlow = new NetworkLogoutFlow({
				isCloud: this.#getSettings().isCloud
			});
		}
		show() {
			this.#getPopup().show();
		}
		restoreAfterNetworkReturn() {
			return this.#networkLogoutFlow.restoreAfterNetworkReturn({
				reconnect: () => this.#showReconnectPopup(),
				notify: () => this.#showNotification()
			});
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				const dialog = new ui_system_dialog.Dialog({
					closeByClickOutside: false,
					hasOverlay: true,
					width: 400,
					content: this.#getContent(),
					centerButtons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_BTN_YES'),
						dataset: {
							testid: 'intranet-logout-all-confirm-submit'
						},
						onclick: () => {
							// eslint-disable-next-line promise/catch-or-return
							this.#logout().then(response => {
								dialog.hide();
								const settings = this.#getSettings();
								this.#networkLogoutFlow.handleLogoutSuccess(response, settings.pushOtpConnected && !this.#isKeepTrustedDevice(), {
									reconnect: () => this.#showReconnectPopup(),
									notify: () => this.#showNotification()
								});
							});
						},
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.FILLED
					}), new ui_buttons.CancelButton({
						onclick: () => {
							dialog.hide();
						},
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.OUTLINE
					})]
				});
				return dialog;
			});
		}
		#getContent() {
			return this.#cache.remember('content', () => {
				return main_core.Tag.render`
				<div class="intranet-logout-all-confirm-popup">
					<i class="intranet-logout-all-confirm-popup__logo"></i>
					<div class="intranet-logout-all-confirm-popup__title">
						${main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_TITLE')}
					</div>
					<div class="intranet-logout-all-confirm-popup__description">
						${main_core.Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_DESCRIPTION')}
					</div>
				</div>
			`;
			});
		}
		#isKeepTrustedDevice() {
			return false;
		}
		#logout() {
			return main_core.ajax.runAction('intranet.v2.Otp.logoutAll', {
				data: this.#networkLogoutFlow.createRequestData({
					signedUserId: this.#getSettings().signedUserId,
					keepTrustedDevice: this.#isKeepTrustedDevice() ? 'Y' : 'N'
				})
			});
		}
		#showReconnectPopup() {
			const settings = this.#getSettings();
			// eslint-disable-next-line promise/catch-or-return
			main_core.Runtime.loadExtension('intranet.push-otp.connect-popup').then(exports => {
				const {
					EnablePushOtpProvider
				} = exports;
				main_core.ajax.runAction('intranet.v2.Otp.getConfig', {
					method: 'POST',
					data: {
						signedUserId: settings.signedUserId
					}
				}).then(response => {
					const provider = new EnablePushOtpProvider({
						...response?.data,
						signedUserId: settings.signedUserId,
						deviceName: settings.deviceName,
						devicePlatform: settings.devicePlatform
					});
					const popup = provider.reconnectDevice();
					popup.show();
					// eslint-disable-next-line promise/no-nesting
				}).catch(() => {});
			});
		}
		#showNotification() {
			ui_notification.UI.Notification.Center.notify({
				content: createNotificationContent(this.#getSettings().notificationContent),
				autoHide: true,
				position: 'top-right',
				closeButton: false,
				useAirDesign: true
			});
		}
		#getSettings() {
			return main_core.Extension.getSettings('intranet.logout-all-confirm');
		}
	}
	bootstrap({
		ready: main_core.Event.ready,
		restore: () => new LogoutAllConfirm().restoreAfterNetworkReturn()
	});

	exports.LogoutAllConfirm = LogoutAllConfirm;

})(this.BX.Intranet = this.BX.Intranet || {}, BX.UI.System, BX.Cache, BX.UI, BX, BX.UI.Notification);
//# sourceMappingURL=logout-all-confirm.bundle.js.map
