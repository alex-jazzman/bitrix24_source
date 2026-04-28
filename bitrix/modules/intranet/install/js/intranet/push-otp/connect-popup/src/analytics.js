import { sendData } from 'ui.analytics';

export class Analytics
{
	static ADD_PHONE_SUCCESS = 'add_phone_success';
	static SHOW_INPUT_PHONE = 'show_input_phone';
	static SHOW_INPUT_PHONE_CODE = 'show_input_phone_code';
	static SHOW_INSTALL_APP = 'show_install_app';
	static SHOW_INSTALL_APP_SUCCESS = 'show_install_app_success';
	static SHOW_TYPE_SAVE_CODE = 'show_type_save_code';
	static SHOW_RECONNECT_DEVICE = 'show_reconnect_device';
	static RECONNECT_SHOW_QR = 'reconnect_show_qr';
	static RECONNECT_CLICK = 'reconnect_qr_click';
	static RECONNECT_DEVICE_SUCCESS = 'reconnect_device_success';

	static sendEvent(eventName: string): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: eventName,
		});
	}

	static sendEventWithCElement(eventName: string, cElement: string): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: eventName,
			cElement,
		});
	}

	static sendEventWithCSection(eventName: string, cSection: string): void
	{
		sendData({
			tool: 'user_settings',
			category: 'security',
			event: eventName,
			cSection,
		});
	}
}
