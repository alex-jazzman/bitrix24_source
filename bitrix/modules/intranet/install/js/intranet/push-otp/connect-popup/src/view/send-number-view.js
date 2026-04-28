import { Dom, Loc, Reflection, Tag, Type, Text } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { AirButtonStyle, BaseButton, Button } from 'ui.buttons';
import { BaseView } from './base-view';
import { PhoneFormatter } from 'ui.type';
import './css/send-number.css';
import 'main.phonenumber';
import { Analytics } from '../analytics';

export class SendNumberView extends BaseView
{
	#signedUserId: ?string;
	#phoneNumber: string;
	#isPhoneNumberConfirmed: boolean;
	#changeClicked: boolean;
	#forceChangeMode: boolean = false;
	#container: BaseCache = new MemoryCache();
	#sendButton: Button;
	#skipButton: Button;
	#titleContainer: HTMLElement;
	#errorContainer: HTMLElement;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#phoneNumber = Type.isString(options.phoneNumber) ? PhoneFormatter.formatValue(options.phoneNumber) : '';
		this.#isPhoneNumberConfirmed = options.isPhoneNumberConfirmed === true;
		this.#changeClicked = false;
		this.#sendButton = this.#createSendBtn();
		this.#skipButton = SendNumberView.createSkipAddPhoneNumberButton(this);
		this.#titleContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-subtitle">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_SUBTITLE')}</div>
		`;
		this.#errorContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors" id="enter-code-error-container"></div>
		`;
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_NUMBER_TITLE')}</span>`;
	}

	#renderCurrentPhoneNumber(): HTMLElement
	{
		return Tag.render`
			<div>
				<div class="intranet-push-otp-connect-popup__view-phone-number-value">${this.#phoneNumber}</div>
				${this.#renderChangeNumberBtn()}
				${this.#errorContainer}
			</div>
		`;
	}

	#renderInputPhoneNumber(): HTMLElement
	{
		const input = Dom.create('input', {
			attrs: {
				className: 'intranet-push-otp-connect-popup__view-phone-number-input',
				type: 'text',
				name: 'phone_number',
			},
			props: {
				value: PhoneFormatter.formatValue(this.#phoneNumber),
			},
			events: {
				input: (event) => {
					if (Type.isElementNode(event?.target))
					{
						event.target.value = PhoneFormatter.formatValue(event.target.value);
						this.#phoneNumber = event.target.value;
					}
				},
			},
		});

		if (Reflection.getClass(BX.PhoneNumber))
		{
			const phoneInput = new BX.PhoneNumber.Input({
				node: input,
			});

			// eslint-disable-next-line promise/catch-or-return
			phoneInput.waitForInitialization().then(() => {
				const countryCode = Text.encode(phoneInput.getCountryCode());

				if (countryCode)
				{
					input.placeholder = `+${countryCode}`;
				}
			});
		}

		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-phone-number-input-box">
				${this.#titleContainer}
				${input}
				${this.#errorContainer}
			</div>
		`;
	}

	#renderChangeNumberBtn(): HTMLElement
	{
		return Dom.create('a', {
			props: {
				className: 'intranet-push-otp-connect-popup__view-phone-number-link',
			},
			html: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CHANGE_NUMBER_BTN'),
			events: {
				click: () => {
					this.#phoneNumber = '';
					this.#changeClicked = true;
					const container = this.render().querySelector('.intranet-push-otp-connect-popup__view-connect-container');
					Dom.clean(container);
					const inputBox = this.#renderInputPhoneNumber();
					Dom.append(inputBox, container);
					Dom.append(Tag.render`<div class="intranet-push-otp-connect-popup__view-phone-number-phone"></div>`, container);
					inputBox.querySelector('input')?.focus();
				},
			},
		});
	}

	render(): HTMLElement
	{
		return this.#container.remember('view', () => {
			const shouldShowInput = this.#forceChangeMode || !Type.isStringFilled(this.#phoneNumber);

			return Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_NUMBER_DESC')}</div>
					<div class="intranet-push-otp-connect-popup__view-connect-container --space-between --code">
						${shouldShowInput ? this.#renderInputPhoneNumber() : this.#renderCurrentPhoneNumber()}
						<div class="intranet-push-otp-connect-popup__view-phone-number-phone"></div>
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${this.#skipButton.render()}
						${this.#sendButton.render()}
					</div>
				</div>
			`;
		});
	}

	#createSendBtn(): BaseButton
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_NEXT_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			onclick: (button) => {
				if (button.isWaiting() || button.isDisabled())
				{
					return;
				}
				this.#cleanError();
				if (!this.#changeClicked && this.#isPhoneNumberConfirmed && !this.#forceChangeMode)
				{
					this.emit(
						'onNextView',
						{
							viewCode: 'success',
							options: {
								phoneNumber: this.#phoneNumber,
							},
						},
					);

					return;
				}
				this.#sendNumber();
			},
		});
	}

	#sendNumber(): void
	{
		if (this.#sendButton.isWaiting())
		{
			return;
		}
		this.#sendButton.setWaiting(true);
		BX.ajax.runAction('intranet.v2.Otp.changeAuthPhone', {
			method: 'POST',
			data: {
				signedUserId: this.#signedUserId,
				phoneNumber: this.#phoneNumber,
			},
		}).then((response) => {
			this.#sendButton.setWaiting(false);
			if (response.data === true)
			{
				this.#isPhoneNumberConfirmed = false;
				this.#nextView();
			}
		}, (response) => {
			this.#setError(response.errors);
			this.#sendButton.setWaiting(false);
		}).catch((response) => {
			this.#setError(response.errors);
			this.#sendButton.setWaiting(false);
		});
	}

	#nextView(code: ?string = null): void
	{
		this.emit(
			'onNextView',
			{
				viewCode: code,
				options: {
					phoneNumber: this.#phoneNumber,
				},
			},
		);
	}

	#setError(errors: Array): void
	{
		Dom.clean(this.#errorContainer);
		errors.forEach((error) => {
			Dom.append(Tag.render`<span>${error.message}</span>`, this.#errorContainer);
		});
	}

	#cleanError(): void
	{
		Dom.clean(BX('enter-code-error-container'));
	}

	afterShow(option: Object): void
	{
		Analytics.sendEvent(Analytics.SHOW_INPUT_PHONE);
		this.render().querySelector('input')?.focus();
	}

	setForceChangeMode(force: boolean): void
	{
		this.#forceChangeMode = force;
	}

	isForceChangeMode(): boolean
	{
		return this.#forceChangeMode;
	}

	static createSkipAddPhoneNumberButton(view): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_SKIP_ADD_PHONE_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			onclick: () => {
				BX.userOptions.del('intranet', 'require_phone_confirmation');
				if (view.isForceChangeMode())
				{
					view.emit('onParentClose');
				}
				else
				{
					view.emit(
						'onNextView',
						{
							viewCode: 'success',
						},
					);
				}
			},
		});
	}
}
