import { Browser, Loc, Tag, Type, Text } from 'main.core';
import { Button } from 'ui.buttons';
import { BaseView, MOBILE_POPUP_WIDTH } from './base-view';
import { Analytics } from '../analytics';
import './css/device-connected-view.css';

export class DeviceConnectedView extends BaseView
{
	#button: Button;
	#phoneLabel: string;
	#phoneOs: string;
	#isProcessing: boolean = false;
	#isMobile: boolean;

	constructor(options)
	{
		super(options);
		this.#button = this.#createContinueBtn();
		this.#phoneLabel = Type.isStringFilled(options.phoneLabel) ? options.phoneLabel : '';
		this.#phoneOs = Type.isStringFilled(options.phoneOs) ? options.phoneOs : '';
		this.#isMobile = Browser.isMobile();
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECTED_TITLE')}</span>`;
	}

	beforeShow(options: Object): void
	{
		this.#phoneLabel = options?.device?.displayModel ?? '';
		this.#phoneOs = options?.device?.manufacturer === 'Apple' ? 'ios' : 'android';
		this.#isProcessing = false;
	}

	afterShow(option: Object)
	{
		Analytics.sendEvent(Analytics.SHOW_INSTALL_APP_SUCCESS);
	}

	render(): HTMLElement
	{
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
				<div class="intranet-push-otp-connect-popup__view-description-text">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_DESC')}</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div class="intranet-push-otp-connect-popup__view-connect-device">
						<div class="intranet-push-otp-connect-popup__view-connect-logo ${this.#phoneOs === 'ios' ? '' : '--android'}"></div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo-text">${Text.encode(this.#phoneLabel)}</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
					${this.#button.render()}
				</div>
			</div>
		`;
	}

	getPopupWidth(): ?number
	{
		return this.#isMobile ? MOBILE_POPUP_WIDTH : null;
	}

	#renderMobileView(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container --mobile">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_DESC')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container --mobile --device">
					<div class="intranet-push-otp-connect-popup__view-connect-device">
						<div class="intranet-push-otp-connect-popup__view-connect-logo ${this.#phoneOs === 'ios' ? '' : '--android'}"></div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo-text">${Text.encode(this.#phoneLabel)}</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container --mobile">
					${this.#button.render()}
				</div>
			</div>
		`;
	}

	#createContinueBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_NEXT_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			onclick: (button) => {
				if (this.#isProcessing || button.isWaiting())
				{
					return;
				}
				this.#isProcessing = true;
				this.emit('onNextView', {
					viewCode: null,
					options: {
						closeIfLast: true,
					},
				});
			},
		});
	}
}
