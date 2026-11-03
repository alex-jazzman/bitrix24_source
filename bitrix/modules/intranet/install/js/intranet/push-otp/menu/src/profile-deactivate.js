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
			attrs: {
				'data-testid': 'intranet-user-profile-otp-deactivate',
			},
			items: [
				{
					text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'),
					attrs: {
						'data-testid': 'intranet-user-profile-otp-deactivate-days-1',
					},
					onclick: () => {
						this.#sendAnalyticsEvent();
						this.#options.callback();
						this.#getDialog(Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'), 1).show();
					},
				},
				{
					text: Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_2'),
					attrs: {
						'data-testid': 'intranet-user-profile-otp-deactivate-days-2',
					},
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

	// ui.system.dialog builds its own content wrapper and accepts no attributes for it,
	// so the test id is applied from here on every show of the dialog
	#applyDialogTestId(): void
	{
		const dialogNode = this.#getPopupContent().closest('.ui-system-dialog__content-wrapper');

		if (dialogNode)
		{
			dialogNode.dataset.testid = 'intranet-otp-deactivate-popup-dialog';
		}
	}

	#getDialog(buttonText: string, days: number): Dialog
	{
		return this.#cache.remember(`popup-days-${days}`, () => {
			return new Dialog({
				width: 600,
				content: this.#getPopupContent(),
				hasOverlay: true,
				events: {
					onShow: () => this.#applyDialogTestId(),
				},
				centerButtons: [
					new Button({
						text: buttonText,
						style: AirButtonStyle.FILLED_ALERT,
						size: ButtonSize.EXTRA_LARGE,
						useAirDesign: true,
						dataset: {
							testid: `intranet-otp-deactivate-popup-confirm-btn-days-${days}`,
						},
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
						dataset: {
							testid: 'intranet-otp-deactivate-popup-cancel-btn',
						},
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
				<div class="intranet-otp-deactivate-popup-content__wrapper" data-testid="intranet-otp-deactivate-popup">
					<div class="intranet-otp-deactivate-popup-content__title" data-testid="intranet-otp-deactivate-popup-title">${Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_TITLE')}</div>
					<div class="intranet-otp-deactivate-popup-content-user__wrapper">
						<div class="intranet-otp-deactivate-popup-content-user__avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="intranet-otp-deactivate-popup-content-user-name__wrapper">
							<div class="intranet-otp-deactivate-popup-content-user__name" data-testid="intranet-otp-deactivate-popup-user-name">${Text.encode(this.#options.fullName)}</div>
							${this.#getWorkPosition()}
						</div>
					</div>
					<div class="intranet-otp-deactivate-popup-content__description" data-testid="intranet-otp-deactivate-popup-description">
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
				<div onclick="${onclick}" class="intranet-otp-deactivate-popup-content__article --ui-hoverable-alt" data-testid="intranet-otp-deactivate-popup-more-link">
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
				<div class="intranet-otp-deactivate-popup-content-user__workposition" data-testid="intranet-otp-deactivate-popup-user-position">${Text.encode(this.#options.workPosition)}</div>
			`;
		});
	}
}
