import { Browser, Dom, Loc, Tag, Type } from 'main.core';
import { Loader } from 'main.loader';
import { AirButtonStyle, Button } from 'ui.buttons';
import 'ui.design-tokens';
import 'intranet.design-tokens';
import 'main.qrcode';
import './css/qr-view.css';
import { PullClient } from 'pull.client';
import { BaseView, MOBILE_POPUP_WIDTH } from './base-view';
import 'ui.icon-set.outline';
import { RepeatingRequest } from '../repeating-request';
import { Analytics } from '../analytics';
import { makeQrCodeTo } from '../util';

export const getQrViewPopupWidth = (isMobile) => (isMobile ? MOBILE_POPUP_WIDTH : null);

export const canOpenDeepLink = (deeplink) => Type.isStringFilled(deeplink);

export class QrView extends BaseView
{
	#signedUserId: ?string;
	#pullConfig: Object;
	#callback: function;
	#linkProvider: function;
	#repeatingRequest: RepeatingRequest;
	#qrContainer: HTMLElement;
	#loader: Loader;
	#openAppButton: Button;
	#deeplink: string = '';
	#isMobile: boolean;
	#isAppSuccessConnected: boolean = false;
	#onAppConnected: () => {};
	#finishOnAppConnected: boolean;
	#onSkipDeviceConnect: () => Promise;
	#skipDeviceConnectButton: ?Button = null;
	#skipDeviceConnectErrorContainer: HTMLElement;
	#pullClientProvider: () => PullClient;
	#unsubscribePull: ?Function = null;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#repeatingRequest = options.repeatingRequest;
		this.#pullConfig = Type.isObject(options.pullConfig) ? { ...options.pullConfig } : {};
		this.#callback = Type.isFunction(options.callback) ? options.callback : () => {};
		this.#linkProvider = Type.isFunction(options.linkProvider) ? options.linkProvider : () => new Promise();
		this.#isMobile = Browser.isMobile();
		this.#qrContainer = Tag.render`<div class="intranet-push-otp-connect-popup__qr-container"></div>`;
		this.#loader = new Loader({
			target: this.#qrContainer,
			mode: 'inline',
			size: 120,
		});
		this.#openAppButton = this.#createOpenAppButton();
		this.#onAppConnected = Type.isFunction(options.onAppConnected) ? options.onAppConnected : () => {};
		this.#finishOnAppConnected = options.finishOnAppConnected === true;
		this.#onSkipDeviceConnect = Type.isFunction(options.onSkipDeviceConnect)
			? options.onSkipDeviceConnect
			: null;
		this.#pullClientProvider = Type.isFunction(options.pullClientProvider)
			? options.pullClientProvider
			: () => new PullClient();
		this.#skipDeviceConnectButton = this.#onSkipDeviceConnect ? this.#createSkipDeviceConnectButton() : null;
		this.#skipDeviceConnectErrorContainer = Tag.render`
			<div
				class="intranet-push-otp-connect-popup__skip-device-connect-error"
				data-testid="bx-intranet-push-otp-connect-popup-skip-device-connect-error"
			></div>
		`;
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_TITLE_MSGVER_1')}</span>`;
	}

	getPopupWidth(): ?number
	{
		return getQrViewPopupWidth(this.#isMobile);
	}

	render(): HTMLElement
	{
		this.#subscribeToScanQr();
		if (this.#isMobile)
		{
			return this.#renderMobileView();
		}

		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_QR_DESCRIPTION_MSGVER_1')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div>${this.#qrContainer}</div>
					<div class="intranet-push-otp-connect-popup__view-guide-connect">
						<ol class="intranet-push-otp-connect-popup-ol-list">
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-1">
								${
									Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_1_MSGVER_1', {
										'[LINK]': '<a href="https://appgallery.huawei.com/app/C105947779" target="_blank" class="ui-link ui-link-primary">',
										'[/LINK]': '</a>',
									})
								}
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-2">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_2')}</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-3">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_3_MSGVER_1')}</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-4">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_4_MSGVER_1')}</li>
						</ol>
						<div class="intranet-push-otp-connect-popup-alert">
							<div class="ui-icon-set --o-alert"></div>
							<div class="intranet-push-otp-connect-popup-alert-text">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_DANGER')}</div>
						</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
					${this.#skipDeviceConnectErrorContainer}
					${this.#renderSkipDeviceConnectButton()}
				</div>
			</div>
		`;
	}

	#renderMobileView(): HTMLElement
	{
		return Tag.render`
			<div data-testid="bx-intranet-push-otp-connect-popup-qr-mobile" class="intranet-push-otp-connect-popup__view-container --mobile">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_MOBILE_DESCRIPTION')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container --mobile">
					<div class="intranet-push-otp-connect-popup__mobile-phone"></div>
					<ol class="intranet-push-otp-connect-popup__mobile-guide">
						<li>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_MOBILE_STEP_1')}</li>
						<li>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_MOBILE_STEP_2')}</li>
					</ol>
					${this.#renderOpenAppButton()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
					${this.#skipDeviceConnectErrorContainer}
					${this.#renderSkipDeviceConnectButton()}
				</div>
			</div>
		`;
	}

	#renderOpenAppButton(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__open-app-button-container">
				${this.#openAppButton.render()}
			</div>
		`;
	}

	#createOpenAppButton(): Button
	{
		const button = new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_OPEN_APP_BTN'),
			className: 'intranet-push-otp-connect-popup__open-app-button',
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			props: {
				'data-testid': 'bx-intranet-push-otp-connect-popup-open-app-button',
			},
			onclick: () => {
				if (!canOpenDeepLink(this.#deeplink))
				{
					return;
				}

				window.open(this.#deeplink, '_blank');
			},
		});
		button.setDisabled(true);

		return button;
	}

	#renderSkipDeviceConnectButton(): string | HTMLElement
	{
		return this.#skipDeviceConnectButton ? this.#skipDeviceConnectButton.render() : '';
	}

	#createSkipDeviceConnectButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SKIP_DEVICE_CONNECT_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			props: {
				'data-testid': 'bx-intranet-push-otp-connect-popup-skip-device-connect-button',
			},
			onclick: (button) => {
				if (button.isWaiting() || !this.#onSkipDeviceConnect)
				{
					return;
				}

				button.setWaiting(true);
				Dom.clean(this.#skipDeviceConnectErrorContainer);
				this.#onSkipDeviceConnect()
					.then((response) => {
						const channel = response.data?.channel;
						if (channel === 'phone')
						{
							this.emit('onNextView', { viewCode: 'number' });
						}
						else if (channel === 'email')
						{
							this.emit('onNextView', { viewCode: 'email' });
						}
					})
					.catch(() => {
						Dom.clean(this.#skipDeviceConnectErrorContainer);
						this.#skipDeviceConnectErrorContainer.append(Tag.render`
							<div class="intranet-push-otp-connect-popup-alert-text">
								${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SKIP_DEVICE_CONNECT_ERROR')}
							</div>
						`);
					})
					.finally(() => button.setWaiting(false));
			},
		});
	}

	#showQrCode(deeplink: string): HTMLElement
	{
		makeQrCodeTo(this.#qrContainer, deeplink);
	}

	afterShow(option: Object): void
	{
		Analytics.sendEvent(Analytics.SHOW_INSTALL_APP);
		this.#repeatingRequest.start(this.#fetchQrCode.bind(this));
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

	#fetchQrCode(): Promise
	{
		this.#showLoader();
		if (this.#isMobile)
		{
			this.#deeplink = '';
			this.#openAppButton.setDisabled(true);
		}

		return this.#linkProvider()
			.then((response) => {
				const link = response.data?.link;
				this.#deeplink = Type.isStringFilled(link) ? link : '';
				if (this.#isMobile)
				{
					this.#openAppButton.setDisabled(!canOpenDeepLink(this.#deeplink));
				}
				else if (canOpenDeepLink(this.#deeplink))
				{
					this.#showQrCode(this.#deeplink);
				}
				this.#loader.hide();
			}).catch(() => {
				this.#deeplink = '';
				this.#openAppButton.setDisabled(true);
				this.#loader.hide();
			});
	}

	#subscribeToScanQr(): void
	{
		const pull = this.#pullClientProvider();
		this.#unsubscribePull = pull.subscribe({
			moduleId: 'security',
			command: 'pushOtpCode',
			callback: (params) => {
				params.signedUserId = this.#signedUserId;
				this.#callback(params).then(
					(response) => {
						if (
							this.#finishOnAppConnected
							&& response?.status !== 'ok'
							&& response?.status !== 'success'
						)
						{
							throw response;
						}
						this.#isAppSuccessConnected = true;
						this.#onAppConnected(this);
						this.emit(
							'onNextView',
							{
								viewCode: this.#finishOnAppConnected ? 'success' : '',
								options: {
									device: params.device,
								},
							},
						);
					},
					(response) => console.error(response),
				).catch((error) => {
					console.error('Error in QR scan callback:', error);
				});
			},
		});
		pull.start(this.#pullConfig);
	}

	#showLoader(): void
	{
		if (this.#isMobile)
		{
			return;
		}

		Dom.clean(this.#qrContainer);
		this.#loader.show();
	}

	isAppSuccessConnected(): boolean
	{
		return this.#isAppSuccessConnected;
	}
}
