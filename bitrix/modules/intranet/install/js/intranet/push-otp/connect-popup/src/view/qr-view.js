import { Loc, Tag, Type, Dom } from 'main.core';
import { Loader } from 'main.loader';
import 'ui.design-tokens';
import 'intranet.design-tokens';
import 'main.qrcode';
import './css/qr-view.css';
import { PULL, PullClient } from 'pull.client';
import { BaseView } from './base-view';
import 'ui.icon-set.outline';
import { RepeatingRequest } from '../repeating-request';
import { Analytics } from '../analytics';
import { makeQrCodeTo } from '../util';

export class QrView extends BaseView
{
	#signedUserId: ?string;
	#pullConfig: Object;
	#callback: function;
	#linkProvider: function;
	#repeatingRequest: RepeatingRequest;
	#qrContainer: HTMLElement;
	#loader: Loader;
	#isAppSuccessConnected: boolean = false;
	#onAppConnected: () => {};
	#unsubscribePull: ?Function = null;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#repeatingRequest = options.repeatingRequest;
		this.#pullConfig = Type.isObject(options.pullConfig) ? { ...options.pullConfig } : {};
		this.#callback = Type.isFunction(options.callback) ? options.callback : () => {};
		this.#linkProvider = Type.isFunction(options.linkProvider) ? options.linkProvider : () => new Promise();
		this.#qrContainer = Tag.render`<div class="intranet-push-otp-connect-popup__qr-container"></div>`;
		this.#loader = new Loader({
			target: this.#qrContainer,
			mode: 'inline',
			size: 120,
		});
		this.#onAppConnected = Type.isFunction(options.onAppConnected) ? options.onAppConnected : () => {};
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_TITLE')}</span>`;
	}

	render(): HTMLElement
	{
		this.#subscribeToScanQr();

		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_QR_DESCRIPTION')}
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
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-3">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_3')}</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-4">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_4')}</li>
						</ol>
						<div class="intranet-push-otp-connect-popup-alert">
							<div class="ui-icon-set --o-alert"></div>
							<div class="intranet-push-otp-connect-popup-alert-text">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_DANGER')}</div>
						</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
				</div>
			</div>
		`;
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

		return this.#linkProvider()
			.then((response) => {
				const link = response.data?.link;
				if (link)
				{
					this.#showQrCode(link);
				}
				this.#loader.hide();
			}).catch(() => {});
	}

	#subscribeToScanQr(): void
	{
		const pull = new PullClient();
		this.#unsubscribePull = pull.subscribe({
			moduleId: 'security',
			command: 'pushOtpCode',
			callback: (params) => {
				params.signedUserId = this.#signedUserId;
				this.#callback(params).then(
					(response) => {
						this.#isAppSuccessConnected = true;
						this.#onAppConnected(this);
						this.emit(
							'onNextView',
							{
								viewCode: '',
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

	#showLoader(): Loader
	{
		Dom.clean(this.#qrContainer);
		this.#loader.show();
	}

	isAppSuccessConnected(): boolean
	{
		return this.#isAppSuccessConnected;
	}
}
