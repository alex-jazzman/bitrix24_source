import { PushOtp } from 'intranet.notify-banner.push-otp';
import { ConnectPopup, EnablePushOtpProvider, pauseOtpRequest } from 'intranet.push-otp.connect-popup';
import { Menu } from 'intranet.push-otp.menu';
import { sendData } from 'ui.analytics';

export class BannerFactory
{
	static create(options): ?PushOtp
	{
		let bannerPushOtp = null;
		if (options.canShowBannerPushOtp)
		{
			if (!options.isOtpActive)
			{
				const popup = this.#getConnectPopup(options);
				bannerPushOtp = new PushOtp({
					title: options.title,
					text: options.text,
					clickEnableBtn: () => {
						popup.show();
						this.#sendAnalyticEvent('banner_on');
					},
				});
			}
			else if (options.isNotPushOtp)
			{
				let clickDisableBtn = null;

				if (options.canDeactivate)
				{
					clickDisableBtn = (event) => {
						const menu = new Menu(event.button, {
							days: options.days,
							callback: (item) => {
								pauseOtpRequest(
									item.numDays,
									options.signedUserId,
								).then(() => BX.Intranet.UserProfile.Security.changeContent('otpConnected'))
									.catch((response) => console.error(response));
							},
						});

						menu.show();
						this.#sendAnalyticEvent('banner_off');
					};
				}

				const popup = this.#getConnectPopup(options);
				bannerPushOtp = new PushOtp({
					title: options.title,
					text: options.text,
					clickEnableBtn: () => {
						popup.show();
						this.#sendAnalyticEvent('banner_on');
					},
					clickDisableBtn,
				});
			}
		}

		return bannerPushOtp;
	}

	static #getConnectPopup(options): ConnectPopup
	{
		const provider = new EnablePushOtpProvider(options);

		return options.provideSmsOtp
			? provider.full()
			: provider.onlyPushOtp();
	}

	static #sendAnalyticEvent(cElement: string): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: 'click',
			c_element: cElement,
		});
	}
}
