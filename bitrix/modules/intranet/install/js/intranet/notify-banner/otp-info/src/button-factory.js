import { Loc, Type } from 'main.core';
import { Button } from 'ui.buttons';
import type { BaseContent } from './content/base-content';

export class ButtonFactory
{
	#settingsUrl: string;
	#pushOtpPopupProvider: () => Promise;
	#content: BaseContent;

	constructor(options: Object, content: BaseContent): void
	{
		this.#settingsUrl = Type.isStringFilled(options.settingsUrl) ? options.settingsUrl : '';
		this.#pushOtpPopupProvider = Type.isFunction(options.pushOtpPopupProvider)
			? options.pushOtpPopupProvider
			: () => new Promise()
		;
		this.#content = content;
	}

	createEnableBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('NOTIFY_BANNER_INFO_ENABLE_BTN'),
			size: BX.UI.Button.Size.LARGE,
			style: BX.UI.AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: this.clickEnableOtp.bind(this),
			props: {
				'data-testid': 'bx-notify-banner-info-enable-otp-btn',
			},
		});
	}

	createLaterBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('NOTIFY_BANNER_INFO_LATER_BTN'),
			size: BX.UI.Button.Size.LARGE,
			style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
			useAirDesign: true,
			onclick: (event) => {
				this.#content.onClickLater();
				event.context?.close();
			},
			props: {
				'data-testid': 'bx-notify-banner-info-later-btn',
			},
		});
	}

	createEnableMandatoryBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('NOTIFY_BANNER_INFO_ENABLE_ALL_BTN'),
			size: BX.UI.Button.Size.LARGE,
			style: BX.UI.AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: (event) => {
				event.context?.close();
				this.#content.onClickEnable();
				BX.SidePanel.Instance.open(`${this.#settingsUrl}?page=security&analyticContext=popup_push_otp`);
			},
			props: {
				'data-testid': 'bx-notify-banner-info-enable-mandatory-otp-btn',
			},
		});
	}

	clickEnableOtp(event): void
	{
		if (event.isWaiting())
		{
			return;
		}
		this.#content.onClickEnable();
		event.setWaiting(true);
		this.#pushOtpPopupProvider(() => event.context?.close()).then(
			(popup) => {
				popup.show();
				event.setWaiting(false);
			},
		).catch(
			() => {
				event.setWaiting(false);
			},
		);
	}
}
