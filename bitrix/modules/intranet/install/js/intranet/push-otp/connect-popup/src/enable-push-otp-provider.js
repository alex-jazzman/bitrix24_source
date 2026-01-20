import { ajax as Ajax } from 'main.core';
import { ConnectPopup } from './connect-popup';
import { DeviceConnectedView } from './view/device-connected-view';
import { EnterCodeView } from './view/enter-code-view';
import { QrView } from './view/qr-view';
import { SendNumberView } from './view/send-number-view';
import { SuccessView } from './view/success-view';
import { RepeatingRequest } from './repeating-request';
import { deeplinkRequest } from './request';

export class EnablePushOtpProvider
{
	#options: Object;
	#defaultTtl = 600;

	constructor(options)
	{
		this.#options = options || {};
	}

	appConnectingHandler(params: Object): Promise
	{
		const initParams = {};
		if (params?.device)
		{
			initParams.deviceInfo = params.device;
		}

		if (params?.startTimestamp)
		{
			initParams.startTimestamp = params?.startTimestamp ?? 0;
		}

		const data = {
			secret: params.secret,
			type: 'push',
			sync1: params.code,
			sync2: '',
			signedUserId: params.signedUserId,
			initParams,
		};

		return Ajax.runAction(
			'intranet.v2.Otp.setupPushOtp',
			{
				mode: 'ajax',
				method: 'POST',
				data,
			},
		);
	}

	#createQrView(): QrView
	{
		return new QrView({
			signedUserId: this.#options.signedUserId,
			pullConfig: this.#options.pullConfig,
			linkProvider: this.#options?.linkProvider ?? (() => deeplinkRequest(this.#options.intent, this.#defaultTtl)),
			repeatingRequest: this.#options?.repeatingRequest ?? new RepeatingRequest(this.#defaultTtl * 1000),
			callback: this.#options?.appConnectingProvider ?? this.appConnectingHandler,
			onAppConnected: this.#options?.events?.onAppConnected,
			id: 'qr',
		});
	}

	#createConnectedView(): DeviceConnectedView
	{
		return new DeviceConnectedView({
			id: 'connected',
		});
	}

	#createSendNumberView(): SendNumberView
	{
		return new SendNumberView({
			signedUserId: this.#options.signedUserId,
			phoneNumber: this.#options.phoneNumber,
			isPhoneNumberConfirmed: this.#options.isPhoneNumberConfirmed,
			id: 'number',
		});
	}

	#createEnterCodeView(): EnterCodeView
	{
		return new EnterCodeView({
			id: 'code',
			signedUserId: this.#options.signedUserId,
			phoneNumber: this.#options.phoneNumber,
		});
	}

	#createSuccessView(): SuccessView
	{
		return new SuccessView({
			id: 'success',
			excludeFromSteps: true,
		});
	}

	create(code: ?string): ConnectPopup
	{
		const viewList = [
			this.#createQrView(),
			this.#createConnectedView(),
			this.#createSendNumberView(),
			this.#createEnterCodeView(),
			this.#createSuccessView(),
		];

		return this.#createConnectPopup(viewList, code);
	}

	onlySmsOtpConfirm(): ConnectPopup
	{
		const viewList = [
			this.#createEnterCodeView(),
		];

		return this.#createConnectPopup(viewList);
	}

	onlySmsOtpChange(): ConnectPopup
	{
		const sendNumberView = this.#createSendNumberView();
		const viewList = [
			sendNumberView,
			this.#createEnterCodeView(),
		];

		const popup = this.#createConnectPopup(viewList);
		sendNumberView.setForceChangeMode(true);

		return popup;
	}

	onlyPushOtp(): ConnectPopup
	{
		const viewList = [
			this.#createQrView(),
			this.#createConnectedView(),
		];

		return this.#createConnectPopup(viewList);
	}

	full(): ConnectPopup
	{
		const viewList = [
			this.#createQrView(),
			this.#createConnectedView(),
			this.#createSendNumberView(),
			this.#createEnterCodeView(),
			this.#createSuccessView(),
		];

		return this.#createConnectPopup(viewList);
	}

	resumeOtpRequest(): Promise
	{
		return BX.ajax.runAction(
			'intranet.v2.Otp.resumeOtp',
			{
				mode: 'ajax',
				method: 'POST',
				data: {
					signedUserId: this.#options.signedUserId,
				},
			},
		);
	}

	#createConnectPopup(viewList: Array, viewCode: string = null): ConnectPopup
	{
		const popup = new ConnectPopup({
			viewList,
			viewCode,
		});
		popup.subscribe('onClose', () => {
			this.#options?.events?.onPopupClose?.();
		});

		return popup;
	}
}
