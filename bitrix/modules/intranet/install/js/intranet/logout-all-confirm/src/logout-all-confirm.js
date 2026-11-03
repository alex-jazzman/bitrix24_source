import { Dialog } from 'ui.system.dialog';
import { MemoryCache } from 'main.core.cache';
import { Button, AirButtonStyle, CancelButton } from 'ui.buttons';
import { Tag, Loc, ajax, Event, Extension, Runtime } from 'main.core';
import { UI } from 'ui.notification';

import { bootstrap } from './bootstrap';
import { NetworkLogoutFlow } from './network-logout-flow';
import { createNotificationContent } from './notification-content';
import './style.css';

export type ExtensionSettings = {
	signedUserId: string,
	pushOtpConnected: boolean,
	isCloud: boolean,
	notificationContent: string,
};

export class LogoutAllConfirm
{
	#cache = new MemoryCache();
	#networkLogoutFlow: NetworkLogoutFlow;

	constructor()
	{
		this.#networkLogoutFlow = new NetworkLogoutFlow({
			isCloud: this.#getSettings().isCloud,
		});
	}

	show(): void
	{
		this.#getPopup().show();
	}

	restoreAfterNetworkReturn(): boolean
	{
		return this.#networkLogoutFlow.restoreAfterNetworkReturn({
			reconnect: () => this.#showReconnectPopup(),
			notify: () => this.#showNotification(),
		});
	}

	#getPopup(): Dialog
	{
		return this.#cache.remember('popup', () => {
			const dialog = new Dialog({
				closeByClickOutside: false,
				hasOverlay: true,
				width: 400,
				content: this.#getContent(),
				centerButtons: [
					new Button({
						text: Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_BTN_YES'),
						dataset: {
							testid: 'intranet-logout-all-confirm-submit',
						},
						onclick: () => {
							// eslint-disable-next-line promise/catch-or-return
							this.#logout().then((response) => {
								dialog.hide();

								const settings = this.#getSettings();
								this.#networkLogoutFlow.handleLogoutSuccess(
									response,
									settings.pushOtpConnected && !this.#isKeepTrustedDevice(),
									{
										reconnect: () => this.#showReconnectPopup(),
										notify: () => this.#showNotification(),
									},
								);
							});
						},
						useAirDesign: true,
						style: AirButtonStyle.FILLED,
					}),
					new CancelButton({
						onclick: () => {
							dialog.hide();
						},
						useAirDesign: true,
						style: AirButtonStyle.OUTLINE,
					}),
				],
			});

			return dialog;
		});
	}

	#getContent(): HTMLDivElement
	{
		return this.#cache.remember('content', () => {
			return Tag.render`
				<div class="intranet-logout-all-confirm-popup">
					<i class="intranet-logout-all-confirm-popup__logo"></i>
					<div class="intranet-logout-all-confirm-popup__title">
						${Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_TITLE')}
					</div>
					<div class="intranet-logout-all-confirm-popup__description">
						${Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_DESCRIPTION')}
					</div>
				</div>
			`;
		});
	}

	#isKeepTrustedDevice(): boolean
	{
		return false;
	}

	#logout(): Promise
	{
		return ajax.runAction('intranet.v2.Otp.logoutAll', {
			data: this.#networkLogoutFlow.createRequestData({
				signedUserId: this.#getSettings().signedUserId,
				keepTrustedDevice: this.#isKeepTrustedDevice() ? 'Y' : 'N',
			}),
		});
	}

	#showReconnectPopup(): void
	{
		const settings = this.#getSettings();
		// eslint-disable-next-line promise/catch-or-return
		Runtime.loadExtension('intranet.push-otp.connect-popup')
			.then((exports) => {
				const { EnablePushOtpProvider } = exports;
				ajax.runAction('intranet.v2.Otp.getConfig', {
					method: 'POST',
					data: { signedUserId: settings.signedUserId },
				}).then((response) => {
					const provider = new EnablePushOtpProvider({
						...response?.data,
						signedUserId: settings.signedUserId,
						deviceName: settings.deviceName,
						devicePlatform: settings.devicePlatform,
					});
					const popup = provider.reconnectDevice();
					popup.show();
					// eslint-disable-next-line promise/no-nesting
				}).catch(() => {});
			});
	}

	#showNotification(): void
	{
		UI.Notification.Center.notify({
			content: createNotificationContent(this.#getSettings().notificationContent),
			autoHide: true,
			position: 'top-right',
			closeButton: false,
			useAirDesign: true,
		});
	}

	#getSettings(): ExtensionSettings
	{
		return Extension.getSettings('intranet.logout-all-confirm');
	}
}

bootstrap({
	ready: Event.ready,
	restore: () => (new LogoutAllConfirm()).restoreAfterNetworkReturn(),
});
