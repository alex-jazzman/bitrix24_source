import { Loc, Tag, Type, Dom } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { AirButtonStyle, Button } from 'ui.buttons';
import { BaseView } from './base-view';
import { CodeInput } from '../code-input';
import './css/enter-code.css';
import { Analytics } from '../analytics';

export class EmailEnterCodeView extends BaseView
{
	#signedUserId: ?string;
	#cooldown: number = 0;
	#input: CodeInput;
	#button: Button;
	#errorContainer: HTMLElement;
	#timerContainer: HTMLElement;
	#cooldownInterval: number;
	#codeSent: boolean = false;
	#container = new MemoryCache();
	#email: string = '';
	#signedData: string = '';
	#backButton: Button;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#email = options.email || '';
		this.#signedData = options.signedData || '';
		this.#backButton = this.#createBackBtn();
		this.#input = new CodeInput({
			codeLength: 6,
			name: 'confirm_email_code',
			className: 'confirm-code-input --primary',
			containerClassName: 'enter-confirm-code-container',
			complete: () => {
				this.#button.setDisabled(false);
				this.#confirmCode();
			},
			input: () => {
				this.#cleanError();
			},
		});
		this.#button = this.#createConfirmCodeBtn();
		this.#timerContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-cooldown"></div>
		`;
		this.#errorContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors"></div>
		`;
	}

	render(): HTMLElement
	{
		return this.#container.remember('view', () => {
			return Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">
						${this.#getDescription()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-enter-code-container --content-center">
						${this.#input.render()}
						${this.#errorContainer}
						${this.#timerContainer}
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${this.#backButton.render()}
						${this.#button.render()}
					</div>
				</div>
			`;
		});
	}

	beforeShow(option: Object): void
	{
		this.#codeSent = Type.isStringFilled(option.signedData);
		if (Type.isStringFilled(option.email))
		{
			this.#email = option.email;
		}

		if (Type.isString(option.signedData))
		{
			this.#signedData = option.signedData;
		}
		this.#cooldown = Type.isNumber(option.timeLeft) ? option.timeLeft : 0;
	}

	afterShow(): void
	{
		Analytics.sendEvent(Analytics.SHOW_INPUT_EMAIL_CODE);
		if (this.#codeSent)
		{
			this.#startCooldownTimer();
		}
		else
		{
			this.sendCode();
		}
	}

	beforeDismiss(): void
	{
		clearInterval(this.#cooldownInterval);
	}

	afterDismiss(): void
	{
		this.#container.delete('view');
		Dom.clean(this.#errorContainer);
		Dom.clean(this.#timerContainer);
		this.#cooldown = 0;
		clearInterval(this.#cooldownInterval);
		this.#input.clear();
	}

	sendCode(): void
	{
		if (!this.#canSendCode())
		{
			return;
		}

		this.#cleanError();
		this.#button.setWaiting(true);
		this.#codeSent = true;

		BX.ajax.runAction('intranet.v2.Otp.sendEmailConfirmation', {
			method: 'POST',
			data: {
				email: this.#email,
			},
		}).then((response) => {
			if (response.status === 'success')
			{
				this.#signedData = response.data.signedData;
				this.#cooldown = Type.isNumber(response.data?.timeLeft) ? response.data.timeLeft : 0;
				this.#startCooldownTimer();
			}
			this.#button.setWaiting(false);
		}, (response) => {
			this.#setError(response.errors);
			this.#cooldown = Type.isNumber(response.data?.timeLeft) ? response.data.timeLeft : 0;
			this.#startCooldownTimer();
			this.#button.setWaiting(false);
		}).catch((response) => {
			this.#setError(response?.errors ?? []);
			this.#button.setWaiting(false);
		});
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`
			<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_ENTER_CODE_TITLE')}</span>
		`;
	}

	#getDescription(): string
	{
		const emailMarkup = `<strong>${this.#email}</strong>`;

		return Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_ENTER_CODE_DESCRIPTION', {
			'#EMAIL#': emailMarkup,
		});
	}

	#createConfirmCodeBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: true,
			onclick: () => {
				if (this.#codeSent)
				{
					return;
				}

				this.#confirmCode();
			},
		});
	}

	#canSendCode(): boolean
	{
		return this.#cooldown <= 0 && !this.#codeSent;
	}

	#startCooldownTimer(): void
	{
		clearInterval(this.#cooldownInterval);
		if (!this.#cooldown || !this.#timerContainer)
		{
			return;
		}

		const tickTimer = () => {
			if (this.#cooldown <= 0)
			{
				Dom.clean(this.#timerContainer);
				Dom.append(this.#renderResendBtn(), this.#timerContainer);

				return;
			}

			Dom.clean(this.#timerContainer);
			Dom.append(this.#renderTimer(), this.#timerContainer);
			this.#cooldown--;
		};

		tickTimer();
		this.#cooldownInterval = setInterval(() => {
			tickTimer();
			if (this.#cooldown < 0)
			{
				clearInterval(this.#cooldownInterval);
			}
		}, 1000);
	}

	#renderResendBtn(): HTMLElement
	{
		return Dom.create('a', {
			attrs: { href: '#' },
			props: {
				className: 'intranet-push-otp-connect-popup__view-enter-code-new',
			},
			html: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RESEND_CODE'),
			events: {
				click: () => {
					this.#codeSent = false;
					this.#input.clear();
					this.sendCode();
				},
			},
		});
	}

	#renderTimer(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_COOLDOWN', {
			'#SEC#': this.#cooldown,
		})}</span>`;
	}

	#confirmCode(): void
	{
		if (this.#button.isWaiting())
		{
			return;
		}

		this.#cleanError();
		this.#button.setWaiting(true);
		BX.ajax.runAction('intranet.v2.Otp.confirmationEmail', {
			method: 'POST',
			data: {
				code: this.#input.getValue(),
				signedData: this.#signedData,
			},
		}).then((response) => {
			this.#button.setWaiting(false);
			if (response.status === 'success')
			{
				this.emit(
					'onNextView',
					{
						viewCode: null,
						options: {
							closeIfLast: true,
						},
					},
				);
			}
		}, (response) => {
			this.#setError(response.errors);
			this.#button.setWaiting(false);
		}).catch((response) => {
			this.#setError(response?.errors ?? []);
			this.#button.setWaiting(false);
		});
	}

	#setError(errors: Array): void
	{
		this.#input.setInputClass('confirm-code-input --danger');
		Dom.clean(this.#errorContainer);
		errors.forEach((error) => {
			Dom.append(Tag.render`<span>${error.message}</span>`, this.#errorContainer);
		});
	}

	#cleanError(): void
	{
		this.#input.setInputClass('confirm-code-input --primary');
		Dom.clean(this.#errorContainer);
	}

	#createBackBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_BUTTON_BACK'),
			noCaps: true,
			size: Button.Size.MD,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			disabled: false,
			onclick: () => {
				this.emit('onPreviousView');
			},
		});
	}
}
