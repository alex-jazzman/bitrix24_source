import { Loc, Tag, Type, Dom, Text } from 'main.core';
import { Loader } from 'main.loader';
import 'main.qrcode';
import './css/reconnect-qr-view.css';
import './css/qr-view.css';
import { PullClient } from 'pull.client';
import { BaseView } from './base-view';
import { Button, AirButtonStyle } from 'ui.buttons';
import 'ui.icon-set.outline';
import { deeplinkRequest } from '../request';
import { RepeatingRequest } from '../repeating-request';
import { Analytics } from '../analytics';
import { makeQrCodeTo } from '../util';

export class ReconnectQrView extends BaseView
{
	#signedUserId: ?string;
	#pullConfig: Object;
	#callback: function;
	#intent: string;
	#deviceName: string;
	#devicePlatform: string;
	#qrContainer: HTMLElement;
	#loader: Loader;
	#isQrRevealed: boolean = false;
	#pull: ?PullClient = null;
	#unsubscribePull: ?Function = null;
	#repeatingRequest: RepeatingRequest;
	#defaultTtl: number = 600;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#pullConfig = Type.isObject(options.pullConfig) ? options.pullConfig : {};
		this.#callback = Type.isFunction(options.callback) ? options.callback : () => {};
		this.#intent = options.intent || '';
		this.#deviceName = options.deviceName || '';
		this.#devicePlatform = options.devicePlatform || '';
		this.#qrContainer = Tag.render`<div class="intranet-push-otp-connect-popup__qr-container"></div>`;
		this.#repeatingRequest = new RepeatingRequest(this.#defaultTtl * 1000);
		this.#loader = new Loader({
			target: this.#qrContainer,
			mode: 'inline',
			size: 120,
		});
	}

	render(): HTMLElement
	{
		this.#renderQRPlaceholder();

		const deviceIconClass = this.#devicePlatform.toLowerCase() === 'ios'
			? 'intranet-push-otp-connect-popup__reconnect-device-icon'
			: 'intranet-push-otp-connect-popup__reconnect-device-icon --android';

		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div class="intranet-push-otp-connect-popup__popup-title">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_TITLE')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_DESC')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div>${this.#qrContainer}</div>
					<div class="intranet-push-otp-connect-popup__view-guide-connect">
						<ol class="intranet-push-otp-connect-popup-ol-list">
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-1">
								${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_1')}
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-2">
								${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_2')}
								<div class="intranet-push-otp-connect-popup__reconnect-device-name">
									<i class="${deviceIconClass}"></i>
									${Text.encode(this.#deviceName)}
								</div>
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-3">
								${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_3')}
							</li>
						</ol>
						<div class="intranet-push-otp-connect-popup-alert">
							<div class="ui-icon-set --o-alert"></div>
							<div class="intranet-push-otp-connect-popup-alert-text">
								${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_QR_WARNING')}
							</div>
						</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container --center">
					${this.#createRemindLaterButton().render()}
				</div>
			</div>
		`;
	}

	#renderQRPlaceholder(): void
	{
		const placeholder = Tag.render`<i class="intranet-push-otp-connect-popup__reconnect-qr-placeholder-image">`;
		const showButton = new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_SHOW_QR_BTN'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_ACCENT_2,
			onclick: () => {
				Analytics.sendEventWithCSection(Analytics.RECONNECT_CLICK, 'qr');
				this.#revealQr();
			},
		});
		const qrIcon = Tag.render`<div class="intranet-push-otp-connect-popup__qr-icon ui-icon-set --o-qr-code">`;

		Dom.append(qrIcon, placeholder);
		showButton.renderTo(placeholder);
		Dom.append(placeholder, this.#qrContainer);
	}

	#revealQr(): void
	{
		if (this.#isQrRevealed)
		{
			return;
		}
		this.#isQrRevealed = true;

		Analytics.sendEvent(Analytics.RECONNECT_SHOW_QR);

		Dom.clean(this.#qrContainer);

		this.#subscribeToScanQr();
		this.#repeatingRequest.start(this.#fetchQrCode.bind(this));
	}

	#fetchQrCode(): Promise
	{
		Dom.clean(this.#qrContainer);
		this.#loader.show();

		return deeplinkRequest(this.#intent, this.#defaultTtl)
			.then((response) => {
				const link = response.data?.link;
				if (link)
				{
					makeQrCodeTo(this.#qrContainer, link);
				}
				this.#loader.hide();
			})
			.catch(() => {
				this.#loader.hide();
			});
	}

	#subscribeToScanQr(): void
	{
		this.#pull = new PullClient();
		this.#unsubscribePull = this.#pull.subscribe({
			moduleId: 'security',
			command: 'pushOtpCode',
			callback: (params) => {
				params.signedUserId = this.#signedUserId;
				this.#callback(params).then(
					() => {
						Analytics.sendEvent(Analytics.RECONNECT_DEVICE_SUCCESS);
						this.emit('onNextView', { viewCode: '' });
					},
					(response) => console.error(response),
				).catch((error) => {
					console.error('Error in reconnect QR scan callback:', error);
				});
			},
		});
		this.#pull.start(this.#pullConfig);
	}

	#createRemindLaterButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_REMIND_LATER_BTN'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				Analytics.sendEventWithCSection(Analytics.RECONNECT_CLICK, 'later');
				this.emit('onParentClose');
			},
		});
	}

	afterShow(option: Object): void
	{
		Analytics.sendEvent(Analytics.SHOW_RECONNECT_DEVICE);
		BX.userOptions.save('intranet', 'push_otp_device_lost', null, 'N');
	}

	beforeDismiss(option: Object): void
	{
		this.#repeatingRequest.stop();

		if (this.#unsubscribePull)
		{
			this.#unsubscribePull();
			this.#unsubscribePull = null;
		}
	}
}
