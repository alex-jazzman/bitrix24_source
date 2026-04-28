import { ajax as Ajax, Extension } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import { ConnectPopup } from './connect-popup';
import { DeviceConnectedView } from './view/device-connected-view';
import { EnterCodeView } from './view/enter-code-view';
import { QrView } from './view/qr-view';
import { SendNumberView } from './view/send-number-view';
import { SuccessView } from './view/success-view';
import { ReconnectQrView } from './view/reconnect-qr-view';
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

	#createReconnectQrView(): ReconnectQrView
	{
		return new ReconnectQrView({
			id: 'reconnectQr',
			excludeFromSteps: true,
			deviceName: this.#options.deviceName,
			devicePlatform: this.#options.devicePlatform,
			signedUserId: this.#options.signedUserId,
			intent: this.#options.intent,
			pullConfig: this.#options.pullConfig,
			callback: this.appConnectingHandler,
		});
	}

	reconnectDevice(): ConnectPopup
	{
		return this.#createConnectPopup([
			this.#createReconnectQrView(),
			this.#createSuccessView(),
		]);
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
		const enterCode = this.#createEnterCodeView();
		const viewList = [
			sendNumberView,
			enterCode,
		];

		const popup = this.#createConnectPopup(viewList);
		sendNumberView.setForceChangeMode(true);
		enterCode.setForceChangeMode(true);

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
		];

		if (Extension.getSettings('intranet.push-otp.connect-popup')?.get('canSendSms'))
		{
			viewList.push(this.#createSendNumberView(), this.#createEnterCodeView());
		}

		viewList.push(this.#createSuccessView());

		if (this.#options.enablePostConnectFlow !== false)
		{
			if (Number(this.#options.userId) > 0 && this.#getCurrentUserId() !== Number(this.#options.userId))
			{
				return this.#createConnectPopup(viewList);
			}

			const popup = this.#createConnectPopup(viewList, null, { skipDefaultOnClose: true });

			popup.subscribe('onClose', (event) => {
				const context = event.getData()?.context;
				const qrView = context?.getViewByCode('qr');
				if (qrView?.isAppSuccessConnected() === true)
				{
					this.openOtpSettingsWithTooltip();
				}
				else
				{
					this.#options?.events?.onPopupClose?.();
				}
			});

			return popup;
		}

		return this.#createConnectPopup(viewList);
	}

	openOtpSettingsWithTooltip(): void
	{
		const settingsUrl = this.#getCurrentUserSettingsUrl();
		if (!settingsUrl)
		{
			return;
		}

		sessionStorage.setItem('showRecoveryCodesTooltip', 'Y');

		const topSlider = SidePanel.Instance.getTopSlider();
		if (topSlider?.url.startsWith(settingsUrl))
		{
			top.BX.Event.EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');

			return;
		}

		SidePanel.Instance.open(settingsUrl, {
			events: {
				onOpen: () => {
					EventEmitter.subscribeOnce('BX.Intranet.Security:onChangePage', (event) => {
						if (event.data.page === 'otpConnected')
						{
							EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
						}
					});
				},
			},
		});
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

	#createConnectPopup(viewList: Array, viewCode: string = null, options: Object = {}): ConnectPopup
	{
		const popup = new ConnectPopup({
			viewList,
			viewCode,
		});

		if (options.skipDefaultOnClose !== true)
		{
			popup.subscribe('onClose', () => {
				this.#options?.events?.onPopupClose?.();
			});
		}

		return popup;
	}

	#getCurrentUserSettingsUrl(): string
	{
		return Extension.getSettings('intranet.push-otp.connect-popup')?.get('settingsUrl') ?? '';
	}

	#getCurrentUserId(): number
	{
		return Number(Extension.getSettings('intranet.push-otp.connect-popup')?.get('userId') ?? 0);
	}
}
