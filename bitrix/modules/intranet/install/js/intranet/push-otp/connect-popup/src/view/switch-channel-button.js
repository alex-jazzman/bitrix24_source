import { Loc } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';

export const createSwitchChannelButton = (view, channel: 'phone' | 'email'): Button => {
	const isEmail = channel === 'email';

	return new Button({
		text: Loc.getMessage(
			isEmail
				? 'INTRANET_PUSH_OTP_CONNECT_POPUP_SWITCH_TO_EMAIL_BTN'
				: 'INTRANET_PUSH_OTP_CONNECT_POPUP_SWITCH_TO_PHONE_BTN',
		),
		noCaps: true,
		size: Button.Size.MD,
		style: AirButtonStyle.PLAIN_NO_ACCENT,
		useAirDesign: true,
		props: {
			'data-testid': `bx-intranet-push-otp-connect-popup-switch-to-${channel}`,
		},
		onclick: () => {
			view.emit('onNextView', { viewCode: isEmail ? 'email' : 'number' });
		},
	});
};

export const createFinishButton = (
	view,
	onError: (errors: Array) => void,
	onFinish: () => Promise = () => Promise.resolve(),
): Button => {
	return new Button({
		text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_FINISH_SKIP_DEVICE_CONNECT_BTN'),
		noCaps: true,
		size: Button.Size.MD,
		style: AirButtonStyle.PLAIN_NO_ACCENT,
		useAirDesign: true,
		props: {
			'data-testid': 'bx-intranet-push-otp-connect-popup-finish-skip-device-connect',
		},
		onclick: (button) => {
			if (button.isWaiting())
			{
				return;
			}

			button.setWaiting(true);
			onFinish()
				.then((response) => {
					if (response?.skipDeviceConnectCompleted === true)
					{
						view.emit('onNextView', { viewCode: response.nextViewCode ?? 'success' });
					}
				})
				.catch((response) => onError(response?.errors ?? []))
				.finally(() => button.setWaiting(false));
		},
	});
};
