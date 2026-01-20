import { AirButtonStyle, Button, CloseButton } from 'ui.buttons';
import { ajax, Cache, Tag, Text, Loc } from 'main.core';
import { Popup } from 'main.popup';

export class RestoreNetworkPassword
{
	#options: Object;
	#cache: MemoryCache = new Cache.MemoryCache();

	constructor(options)
	{
		this.#options = options;
	}

	renderTo(target: HTMLElement): void
	{
		if (this.#options.useEmail)
		{
			this.#getEmailRestoreButton().renderTo(target);
		}

		if (this.#options.usePhone)
		{
			this.#getPhoneRestoreButton().renderTo(target);
		}
	}

	#getEmailRestoreButton(): Button
	{
		return this.#cache.remember('emailRestoreButton', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_EMAIL'),
				style: AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: (button) => {
					button.setWaiting(true);
					ajax.runAction('bitrix24.v2.Password.restoreByEmail', {
						data: {
							userId: this.#options.userId,
						},
					}).then(() => {
						button.setWaiting(false);
						this.#createPopup(this.#createSuccessContentByEmail()).show();
					}).catch((response) => {
						button.setWaiting(false);

						if (response.errors[0].message)
						{
							this.#createPopup(this.#createErrorContent(response.errors[0].message)).show();
						}
					});
				},
			});
		});
	}

	#getPhoneRestoreButton(): Button
	{
		return this.#cache.remember('phoneRestoreButton', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_PHONE'),
				style: AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: (button) => {
					button.setWaiting(true);
					ajax.runAction('bitrix24.v2.Password.restoreByPhone', {
						data: {
							userId: this.#options.userId,
						},
					}).then(() => {
						button.setWaiting(false);
						this.#createPopup(this.#createSuccessContentByPhone()).show();
					}).catch((response) => {
						button.setWaiting(false);

						if (response.errors[0].message)
						{
							this.#createPopup(this.#createErrorContent(response.errors[0].message)).show();
						}
					});
				},
			});
		});
	}

	#createSuccessContentByEmail(): HTMLElement
	{
		return Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_SUCCESS')}
				</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_1')}</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_2')}</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_3')}</div>
			</div>
		`;
	}

	#createSuccessContentByPhone(): HTMLElement
	{
		return Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_SUCCESS')}
				</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_1')}</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_2')}</div>
				<div class="b24network-account-popup-text">${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_3')}</div>
			</div>
		`;
	}

	#createErrorContent(errorMessage: string): HTMLElement
	{
		return Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_ERROR')}
				</div>
				<div class="b24network-account-popup-text">${Text.encode(errorMessage)}</div>
			</div>
		`;
	}

	#createPopup(content: HTMLElement): Popup
	{
		const popup = new Popup({
			autoHide: true,
			className: 'b24network-account-popup',
			closeByEsc: true,
			closeIcon: true,
			content,
			cacheable: false,
			width: 450,
			buttons: [
				new CloseButton({
					onclick() {
						popup.close();
					},
					useAirDesign: true,
				}),
			],
		});

		return popup;
	}
}
