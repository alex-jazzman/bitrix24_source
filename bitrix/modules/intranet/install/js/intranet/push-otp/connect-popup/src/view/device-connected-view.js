import { Loc, Tag, Type } from 'main.core';
import { BaseButton, Button } from 'ui.buttons';
import { BaseView } from './base-view';
import { Analytics } from '../analytics';

export class DeviceConnectedView extends BaseView
{
	#button: Button;
	#phoneLabel: string;
	#phoneOs: string;
	#isProcessing: boolean = false;

	constructor(options)
	{
		super(options);
		this.#button = this.#createContinueBtn();
		this.#phoneLabel = Type.isStringFilled(options.phoneLabel) ? options.phoneLabel : '';
		this.#phoneOs = Type.isStringFilled(options.phoneOs) ? options.phoneOs : '';
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
					<div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo ${this.#phoneOs === 'ios' ? '' : '--android'}"></div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo-text">${this.#phoneLabel}</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
					${this.#button.render()}
				</div>
			</div>
		`;
	}

	#createContinueBtn(): BaseButton
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
