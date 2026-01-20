import { Loc, Tag, Type, Dom } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { AirButtonStyle, BaseButton, Button } from 'ui.buttons';
import { BaseView } from './base-view';
import { CodeInput } from '../code-input';
import './css/enter-code.css';
import { Analytics } from '../analytics';

export class EnterCodeView extends BaseView
{
	#signedUserId: ?string;
	#cooldown: number = 0;
	#input: CodeInput;
	#button: Button;
	#errorContainer: HTMLElement;
	#timerContainer: HTMLElement;
	#cooldownInterval: number;
	#isPhoneNumberConfirmed: boolean = false;
	#codeSent: boolean = false;
	#container: BaseCache = new MemoryCache();
	#phoneNumber: string = '';
	#backButton: BaseButton;
	#isFirstView: boolean = false;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#phoneNumber = options.phoneNumber || '';
		this.#backButton = this.#createBackBtn();
		this.#input = new CodeInput({
			codeLength: 6,
			name: 'confirm_code',
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
			<div class="intranet-push-otp-connect-popup__view-enter-code-cooldown" id="enter-code-cooldown-timer">
			</div>
		`;
		this.#errorContainer = Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors" id="enter-code-error-container"></div>
		`;
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_TITLE')}</span>`;
	}

	render(): HTMLElement
	{
		return this.#container.remember('view', () => {
			const stepInfo = this.getStepInfo();
			this.#isFirstView = stepInfo.current === 1;

			return Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">
						${
							Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_DESCRIPTION', {
								'#PHONE_NUMBER#': `<strong>${this.#phoneNumber}</strong>`,
							})
						}
					</div>
					<div class="intranet-push-otp-connect-popup__view-enter-code-container --content-center">
							${this.#input.render()}
							${this.#errorContainer}
							${this.#timerContainer}
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${this.#isFirstView ? '' : this.#backButton.render()}
						${this.#button.render()}
					</div>
				</div>
			`;
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

	sendCode(): void
	{
		if (!this.#canSendCode())
		{
			return;
		}

		this.#cleanError();
		this.#button.setWaiting(true);
		this.#codeSent = true;

		BX.ajax.runAction('intranet.v2.Otp.sendConfirmationCode', {
			method: 'POST',
			data: {
				signedUserId: this.#signedUserId,
			},
		}).then((response) => {
			if (response.status === 'success')
			{
				this.#cooldown = Type.isNumber(response.data?.DATE_SEND) ? response.data?.DATE_SEND : 0;
				this.#startCooldownTimer();
			}
			this.#button.setWaiting(false);
		}, (response) => {
			this.#setError(response.errors);
			this.#cooldown = Type.isNumber(response.data?.DATE_SEND) ? response.data?.DATE_SEND : 0;
			this.#startCooldownTimer();
			this.#button.setWaiting(false);
		}).catch((error) => console.error(error));
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

	beforeDismiss(options: Object): void
	{
		clearInterval(this.#cooldownInterval);
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
		BX.ajax.runAction('intranet.v2.Otp.confirmationPhoneNumber', {
			method: 'POST',
			data: {
				signedUserId: this.#signedUserId,
				code: this.#input.getValue(),
			},
		}).then((response) => {
			this.#button.setWaiting(false);
			if (response.status === 'success')
			{
				this.#isPhoneNumberConfirmed = true;
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
			this.#setError(response.errors);
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
		Dom.clean(BX('enter-code-error-container'));
	}

	isPhoneNumberConfirmed(): boolean
	{
		return this.#isPhoneNumberConfirmed;
	}

	#createBackBtn(): BaseButton
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_BUTTON_BACK'),
			noCaps: true,
			size: Button.Size.MD,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			useAirDesign: true,
			disabled: false,
			onclick: () => {
				this.emit('onPreviousView');
			},
		});
	}

	beforeShow(option: Object)
	{
		this.#codeSent = false;
		if (option.phoneNumber)
		{
			this.#phoneNumber = option.phoneNumber;
		}
	}

	afterShow(option: Object)
	{
		Analytics.sendEvent(Analytics.SHOW_INPUT_PHONE_CODE);
		if (!this.#codeSent)
		{
			this.sendCode();
		}
	}

	afterDismiss(option: Object)
	{
		this.#container.delete('view');
		Dom.clean(this.#errorContainer);
		Dom.clean(this.#timerContainer);
		this.#cooldown = 0;
		clearInterval(this.#cooldownInterval);
		this.#input.clear();
	}
}
