import { Dialog } from 'ui.system.dialog';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { Button, AirButtonStyle, CancelButton } from 'ui.buttons';
import { Tag, Loc, ajax, Extension, Runtime } from 'main.core';
import { UI } from 'ui.notification';
import './style.css';

export type ExtensionSettings = {
	signedUserId: string,
	pushOtpConnected: boolean,
};

export class LogoutAllConfirm
{
	#cache: BaseCache = new MemoryCache();

	show(): void
	{
		this.#getPopup().show();
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
						onclick: () => {
							// eslint-disable-next-line promise/catch-or-return
							this.#logout().then(() => {
								dialog.hide();

								const settings = this.#getSettings();
								if (settings.pushOtpConnected && !this.#isKeepTrustedDevice())
								{
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
								else
								{
									UI.Notification.Center.notify({
										content: Loc.getMessage(
											'INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TEXT',
											{
												'#TITLE#': `<span style="font-size: 14px; font-weight: 500;line-height: 19px;">${Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_NOTIFY_TITLE')}</span>`,
											},
										),
										autoHide: true,
										position: 'bottom-right',
										closeButton: false,
										useAirDesign: true,
									});
								}
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

	#getTrustedDeviceCheckbox(): HTMLDivElement
	{
		return this.#cache.remember('trusted-device', () => {
			return Tag.render`
				<div class="intranet-logout-all-confirm-popup__checkbox">
					<label class="intranet-logout-all-confirm-popup__checkbox-label">
						<input type="checkbox" checked>
						${Loc.getMessage('INTRANET_LOGOUT_ALL_CONFIRM_KEEP_TRUSTED')}
					</label>
				</div>
			`;
		});
	}

	#isKeepTrustedDevice(): boolean
	{
		return false;
	}

	#logout(): Promise<void>
	{
		return ajax.runAction('intranet.v2.Otp.logoutAll', {
			data: {
				signedUserId: this.#getSettings().signedUserId,
				keepTrustedDevice: this.#isKeepTrustedDevice() ? 'Y' : 'N',
			},
		});
	}

	#getSettings(): ExtensionSettings
	{
		return Extension.getSettings('intranet.logout-all-confirm');
	}
}
