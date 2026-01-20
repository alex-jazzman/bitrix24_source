import { sendData } from 'ui.analytics';

export class Analytics
{
	static ADD_PHONE_SUCCESS = 'add_phone_success';
	static SHOW_INPUT_PHONE = 'show_input_phone';
	static SHOW_INPUT_PHONE_CODE = 'show_input_phone_code';
	static SHOW_INSTALL_APP = 'show_install_app';
	static SHOW_INSTALL_APP_SUCCESS = 'show_install_app_success';

	static sendEvent(eventName: string): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: eventName,
		});
	}
}
