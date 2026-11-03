import { Browser, Dom, Loc, Tag, Type } from 'main.core';
import { type BaseCache, MemoryCache } from 'main.core.cache';
import { AirButtonStyle, type BaseButton, Button } from 'ui.buttons';
import { BaseView, MOBILE_POPUP_WIDTH } from './base-view';
import { CodeInput } from '../code-input';
import './css/enter-code.css';
import { Analytics } from '../analytics';
import { SendNumberView } from './send-number-view';
import { createFinishButton, createSwitchChannelButton } from './switch-channel-button';

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
	#skipButton: Button;
	#forceChangeMode: boolean = false;
	#isMobile: boolean;
	#onContactConfirmed: (flowId: ?string) => Promise;
	#isSkippingDeviceConnectProvider: () => boolean;
	#flowIdProvider: () => ?string;
	#isContactConfirmed: boolean = false;
	#canSwitchChannelProvider: () => boolean;
	#switchChannelButton: Button;
	#canFinishProvider: () => boolean;
	#finishButton: Button;

	constructor(options)
	{
		super(options);
		this.#signedUserId = options.signedUserId || null;
		this.#phoneNumber = options.phoneNumber || '';
		this.#isMobile = Browser.isMobile();
		this.#onContactConfirmed = Type.isFunction(options.onContactConfirmed)
			? options.onContactConfirmed
			: () => Promise.resolve();
		this.#isSkippingDeviceConnectProvider = Type.isFunction(options.isSkippingDeviceConnectProvider)
			? options.isSkippingDeviceConnectProvider
			: () => options.hideSkipButton === true;
		this.#flowIdProvider = Type.isFunction(options.flowIdProvider) ? options.flowIdProvider : () => null;
		this.#canSwitchChannelProvider = Type.isFunction(options.canSwitchChannelProvider)
			? options.canSwitchChannelProvider
			: () => false;
		this.#switchChannelButton = createSwitchChannelButton(this, 'email');
		this.#canFinishProvider = Type.isFunction(options.canFinishProvider)
			? options.canFinishProvider
			: () => false;
		this.#finishButton = createFinishButton(this, (errors) => this.#setError(errors), options.onFinish);
		this.#backButton = this.#createBackBtn();
		this.#skipButton = SendNumberView.createSkipAddPhoneNumberButton(this);
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
						${this.#renderSecondaryButton()}
						${this.#isFirstView ? '' : this.#backButton.render()}
						${this.#button.render()}
					</div>
				</div>
			`;
		});
	}

	getPopupWidth(): ?number
	{
		return this.#isMobile ? MOBILE_POPUP_WIDTH : null;
	}

	#renderMobileView(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container --mobile">
				<div><div class="intranet-push-otp-connect-popup__popup-title">${this.#renderTitle()}</div>${this.renderStepIndicators()}</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_DESCRIPTION', {
						'#PHONE_NUMBER#': `<strong>${this.#phoneNumber}</strong>`,
					})}
				</div>
				<div class="intranet-push-otp-connect-popup__view-enter-code-container --content-center --mobile">
					${this.#input.render()}${this.#errorContainer}${this.#timerContainer}
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container --mobile">
					${this.#renderSecondaryButton()}
					${this.#isFirstView ? '' : this.#backButton.render()}
					${this.#button.render()}
				</div>
			</div>
		`;
	}

	#renderSecondaryButton(): string | HTMLElement
	{
		if (this.#isSkippingDeviceConnectProvider())
		{
			if (this.#canFinishProvider())
			{
				return this.#finishButton.render();
			}

			return this.#canSwitchChannelProvider() ? this.#switchChannelButton.render() : '';
		}

		return this.#skipButton.render();
	}

	#createConfirmCodeBtn(): Button
	{
		const button = new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			onclick: () => {
				if (!this.#codeSent)
				{
					return;
				}
				this.#confirmCode();
			},
		});
		button.setDisabled(true);

		return button;
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
				flowId: this.#flowIdProvider(),
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

	async #confirmCode(): void
	{
		if (this.#button.isWaiting())
		{
			return;
		}
		this.#cleanError();
		this.#button.setWaiting(true);

		try
		{
			const flowId = this.#flowIdProvider();
			let response = { status: 'success' };
			if (!this.#isContactConfirmed)
			{
				response = await BX.ajax.runAction('intranet.v2.Otp.confirmationPhoneNumber', {
					method: 'POST',
					data: {
						signedUserId: this.#signedUserId,
						code: this.#input.getValue(),
						flowId,
					},
				});
				if (response.status !== 'success')
				{
					return;
				}

				this.#isContactConfirmed = true;
			}

			response = await this.#onContactConfirmed(flowId) ?? response;
			if (response?.status === 'success')
			{
				this.#isPhoneNumberConfirmed = true;
				this.emit(
					'onNextView',
					{
						viewCode: response.skipDeviceConnectCompleted === true
							? (response.nextViewCode ?? 'success')
							: null,
						options: {
							closeIfLast: true,
						},
					},
				);
			}
		}
		catch (response)
		{
			this.#setError(response?.errors ?? []);
		}
		finally
		{
			this.#button.setWaiting(false);
		}
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
			style: AirButtonStyle.OUTLINE,
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
		this.#isContactConfirmed = false;
		clearInterval(this.#cooldownInterval);
		this.#input.clear();
	}

	setForceChangeMode(force: boolean): void
	{
		this.#forceChangeMode = force;
	}

	isForceChangeMode(): boolean
	{
		return this.#forceChangeMode;
	}
}
