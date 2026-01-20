import { AvatarRound, AvatarBase } from 'ui.avatar';
import { Cache, Tag, Text, ajax, Loc } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import { sendData } from 'ui.analytics';

export class ProfileDeactivate
{
	#cache = new Cache.MemoryCache();
	#options: Object;

	constructor(options: Object)
	{
		this.#options = options;
	}

	getProfileItem(): Object
	{
		return {
			text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_TITLE'),
			items: [
				{
					text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'),
					onclick: () => {
						this.#sendAnalyticsEvent();
						this.#options.callback();
						this.#getDialog(Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'), 1).show();
					},
				},
				{
					text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_2'),
					onclick: () => {
						this.#sendAnalyticsEvent();
						this.#options.callback();
						this.#getDialog(Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_2'), 2).show();
					},
				},
			],
		};
	}

	#sendAnalyticsEvent(): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: 'click_turnoff_2fa_employee_temp',
		});
	}

	#getDialog(buttonText: string, days: number): Dialog
	{
		return this.#cache.remember(`popup-days-${days}`, () => {
			return new Dialog({
				width: 600,
				content: this.#getPopupContent(),
				hasOverlay: true,
				centerButtons: [
					new Button({
						text: buttonText,
						style: AirButtonStyle.FILLED_ALERT,
						size: ButtonSize.EXTRA_LARGE,
						useAirDesign: true,
						onclick: () => {
							ajax.runAction('intranet.v2.Otp.pauseOtp', {
								mode: 'ajax',
								method: 'POST',
								data: {
									signedUserId: this.#options.signedUserId,
									days,
								},
							}).then(() => {
								this.#getDialog(buttonText, days).hide();
								this.#cache.delete(`popup-days-${days}`);
								BX.SidePanel.Instance.postMessageTop(window, 'userProfileSlider::reloadList', {});
								location.reload();
							});
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_BUTTON_CANCEL'),
						style: AirButtonStyle.PLAIN,
						size: ButtonSize.EXTRA_LARGE,
						useAirDesign: true,
						onclick: () => {
							this.#getDialog(buttonText, days).hide();
							this.#cache.delete(`popup-days-${days}`);
						},
					}),
				],
			});
		});
	}

	#getPopupContent(): HTMLElement
	{
		return this.#cache.remember('popupContent', () => {
			return Tag.render`
				<div class="intranet-otp-deactivate-popup-content__wrapper">
					<div class="intranet-otp-deactivate-popup-content__title">${Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_TITLE')}</div>
					<div class="intranet-otp-deactivate-popup-content-user__wrapper">
						<div class="intranet-otp-deactivate-popup-content-user__avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="intranet-otp-deactivate-popup-content-user-name__wrapper">
							<div class="intranet-otp-deactivate-popup-content-user__name">${Text.encode(this.#options.fullName)}</div>
							${this.#getWorkPosition()}
						</div>
					</div>
					<div class="intranet-otp-deactivate-popup-content__description">
						${Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_DESCRIPTION')}
					</div>
					${this.#getMoreInfoLink()}
				</div>
			`;
		});
	}

	#getMoreInfoLink(): HTMLElement
	{
		return this.#cache.remember('moreInfoLink', () => {
			const onclick = () => {
				top.BX.Helper.show('redirect=detail&code=26676294');
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-otp-deactivate-popup-content__article --ui-hoverable-alt">
					<span>${Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_MORE_LINK')}</span>
				</div>
			`;
		});
	}

	#getAvatar(): AvatarBase
	{
		return this.#cache.remember('avatar', () => {
			return new AvatarRound({
				size: 54,
				userpicPath: this.#options?.avatarUri ? encodeURI(this.#options.avatarUri) : null,
			});
		});
	}

	#getWorkPosition(): HTMLElement
	{
		return this.#cache.remember('workPosition', () => {
			if (!this.#options.workPosition)
			{
				return null;
			}

			return Tag.render`
				<div class="intranet-otp-deactivate-popup-content-user__workposition">${Text.encode(this.#options.workPosition)}</div>
			`;
		});
	}
}
