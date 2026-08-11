import { Dom, Loc, Tag, Text, Type, Validation } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { AirButtonStyle, Button } from 'ui.buttons';

import { Analytics } from '../analytics';
import { BaseView } from './base-view';
import './css/email-view.css';

export class EmailView extends BaseView
{
	#signedUserId: ?string;
	#timeLeft: number = 0;
	#email: string;
	#signedData: string;
	#changeClicked: boolean;
	#forceChangeMode: boolean = false;
	#showInput: boolean;
	#container = new MemoryCache();
	#skipButton: Button;
	#confirmButton: Button;
	#errorContainer: HTMLElement;
	#titleContainer: HTMLElement;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#email = Type.isStringFilled(options.email) ? options.email : '';
		this.#signedData = '';
		this.#changeClicked = false;
		this.#showInput = !Type.isStringFilled(this.#email);
		this.#skipButton = this.#createSkipButton();
		this.#confirmButton = this.#createConfirmButton();
		this.#titleContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-input-title">
				${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_INPUT_SUBTITLE')}
			</div>
		`;
		this.#errorContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-errors"></div>
		`;
	}

	render(): HTMLElement
	{
		return this.#container.remember('view', () => {
			const shouldShowInput = this.#forceChangeMode || this.#showInput;

			const skipButton = this.isForceChangeMode() ? '' : this.#skipButton.render();

			return Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">
						${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_DESC')}
					</div>
					<div class="intranet-push-otp-connect-popup__view-email-container">
						${shouldShowInput ? this.#renderInputEmail() : this.#renderCurrentEmail()}
						<div class="intranet-push-otp-connect-popup__view-email-graphic">
							<div class="intranet-push-otp-connect-popup__view-email-browser"></div>
							<div class="intranet-push-otp-connect-popup__view-email-browser-dots">
								<div class="intranet-push-otp-connect-popup__view-email-browser-dot --pink"></div>
								<div class="intranet-push-otp-connect-popup__view-email-browser-dot --yellow"></div>
								<div class="intranet-push-otp-connect-popup__view-email-browser-dot --green"></div>
							</div>
							<div class="intranet-push-otp-connect-popup__view-email-browser-line"></div>
							<div class="intranet-push-otp-connect-popup__view-email-envelope"></div>
							<div class="intranet-push-otp-connect-popup__view-email-envelope-flap"></div>
							<div class="intranet-push-otp-connect-popup__view-email-paper"></div>
							<div class="intranet-push-otp-connect-popup__view-email-at">@</div>
							<div class="intranet-push-otp-connect-popup__view-email-address-chip">mail@example</div>
							<div class="intranet-push-otp-connect-popup__view-email-pagination">
								<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
								<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
								<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
								<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
							</div>
						</div>
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${skipButton}
						${this.#confirmButton.render()}
					</div>
				</div>
			`;
		});
	}

	beforeShow(option: Object): void
	{
		if (Type.isStringFilled(option.email))
		{
			this.#email = option.email;
			if (!this.#changeClicked)
			{
				this.#showInput = false;
			}
		}
	}

	afterShow(): void
	{
		Analytics.sendEvent(Analytics.SHOW_INPUT_EMAIL);
		this.render().querySelector('input')?.focus();
	}

	afterDismiss(): void
	{
		this.#container.delete('view');
		Dom.clean(this.#errorContainer);
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`
			<span>
				${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_TITLE')}
			</span>
		`;
	}

	#renderCurrentEmail(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-info">
				<div class="intranet-push-otp-connect-popup__view-email-value">${Text.encode(this.#email)}</div>
				${this.#renderChangeEmailLink()}
				${this.#errorContainer}
			</div>
		`;
	}

	#renderInputEmail(): HTMLElement
	{
		const input = Dom.create('input', {
			attrs: {
				className: 'intranet-push-otp-connect-popup__view-email-input',
				type: 'email',
				name: 'email',
			},
			props: {
				value: this.#email,
			},
			events: {
				input: (event) => {
					if (Type.isElementNode(event?.target))
					{
						this.#email = event.target.value.trim();
						this.#cleanError();
					}
				},
			},
		});

		input.placeholder = 'mail@example.com';

		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-info">
				<div class="intranet-push-otp-connect-popup__view-email-input-box">
					${this.#titleContainer}
					${input}
					${this.#errorContainer}
				</div>
			</div>
		`;
	}

	#renderChangeEmailLink(): HTMLElement
	{
		return Dom.create('a', {
			props: {
				className: 'intranet-push-otp-connect-popup__view-email-change',
			},
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_CHANGE_BTN'),
			events: {
				click: () => {
					this.#email = '';
					this.#changeClicked = true;
					this.#showInput = true;
					const container = this.render().querySelector('.intranet-push-otp-connect-popup__view-email-container');
					if (!container)
					{
						return;
					}

					Dom.clean(container);
					const inputBox = this.#renderInputEmail();
					Dom.append(inputBox, container);
					Dom.append(this.#renderGraphic(), container);
					inputBox.querySelector('input')?.focus();
				},
			},
		});
	}

	#renderGraphic(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-graphic">
				<div class="intranet-push-otp-connect-popup__view-email-browser"></div>
				<div class="intranet-push-otp-connect-popup__view-email-browser-dots">
					<div class="intranet-push-otp-connect-popup__view-email-browser-dot --pink"></div>
					<div class="intranet-push-otp-connect-popup__view-email-browser-dot --yellow"></div>
					<div class="intranet-push-otp-connect-popup__view-email-browser-dot --green"></div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-email-browser-line"></div>
				<div class="intranet-push-otp-connect-popup__view-email-envelope"></div>
				<div class="intranet-push-otp-connect-popup__view-email-envelope-flap"></div>
				<div class="intranet-push-otp-connect-popup__view-email-paper"></div>
				<div class="intranet-push-otp-connect-popup__view-email-at">@</div>
				<div class="intranet-push-otp-connect-popup__view-email-address-chip">mail@example</div>
				<div class="intranet-push-otp-connect-popup__view-email-pagination">
					<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
					<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
					<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
					<div class="intranet-push-otp-connect-popup__view-email-pagination-dot"></div>
				</div>
			</div>
		`;
	}

	#createConfirmButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			onclick: () => {
				if (!this.#validate())
				{
					return;
				}

				if (!this.#changeClicked && !this.#showInput && Type.isStringFilled(this.#email) && !this.#forceChangeMode)
				{
					this.#nextView();

					return;
				}

				this.#sendEmail();
			},
		});
	}

	#sendEmail(): void
	{
		if (this.#confirmButton.isWaiting())
		{
			return;
		}

		this.#confirmButton.setWaiting(true);
		BX.ajax.runAction('intranet.v2.Otp.changeAuthEmail', {
			method: 'POST',
			data: {
				email: this.#email,
			},
		}).then((response) => {
			this.#confirmButton.setWaiting(false);
			if (response.status === 'success')
			{
				this.#showInput = false;
				this.#changeClicked = false;
				this.#signedData = response.data.signedData;
				this.#timeLeft = response.data.timeLeft;
				this.#nextView();
			}
		}, (response) => {
			this.#setErrors(response.errors);
			this.#confirmButton.setWaiting(false);
		}).catch((response) => {
			this.#setErrors(response.errors);
			this.#confirmButton.setWaiting(false);
		});
	}

	#nextView(): void
	{
		this.emit(
			'onNextView',
			{
				options: {
					email: this.#email,
					signedData: this.#signedData,
					timeLeft: this.#timeLeft,
				},
			},
		);
	}

	#validate(): boolean
	{
		this.#cleanError();

		if (!this.#showInput && Type.isStringFilled(this.#email) && !this.#forceChangeMode)
		{
			return true;
		}

		if (!Type.isStringFilled(this.#email))
		{
			this.#setError(
				Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_EMPTY_ERROR'),
			);

			return false;
		}

		if (!Validation.isEmail(this.#email) || !/^[^@]+@[^@]+\.[^@]+$/.test(this.#email))
		{
			this.#setError(
				Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_INVALID_ERROR'),
			);

			return false;
		}

		return true;
	}

	#setError(errorMessage: string): void
	{
		Dom.clean(this.#errorContainer);
		Dom.append(Tag.render`<span>${errorMessage}</span>`, this.#errorContainer);
	}

	#setErrors(errors: Array): void
	{
		Dom.clean(this.#errorContainer);
		errors.forEach((error) => {
			Dom.append(Tag.render`<span>${error.message}</span>`, this.#errorContainer);
		});
	}

	#cleanError(): void
	{
		Dom.clean(this.#errorContainer);
	}

	setForceChangeMode(force: boolean): void
	{
		this.#forceChangeMode = force;
	}

	isForceChangeMode(): boolean
	{
		return this.#forceChangeMode;
	}

	#createSkipButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_SKIP_ADD_PHONE_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			onclick: () => {
				this.emit(
					'onNextView',
					{
						viewCode: 'number',
					},
				);
			},
		});
	}
}
