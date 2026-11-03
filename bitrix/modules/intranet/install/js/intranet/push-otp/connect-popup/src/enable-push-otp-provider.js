import { ajax as Ajax, Extension, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import { ConnectPopup } from './connect-popup';
import { DeviceConnectedView } from './view/device-connected-view';
import { EmailEnterCodeView } from './view/email-enter-code-view';
import { EmailView } from './view/email-view';
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
	#isSkippingDeviceConnect: boolean = false;
	#skipDeviceConnectFlowId: ?string = null;
	#skipDeviceConnectAvailableChannels: Array<string> = [];
	#skipDeviceConnectStartPromise: ?Promise = null;
	#skipDeviceConnectConfirmedChannel: ?string = null;
	#skipDeviceConnectCompletionPromise: ?Promise = null;
	#isSkipDeviceConnectCompleted: boolean = false;
	#isConnectionCompleted: boolean = false;

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
			pullClientProvider: this.#options?.pullClientProvider,
			callback: this.#options?.appConnectingProvider ?? this.appConnectingHandler,
			finishOnAppConnected: this.#options.mandatoryLoginMode === true,
			onAppConnected: (view) => {
				this.#isConnectionCompleted = true;
				this.#options?.events?.onAppConnected?.(view);
			},
			onSkipDeviceConnect: this.#options.canSkipDeviceConnect === true
				? this.startSkipDeviceConnect.bind(this)
				: null,
			id: 'qr',
		});
	}

	#createConnectedView(): DeviceConnectedView
	{
		return new DeviceConnectedView({
			id: 'connected',
		});
	}

	#createSendEmailView(): EmailView
	{
		return new EmailView({
			id: 'email',
			signedUserId: this.#options.signedUserId,
			email: this.#options.email,
			flowIdProvider: () => this.#skipDeviceConnectFlowId,
			isSkippingDeviceConnectProvider: () => this.#isSkippingDeviceConnect,
			canSwitchChannelProvider: () => this.#canSwitchSkipDeviceConnectChannel('phone'),
			canFinishProvider: () => this.#options.canSendSms !== true,
		});
	}

	#createEmailEnterCodeView(): EmailEnterCodeView
	{
		return new EmailEnterCodeView({
			id: 'emailCode',
			signedUserId: this.#options.signedUserId,
			email: this.#options.email,
			flowIdProvider: () => this.#skipDeviceConnectFlowId,
			onContactConfirmed: (flowId) => this.#onSkipContactConfirmed('email', flowId),
			canSwitchChannelProvider: () => this.#canSwitchSkipDeviceConnectChannel('phone'),
		});
	}

	#createSendNumberView(): SendNumberView
	{
		return new SendNumberView({
			signedUserId: this.#options.signedUserId,
			phoneNumber: this.#options.phoneNumber,
			isPhoneNumberConfirmed: this.#options.isPhoneNumberConfirmed,
			flowIdProvider: () => this.#skipDeviceConnectFlowId,
			onContactConfirmed: (flowId) => this.#onSkipContactConfirmed('phone', flowId),
			isSkippingDeviceConnectProvider: () => this.#isSkippingDeviceConnect,
			canSwitchChannelProvider: () => this.#canSwitchSkipDeviceConnectChannel('email'),
			canFinishProvider: () => this.#canFinishSkipDeviceConnect(),
			onFinish: () => this.completeSkipDeviceConnect(this.#skipDeviceConnectConfirmedChannel),
			id: 'number',
		});
	}

	#createEnterCodeView(): EnterCodeView
	{
		return new EnterCodeView({
			id: 'code',
			signedUserId: this.#options.signedUserId,
			phoneNumber: this.#options.phoneNumber,
			flowIdProvider: () => this.#skipDeviceConnectFlowId,
			onContactConfirmed: (flowId) => this.#onSkipContactConfirmed('phone', flowId),
			isSkippingDeviceConnectProvider: () => this.#isSkippingDeviceConnect,
			canSwitchChannelProvider: () => this.#canSwitchSkipDeviceConnectChannel('email'),
			canFinishProvider: () => this.#canFinishSkipDeviceConnect(),
			onFinish: () => this.completeSkipDeviceConnect(this.#skipDeviceConnectConfirmedChannel),
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
			this.#createSendEmailView(),
			this.#createEmailEnterCodeView(),
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

	onlyEmailOtpChange(): ConnectPopup
	{
		const sendEmailView = this.#createSendEmailView();
		const enterCode = this.#createEmailEnterCodeView();
		const viewList = [
			sendEmailView,
			enterCode,
		];

		const popup = this.#createConnectPopup(viewList);
		sendEmailView.setForceChangeMode(true);

		return popup;
	}

	onlyPushOtp(): ConnectPopup
	{
		if (this.#options.canSkipDeviceConnect === true)
		{
			return this.full();
		}

		const viewList = this.#options.mandatoryLoginMode === true
			? [this.#createQrView(), this.#createSuccessView()]
			: [this.#createQrView(), this.#createConnectedView()];

		return this.#createConnectPopup(viewList);
	}

	full(): ConnectPopup
	{
		this.#isConnectionCompleted = false;
		const viewList = [
			this.#createQrView(),
			this.#createConnectedView(),
		];

		if (this.#options.canSendEmail === true)
		{
			viewList.push(this.#createSendEmailView(), this.#createEmailEnterCodeView());
		}

		if (this.#options.canSendSms === true)
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

			popup.subscribe('onClose', () => {
				const isConnectionCompleted = this.isConnectionCompleted();
				this.cancelSkipDeviceConnect();
				if (isConnectionCompleted)
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

	startSkipDeviceConnect(): Promise
	{
		const startPromise = Promise.resolve(Ajax.runAction('intranet.v2.Otp.startSkipDeviceConnect', {
			method: 'POST',
			data: this.#options.signedUserId ? { signedUserId: this.#options.signedUserId } : {},
		})).then(async (response) => {
			const flowId = response?.data?.flowId;
			if (!Type.isStringFilled(flowId))
			{
				throw new Error('Skip device connect flow was not started');
			}

			const availableChannels = Array.isArray(response?.data?.availableChannels)
				? response.data.availableChannels
				: [response?.data?.channel]
			;
			const supportedChannels = availableChannels.filter(
				(channel) => this.#isSkipDeviceConnectChannelSupported(channel),
			);
			const responseChannel = response?.data?.channel;
			const channel = supportedChannels.includes(responseChannel)
				? responseChannel
				: supportedChannels[0]
			;
			if (!channel)
			{
				await this.#cancelSkipDeviceConnectFlow(flowId);

				throw new Error('No supported skip device connect channel is available');
			}

			this.#isSkippingDeviceConnect = true;
			this.#skipDeviceConnectFlowId = flowId;
			this.#skipDeviceConnectAvailableChannels = supportedChannels;
			this.#skipDeviceConnectConfirmedChannel = null;
			this.#skipDeviceConnectCompletionPromise = null;
			this.#isSkipDeviceConnectCompleted = false;

			return {
				...response,
				data: {
					...response.data,
					channel,
					availableChannels: supportedChannels,
				},
			};
		});
		this.#skipDeviceConnectStartPromise = startPromise;
		const clearStartPromise = () => {
			if (this.#skipDeviceConnectStartPromise === startPromise)
			{
				this.#skipDeviceConnectStartPromise = null;
			}
		};
		startPromise.then(clearStartPromise, clearStartPromise);

		return startPromise;
	}

	completeSkipDeviceConnect(confirmedChannel: ?string = null): Promise
	{
		if (!this.#isSkippingDeviceConnect || !this.#skipDeviceConnectFlowId)
		{
			return Promise.resolve();
		}

		if (this.#skipDeviceConnectCompletionPromise)
		{
			return this.#skipDeviceConnectCompletionPromise;
		}

		const flowId = this.#skipDeviceConnectFlowId;
		const completionPromise = Promise.resolve(Ajax.runAction('intranet.v2.Otp.completeSkipDeviceConnect', {
			method: 'POST',
			data: {
				flowId,
				...(this.#options.signedUserId ? { signedUserId: this.#options.signedUserId } : {}),
			},
		})).then((response) => {
			if (!this.#isSkippingDeviceConnect || this.#skipDeviceConnectFlowId !== flowId)
			{
				return { ...response, status: 'canceled' };
			}

			this.#isSkipDeviceConnectCompleted = true;
			this.#isConnectionCompleted = true;

			return {
				...response,
				skipDeviceConnectCompleted: true,
				nextViewCode: 'success',
			};
		}).catch((response) => {
			if (!this.#isSkippingDeviceConnect || this.#skipDeviceConnectFlowId !== flowId)
			{
				return { status: 'canceled' };
			}

			throw response;
		}).finally(() => {
			if (this.#skipDeviceConnectCompletionPromise === completionPromise)
			{
				this.#skipDeviceConnectCompletionPromise = null;
			}
		});
		this.#skipDeviceConnectCompletionPromise = completionPromise;

		return completionPromise;
	}

	#onSkipContactConfirmed(confirmedChannel: string, flowId: ?string): Promise
	{
		if (
			!this.#isSkippingDeviceConnect
			|| !flowId
			|| this.#skipDeviceConnectFlowId !== flowId
		)
		{
			return Promise.resolve();
		}

		this.#skipDeviceConnectConfirmedChannel = confirmedChannel;
		if (
			confirmedChannel === 'email'
			&& this.#skipDeviceConnectAvailableChannels.includes('phone')
		)
		{
			return Promise.resolve({ status: 'success' });
		}

		return this.completeSkipDeviceConnect(confirmedChannel);
	}

	#canFinishSkipDeviceConnect(): boolean
	{
		return this.#isSkippingDeviceConnect
			&& !this.#isSkipDeviceConnectCompleted
			&& this.#skipDeviceConnectConfirmedChannel !== null;
	}

	isConnectionCompleted(): boolean
	{
		return this.#isConnectionCompleted;
	}

	cancelSkipDeviceConnect(): void
	{
		if (this.#skipDeviceConnectStartPromise)
		{
			this.#skipDeviceConnectStartPromise.then(
				() => this.cancelSkipDeviceConnect(),
				() => {},
			);

			return;
		}

		if (!this.#isSkippingDeviceConnect || !this.#skipDeviceConnectFlowId)
		{
			return;
		}

		const flowId = this.#skipDeviceConnectFlowId;
		const isCompleted = this.#isSkipDeviceConnectCompleted;
		this.#isSkippingDeviceConnect = false;
		this.#isSkipDeviceConnectCompleted = false;
		this.#skipDeviceConnectFlowId = null;
		this.#skipDeviceConnectAvailableChannels = [];
		this.#skipDeviceConnectConfirmedChannel = null;
		this.#skipDeviceConnectCompletionPromise = null;
		if (!isCompleted)
		{
			this.#cancelSkipDeviceConnectFlow(flowId);
		}
	}

	#cancelSkipDeviceConnectFlow(flowId: string): Promise
	{
		return Ajax.runAction('intranet.v2.Otp.cancelSkipDeviceConnect', {
			method: 'POST',
			data: {
				flowId,
				...(this.#options.signedUserId ? { signedUserId: this.#options.signedUserId } : {}),
			},
		}).catch(() => {});
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
				this.cancelSkipDeviceConnect();
				this.#options?.events?.onPopupClose?.();
			});
		}

		return popup;
	}

	#getCurrentUserSettingsUrl(): string
	{
		return Extension.getSettings('intranet.push-otp.connect-popup')?.get('settingsUrl') ?? '';
	}

	#canSwitchSkipDeviceConnectChannel(channel: string): boolean
	{
		return this.#isSkippingDeviceConnect
			&& !this.#isSkipDeviceConnectCompleted
			&& this.#skipDeviceConnectAvailableChannels.includes(channel)
		;
	}

	#isSkipDeviceConnectChannelSupported(channel: string): boolean
	{
		return (channel === 'phone' && this.#options.canSendSms === true)
			|| (channel === 'email' && this.#options.canSendEmail === true)
		;
	}

	#getCurrentUserId(): number
	{
		return Number(Extension.getSettings('intranet.push-otp.connect-popup')?.get('userId') ?? 0);
	}
}
