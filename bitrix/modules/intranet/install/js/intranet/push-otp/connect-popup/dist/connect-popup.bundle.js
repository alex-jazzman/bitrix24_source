/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_cache, main_core_events, main_popup, ui_buttons, ui_analytics, main_loader, ui_designTokens, intranet_designTokens, main_qrcode, pull_client, ui_iconSet_outline, ui_type, main_phonenumber, main_sidepanel, intranet_pushOtp_connectPopup, ui_confetti) {
	'use strict';

	class StepperController {
		#totalSteps = 4;
		#currentStep = 1;
		#enabled = true;
		constructor(options = {}) {
			if (main_core.Type.isNumber(options.totalSteps)) {
				this.#totalSteps = Math.max(1, options.totalSteps);
			}
			if (main_core.Type.isNumber(options.currentStep)) {
				this.#currentStep = this.#getBoundedStep(options.currentStep);
			}
			if (options.enabled === false) {
				this.#enabled = false;
			}
		}
		setEnabled(enabled) {
			this.#enabled = enabled !== false;
		}
		setStepInfo(currentStep, totalSteps) {
			if (main_core.Type.isNumber(totalSteps)) {
				this.#totalSteps = Math.max(1, totalSteps);
			}
			if (main_core.Type.isNumber(currentStep)) {
				this.#currentStep = this.#getBoundedStep(currentStep);
			}
		}
		getStepInfo() {
			return {
				current: this.#currentStep,
				total: this.#totalSteps
			};
		}
		render() {
			if (!this.#enabled) {
				return main_core.Tag.render`<div></div>`;
			}
			const indicators = [];
			for (let i = 1; i <= this.#totalSteps; i++) {
				const isActive = i <= this.#currentStep ? '--active' : '';
				indicators.push(main_core.Tag.render`<div class="intranet-push-otp-connect-popup__popup-step-item ${isActive}"></div>`);
			}
			return main_core.Tag.render`<div class="intranet-push-otp-connect-popup__popup-step">${indicators}</div>`;
		}
		#getBoundedStep(step) {
			const normalizedStep = Math.max(1, step);
			return Math.min(normalizedStep, this.#totalSteps);
		}
	}

	class BaseView extends main_core_events.EventEmitter {
		#id;
		#excludeFromSteps = false;
		#stepper;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Intranet.PushOtp.ConnectPopup.View');
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : '';
			this.#excludeFromSteps = options.excludeFromSteps === true;
			this.#stepper = new StepperController({
				enabled: !this.#excludeFromSteps
			});
		}
		getId() {
			return this.#id;
		}
		isExcludedFromSteps() {
			return this.#excludeFromSteps;
		}
		setStepInfo(currentStep, totalSteps) {
			this.#stepper.setStepInfo(currentStep, totalSteps);
		}
		getStepInfo() {
			return this.#stepper.getStepInfo();
		}
		renderStepIndicators() {
			return this.#stepper.render();
		}
		render() {
			return main_core.Tag.render``;
		}
		beforeDismiss(option) {}
		afterShow(option) {}
		afterDismiss(option) {}
		beforeShow(option) {}
	}

	class ConnectPopup extends main_core_events.EventEmitter {
		#cache = new main_core_cache.MemoryCache();
		#view;
		#viewCollection = [];
		constructor(options) {
			super();
			(main_core.Type.isArray(options.viewList) ? options.viewList : []).forEach(view => {
				if (view instanceof BaseView) {
					this.#viewCollection.push(view);
				}
			});
			this.#view = main_core.Type.isStringFilled(options.viewCode) ? this.getViewByCode(options.viewCode) : this.#getFirstView();
			this.#updateStepInfo();
			this.setEventNamespace('BX.Intranet.PushOtp.ConnectPopup');
			this.#viewCollection.forEach(view => {
				view.subscribe('onNextView', event => {
					const viewCode = event.getData()?.viewCode;
					const fallbackViewCode = event.getData()?.fallbackViewCode;
					const options = event.getData()?.options;
					const targetView = main_core.Type.isStringFilled(viewCode) ? this.getViewByCode(viewCode) : null;
					const fallbackView = main_core.Type.isStringFilled(fallbackViewCode) ? this.getViewByCode(fallbackViewCode) : null;
					if (targetView) {
						this.changeView(targetView, options);
					} else if (fallbackView) {
						this.changeView(fallbackView, options);
					} else {
						this.nextView(options);
					}
				});
				view.subscribe('onPreviousView', event => {
					const viewCode = event.getData()?.viewCode;
					const options = event.getData()?.options;
					main_core.Type.isStringFilled(viewCode, this.getViewByCode(viewCode)) ? this.changeView(this.getViewByCode(viewCode), options) : this.previousView(options);
				});
				view.subscribe('onParentClose', () => {
					this.close();
				});
			});
		}
		#updateStepInfo() {
			const viewsWithSteps = this.#viewCollection.filter(view => !view.isExcludedFromSteps());
			const totalSteps = viewsWithSteps.length;
			let stepIndex = 0;
			this.#viewCollection.forEach(view => {
				if (!view.isExcludedFromSteps()) {
					stepIndex++;
					view.setStepInfo(stepIndex, totalSteps);
				}
			});
		}
		show() {
			this.#getPopup().show();
		}
		close() {
			this.#getPopup().close();
		}
		getView() {
			return this.#view;
		}
		getViewByCode(viewCode) {
			for (const view of this.#viewCollection) {
				if (view.getId() === viewCode) {
					return view;
				}
			}
			return null;
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				return this.#createPopup();
			});
		}
		#getNextView() {
			let result = null;
			this.#viewCollection.forEach((view, index) => {
				if (view.getId() === this.#view.getId()) {
					const nextView = this.#viewCollection[index + 1];
					if (nextView) {
						result = nextView;
					}
				}
			});
			return result;
		}
		#getPreviousView() {
			let result = null;
			this.#viewCollection.forEach((view, index) => {
				if (view.getId() === this.#view.getId()) {
					const previousView = this.#viewCollection[index - 1];
					if (previousView) {
						result = previousView;
					}
				}
			});
			return result;
		}
		#getFirstView() {
			return this.#viewCollection[0];
		}
		changeView(view, options = {}) {
			if (!(view instanceof BaseView)) {
				return;
			}
			const prevView = this.#view;
			this.#view.beforeDismiss(options);
			this.#view = view;
			this.#view.beforeShow(options);
			this.reload();
			this.#view.afterShow(options);
			prevView.afterDismiss(options);
		}
		nextView(options = {}) {
			const view = this.#getNextView();
			if (view) {
				this.changeView(view, options);
			} else if (options.closeIfLast) {
				this.close();
			}
		}
		previousView(options = {}) {
			const view = this.#getPreviousView();
			if (view) {
				this.changeView(view, options);
			}
		}
		reload() {
			this.#getPopup().setContent(this.#renderContent());
		}
		#createPopup() {
			return new main_popup.Popup({
				content: this.#renderContent(),
				width: 700,
				closeByEsc: true,
				contentColor: 'white',
				autoHide: true,
				closeIcon: true,
				fixed: true,
				overlay: true,
				disableScroll: true,
				events: {
					onPopupShow: () => {
						this.emit('onShow', {
							context: this,
							parent: this.#getPopup()
						});
						this.#view.afterShow();
					},
					onPopupClose: () => {
						this.#view.beforeDismiss();
						this.emit('onClose', {
							context: this,
							parent: this.#getPopup()
						});
					}
				}
			});
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__popup-content">${this.#view.render()}</div>
		`;
		}
	}

	class CodeInput {
		#className;
		#containerClassName;
		#name;
		#mask;
		#codeLength;
		#autoFocus;
		#allowPaste;
		#container;
		#complete;
		#input;
		constructor(options = {}) {
			this.#codeLength = main_core.Type.isNumber(options.codeLength) ? options.codeLength : 6;
			this.#name = main_core.Type.isString(options.name) ? options.name : 'confirm_code';
			this.#mask = options.mask instanceof RegExp ? options.mask : /\D/g;
			this.#className = main_core.Type.isString(options.className) ? options.className : '';
			this.#containerClassName = main_core.Type.isString(options.containerClassName) ? options.containerClassName : '';
			this.#autoFocus = main_core.Type.isBoolean(options.autoFocus) ? options.autoFocus : true;
			this.#allowPaste = main_core.Type.isBoolean(options.allowPaste) ? options.allowPaste : true;
			this.#complete = main_core.Type.isFunction(options.complete) ? options.complete : () => {};
			this.#input = main_core.Type.isFunction(options.input) ? options.input : () => {};
		}
		#createInput() {
			return main_core.Dom.create({
				tag: 'input',
				attrs: {
					className: this.#className,
					name: `${this.#name}[]`,
					type: 'text',
					autocomplete: 'one-time-code',
					maxlength: '1'
				},
				events: {
					input: this.#inputHandler.bind(this),
					keydown: this.#keydownHandler.bind(this),
					focus: this.#focusHandler.bind(this)
				}
			});
		}
		#inputHandler(event) {
			const target = event.target;
			this.#input(target);
			target.value = target.value.replace(this.#mask, '').slice(0, 1);
			if (target.value.length > 0) {
				this.#moveToNext(target);
			}
		}
		#keydownHandler(event) {
			const input = event.target;
			this.#input(input);
			if (event.key === 'Backspace' && input.value === '' || event.key === 'ArrowLeft') {
				const prevInput = input.previousElementSibling;
				if (prevInput && prevInput.tagName === 'INPUT') {
					prevInput.focus();
					if (event.key === 'Backspace') {
						prevInput.value = '';
					}
				}
				event.preventDefault();
			} else if (event.key === 'ArrowRight') {
				this.#moveToNext(input);
				event.preventDefault();
			}
		}
		#focusHandler(event) {
			event.target.select();
		}
		#pasteHandler(event) {
			if (!this.#allowPaste) {
				return;
			}
			const paste = (event.clipboardData || window.clipboardData).getData('text');
			const digits = [...paste.replace(this.#mask, '')];
			const inputs = this.#container.querySelectorAll('input');
			digits.forEach((digit, idx) => {
				if (inputs[idx]) {
					inputs[idx].value = digit;
				}
			});
			if (digits.length > 0) {
				const lastFilledIndex = Math.min(digits.length - 1, inputs.length - 1);
				const nextInput = inputs[lastFilledIndex + 1];
				if (nextInput) {
					nextInput.focus();
				} else {
					inputs[lastFilledIndex].blur();
					this.#checkComplete();
				}
			}
			event.preventDefault();
		}
		#moveToNext(currentInput) {
			const nextInput = currentInput.nextElementSibling;
			if (nextInput && nextInput.tagName === 'INPUT') {
				nextInput.focus();
			} else {
				currentInput.blur();
				this.#checkComplete();
			}
		}
		#moveToPrevious(currentInput) {
			const prevInput = currentInput.previousElementSibling;
			if (prevInput && prevInput.tagName === 'INPUT') {
				prevInput.focus();
			}
		}
		#checkComplete() {
			if (this.getValue().length === this.#codeLength) {
				this.#complete();
			}
		}
		getValue() {
			const inputs = this.#container.querySelectorAll('input');
			return [...inputs].map(input => input.value).join('');
		}
		setInputClass(className) {
			const inputs = this.#container?.querySelectorAll('input') ?? [];
			return [...inputs].forEach(input => {
				input.className = className;
			});
		}
		setValue(value) {
			const inputs = this.#container.querySelectorAll('input');
			const digits = [...value.replace(this.#mask, '')];
			inputs.forEach((input, idx) => {
				// eslint-disable-next-line no-param-reassign
				input.value = digits[idx] || '';
			});
		}
		clear() {
			const inputs = this.#container.querySelectorAll('input');
			inputs.forEach(input => {
				// eslint-disable-next-line no-param-reassign
				input.value = '';
			});
			if (this.#autoFocus && inputs[0]) {
				inputs[0].focus();
			}
		}
		focus() {
			const firstEmpty = this.#container.querySelector('input:not([value]), input[value=""]');
			const target = firstEmpty || this.#container.querySelector('input');
			if (target) {
				target.focus();
			}
		}
		render() {
			this.#container = main_core.Dom.create('div', {
				attrs: {
					className: this.#containerClassName
				}
			});
			for (let i = 0; i < this.#codeLength; i++) {
				main_core.Dom.append(this.#createInput(), this.#container);
			}
			if (this.#allowPaste) {
				const firstInput = this.#container.querySelector('input');
				if (firstInput) {
					main_core.Event.bind(firstInput, 'paste', this.#pasteHandler.bind(this));
				}
			}
			if (this.#autoFocus) {
				setTimeout(() => this.focus(), 0);
			}
			return this.#container;
		}
	}

	class Analytics {
		static ADD_PHONE_SUCCESS = 'add_phone_success';
		static SHOW_INPUT_EMAIL = 'show_input_email';
		static SHOW_INPUT_EMAIL_CODE = 'show_input_email_code';
		static SHOW_INPUT_PHONE = 'show_input_phone';
		static SHOW_INPUT_PHONE_CODE = 'show_input_phone_code';
		static SHOW_INSTALL_APP = 'show_install_app';
		static SHOW_INSTALL_APP_SUCCESS = 'show_install_app_success';
		static SHOW_TYPE_SAVE_CODE = 'show_type_save_code';
		static SHOW_RECONNECT_DEVICE = 'show_reconnect_device';
		static RECONNECT_SHOW_QR = 'reconnect_show_qr';
		static RECONNECT_CLICK = 'reconnect_qr_click';
		static RECONNECT_DEVICE_SUCCESS = 'reconnect_device_success';
		static sendEvent(eventName) {
			ui_analytics.sendData({
				tool: 'user_settings',
				category: 'security',
				event: eventName
			});
		}
		static sendEventWithCElement(eventName, cElement) {
			ui_analytics.sendData({
				tool: 'user_settings',
				category: 'security',
				event: eventName,
				cElement
			});
		}
		static sendEventWithCSection(eventName, cSection) {
			ui_analytics.sendData({
				tool: 'user_settings',
				category: 'security',
				event: eventName,
				cSection
			});
		}
	}

	class EmailEnterCodeView extends BaseView {
		#signedUserId;
		#cooldown = 0;
		#input;
		#button;
		#errorContainer;
		#timerContainer;
		#cooldownInterval;
		#codeSent = false;
		#container = new main_core_cache.MemoryCache();
		#email = '';
		#signedData = '';
		#backButton;
		constructor(options) {
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
				}
			});
			this.#button = this.#createConfirmCodeBtn();
			this.#timerContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-cooldown"></div>
		`;
			this.#errorContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors"></div>
		`;
		}
		render() {
			return this.#container.remember('view', () => {
				return main_core.Tag.render`
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
		beforeShow(option) {
			this.#codeSent = main_core.Type.isStringFilled(option.signedData);
			if (main_core.Type.isStringFilled(option.email)) {
				this.#email = option.email;
			}
			if (main_core.Type.isString(option.signedData)) {
				this.#signedData = option.signedData;
			}
			this.#cooldown = main_core.Type.isNumber(option.timeLeft) ? option.timeLeft : 0;
		}
		afterShow() {
			Analytics.sendEvent(Analytics.SHOW_INPUT_EMAIL_CODE);
			if (this.#codeSent) {
				this.#startCooldownTimer();
			} else {
				this.sendCode();
			}
		}
		beforeDismiss() {
			clearInterval(this.#cooldownInterval);
		}
		afterDismiss() {
			this.#container.delete('view');
			main_core.Dom.clean(this.#errorContainer);
			main_core.Dom.clean(this.#timerContainer);
			this.#cooldown = 0;
			clearInterval(this.#cooldownInterval);
			this.#input.clear();
		}
		sendCode() {
			if (!this.#canSendCode()) {
				return;
			}
			this.#cleanError();
			this.#button.setWaiting(true);
			this.#codeSent = true;
			BX.ajax.runAction('intranet.v2.Otp.sendEmailConfirmation', {
				method: 'POST',
				data: {
					email: this.#email
				}
			}).then(response => {
				if (response.status === 'success') {
					this.#signedData = response.data.signedData;
					this.#cooldown = main_core.Type.isNumber(response.data?.timeLeft) ? response.data.timeLeft : 0;
					this.#startCooldownTimer();
				}
				this.#button.setWaiting(false);
			}, response => {
				this.#setError(response.errors);
				this.#cooldown = main_core.Type.isNumber(response.data?.timeLeft) ? response.data.timeLeft : 0;
				this.#startCooldownTimer();
				this.#button.setWaiting(false);
			}).catch(response => {
				this.#setError(response?.errors ?? []);
				this.#button.setWaiting(false);
			});
		}
		#renderTitle() {
			return main_core.Tag.render`
			<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_ENTER_CODE_TITLE')}</span>
		`;
		}
		#getDescription() {
			const emailMarkup = `<strong>${this.#email}</strong>`;
			return main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_ENTER_CODE_DESCRIPTION', {
				'#EMAIL#': emailMarkup
			});
		}
		#createConfirmCodeBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: true,
				onclick: () => {
					if (this.#codeSent) {
						return;
					}
					this.#confirmCode();
				}
			});
		}
		#canSendCode() {
			return this.#cooldown <= 0 && !this.#codeSent;
		}
		#startCooldownTimer() {
			clearInterval(this.#cooldownInterval);
			if (!this.#cooldown || !this.#timerContainer) {
				return;
			}
			const tickTimer = () => {
				if (this.#cooldown <= 0) {
					main_core.Dom.clean(this.#timerContainer);
					main_core.Dom.append(this.#renderResendBtn(), this.#timerContainer);
					return;
				}
				main_core.Dom.clean(this.#timerContainer);
				main_core.Dom.append(this.#renderTimer(), this.#timerContainer);
				this.#cooldown--;
			};
			tickTimer();
			this.#cooldownInterval = setInterval(() => {
				tickTimer();
				if (this.#cooldown < 0) {
					clearInterval(this.#cooldownInterval);
				}
			}, 1000);
		}
		#renderResendBtn() {
			return main_core.Dom.create('a', {
				attrs: {
					href: '#'
				},
				props: {
					className: 'intranet-push-otp-connect-popup__view-enter-code-new'
				},
				html: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RESEND_CODE'),
				events: {
					click: () => {
						this.#codeSent = false;
						this.#input.clear();
						this.sendCode();
					}
				}
			});
		}
		#renderTimer() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_COOLDOWN', {
			'#SEC#': this.#cooldown
		})}</span>`;
		}
		#confirmCode() {
			if (this.#button.isWaiting()) {
				return;
			}
			this.#cleanError();
			this.#button.setWaiting(true);
			BX.ajax.runAction('intranet.v2.Otp.confirmationEmail', {
				method: 'POST',
				data: {
					code: this.#input.getValue(),
					signedData: this.#signedData
				}
			}).then(response => {
				this.#button.setWaiting(false);
				if (response.status === 'success') {
					this.emit('onNextView', {
						viewCode: null,
						options: {
							closeIfLast: true
						}
					});
				}
			}, response => {
				this.#setError(response.errors);
				this.#button.setWaiting(false);
			}).catch(response => {
				this.#setError(response?.errors ?? []);
				this.#button.setWaiting(false);
			});
		}
		#setError(errors) {
			this.#input.setInputClass('confirm-code-input --danger');
			main_core.Dom.clean(this.#errorContainer);
			errors.forEach(error => {
				main_core.Dom.append(main_core.Tag.render`<span>${error.message}</span>`, this.#errorContainer);
			});
		}
		#cleanError() {
			this.#input.setInputClass('confirm-code-input --primary');
			main_core.Dom.clean(this.#errorContainer);
		}
		#createBackBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_BUTTON_BACK'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				disabled: false,
				onclick: () => {
					this.emit('onPreviousView');
				}
			});
		}
	}

	class EmailView extends BaseView {
		#signedUserId;
		#timeLeft = 0;
		#email;
		#signedData;
		#changeClicked;
		#forceChangeMode = false;
		#showInput;
		#container = new main_core_cache.MemoryCache();
		#skipButton;
		#confirmButton;
		#errorContainer;
		#titleContainer;
		constructor(options) {
			super(options);
			this.#signedUserId = options.signedUserId || null;
			this.#email = main_core.Type.isStringFilled(options.email) ? options.email : '';
			this.#signedData = '';
			this.#changeClicked = false;
			this.#showInput = !main_core.Type.isStringFilled(this.#email);
			this.#skipButton = this.#createSkipButton();
			this.#confirmButton = this.#createConfirmButton();
			this.#titleContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-input-title">
				${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_INPUT_SUBTITLE')}
			</div>
		`;
			this.#errorContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-errors"></div>
		`;
		}
		render() {
			return this.#container.remember('view', () => {
				const shouldShowInput = this.#forceChangeMode || this.#showInput;
				const skipButton = this.isForceChangeMode() ? '' : this.#skipButton.render();
				return main_core.Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">
						${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_DESC')}
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
		beforeShow(option) {
			if (main_core.Type.isStringFilled(option.email)) {
				this.#email = option.email;
				if (!this.#changeClicked) {
					this.#showInput = false;
				}
			}
		}
		afterShow() {
			Analytics.sendEvent(Analytics.SHOW_INPUT_EMAIL);
			this.render().querySelector('input')?.focus();
		}
		afterDismiss() {
			this.#container.delete('view');
			main_core.Dom.clean(this.#errorContainer);
		}
		#renderTitle() {
			return main_core.Tag.render`
			<span>
				${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_TITLE')}
			</span>
		`;
		}
		#renderCurrentEmail() {
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-info">
				<div class="intranet-push-otp-connect-popup__view-email-value">${main_core.Text.encode(this.#email)}</div>
				${this.#renderChangeEmailLink()}
				${this.#errorContainer}
			</div>
		`;
		}
		#renderInputEmail() {
			const input = main_core.Dom.create('input', {
				attrs: {
					className: 'intranet-push-otp-connect-popup__view-email-input',
					type: 'email',
					name: 'email'
				},
				props: {
					value: this.#email
				},
				events: {
					input: event => {
						if (main_core.Type.isElementNode(event?.target)) {
							this.#email = event.target.value.trim();
							this.#cleanError();
						}
					}
				}
			});
			input.placeholder = 'mail@example.com';
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-email-info">
				<div class="intranet-push-otp-connect-popup__view-email-input-box">
					${this.#titleContainer}
					${input}
					${this.#errorContainer}
				</div>
			</div>
		`;
		}
		#renderChangeEmailLink() {
			return main_core.Dom.create('a', {
				props: {
					className: 'intranet-push-otp-connect-popup__view-email-change'
				},
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_CHANGE_BTN'),
				events: {
					click: () => {
						this.#email = '';
						this.#changeClicked = true;
						this.#showInput = true;
						const container = this.render().querySelector('.intranet-push-otp-connect-popup__view-email-container');
						if (!container) {
							return;
						}
						main_core.Dom.clean(container);
						const inputBox = this.#renderInputEmail();
						main_core.Dom.append(inputBox, container);
						main_core.Dom.append(this.#renderGraphic(), container);
						inputBox.querySelector('input')?.focus();
					}
				}
			});
		}
		#renderGraphic() {
			return main_core.Tag.render`
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
		#createConfirmButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: false,
				onclick: () => {
					if (!this.#validate()) {
						return;
					}
					if (!this.#changeClicked && !this.#showInput && main_core.Type.isStringFilled(this.#email) && !this.#forceChangeMode) {
						this.#nextView();
						return;
					}
					this.#sendEmail();
				}
			});
		}
		#sendEmail() {
			if (this.#confirmButton.isWaiting()) {
				return;
			}
			this.#confirmButton.setWaiting(true);
			BX.ajax.runAction('intranet.v2.Otp.changeAuthEmail', {
				method: 'POST',
				data: {
					email: this.#email
				}
			}).then(response => {
				this.#confirmButton.setWaiting(false);
				if (response.status === 'success') {
					this.#showInput = false;
					this.#changeClicked = false;
					this.#signedData = response.data.signedData;
					this.#timeLeft = response.data.timeLeft;
					this.#nextView();
				}
			}, response => {
				this.#setErrors(response.errors);
				this.#confirmButton.setWaiting(false);
			}).catch(response => {
				this.#setErrors(response.errors);
				this.#confirmButton.setWaiting(false);
			});
		}
		#nextView() {
			this.emit('onNextView', {
				options: {
					email: this.#email,
					signedData: this.#signedData,
					timeLeft: this.#timeLeft
				}
			});
		}
		#validate() {
			this.#cleanError();
			if (!this.#showInput && main_core.Type.isStringFilled(this.#email) && !this.#forceChangeMode) {
				return true;
			}
			if (!main_core.Type.isStringFilled(this.#email)) {
				this.#setError(main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_EMPTY_ERROR'));
				return false;
			}
			if (!main_core.Validation.isEmail(this.#email) || !/^[^@]+@[^@]+\.[^@]+$/.test(this.#email)) {
				this.#setError(main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_EMAIL_INVALID_ERROR'));
				return false;
			}
			return true;
		}
		#setError(errorMessage) {
			main_core.Dom.clean(this.#errorContainer);
			main_core.Dom.append(main_core.Tag.render`<span>${errorMessage}</span>`, this.#errorContainer);
		}
		#setErrors(errors) {
			main_core.Dom.clean(this.#errorContainer);
			errors.forEach(error => {
				main_core.Dom.append(main_core.Tag.render`<span>${error.message}</span>`, this.#errorContainer);
			});
		}
		#cleanError() {
			main_core.Dom.clean(this.#errorContainer);
		}
		setForceChangeMode(force) {
			this.#forceChangeMode = force;
		}
		isForceChangeMode() {
			return this.#forceChangeMode;
		}
		#createSkipButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_SKIP_ADD_PHONE_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: false,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				onclick: () => {
					this.emit('onNextView', {
						viewCode: 'number'
					});
				}
			});
		}
	}

	class RepeatingRequest {
		constructor(interval) {
			this.interval = interval;
			this.timerId = null;
		}
		start(request) {
			if (this.timerId === null) {
				request();
				this.timerId = setInterval(() => {
					request();
				}, this.interval);
			}
		}
		stop() {
			if (this.timerId !== null) {
				clearInterval(this.timerId);
				this.timerId = null;
			}
		}
	}

	const makeQrCodeTo = (element, deeplink) => {
		main_core.Dom.clean(element);

		// eslint-disable-next-line no-undef
		new QRCode(element, {
			text: deeplink,
			width: 230,
			height: 230,
			colorDark: '#000000',
			colorLight: '#ffffff',
			// eslint-disable-next-line no-undef
			correctLevel: QRCode.CorrectLevel.H
		});
	};

	class QrView extends BaseView {
		#signedUserId;
		#pullConfig;
		#callback;
		#linkProvider;
		#repeatingRequest;
		#qrContainer;
		#loader;
		#isAppSuccessConnected = false;
		#onAppConnected;
		#unsubscribePull = null;
		constructor(options) {
			super(options);
			this.#signedUserId = options.signedUserId || null;
			this.#repeatingRequest = options.repeatingRequest;
			this.#pullConfig = main_core.Type.isObject(options.pullConfig) ? {
				...options.pullConfig
			} : {};
			this.#callback = main_core.Type.isFunction(options.callback) ? options.callback : () => {};
			this.#linkProvider = main_core.Type.isFunction(options.linkProvider) ? options.linkProvider : () => new Promise();
			this.#qrContainer = main_core.Tag.render`<div class="intranet-push-otp-connect-popup__qr-container"></div>`;
			this.#loader = new main_loader.Loader({
				target: this.#qrContainer,
				mode: 'inline',
				size: 120
			});
			this.#onAppConnected = main_core.Type.isFunction(options.onAppConnected) ? options.onAppConnected : () => {};
		}
		#renderTitle() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_TITLE')}</span>`;
		}
		render() {
			this.#subscribeToScanQr();
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_QR_DESCRIPTION')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div>${this.#qrContainer}</div>
					<div class="intranet-push-otp-connect-popup__view-guide-connect">
						<ol class="intranet-push-otp-connect-popup-ol-list">
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-1">
								${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_1_MSGVER_1', {
			'[LINK]': '<a href="https://appgallery.huawei.com/app/C105947779" target="_blank" class="ui-link ui-link-primary">',
			'[/LINK]': '</a>'
		})}
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-2">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_2')}</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-3">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_3')}</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-4">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_LIST_4')}</li>
						</ol>
						<div class="intranet-push-otp-connect-popup-alert">
							<div class="ui-icon-set --o-alert"></div>
							<div class="intranet-push-otp-connect-popup-alert-text">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_DANGER')}</div>
						</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
				</div>
			</div>
		`;
		}
		#showQrCode(deeplink) {
			makeQrCodeTo(this.#qrContainer, deeplink);
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.SHOW_INSTALL_APP);
			this.#repeatingRequest.start(this.#fetchQrCode.bind(this));
		}
		beforeDismiss(option) {
			this.#repeatingRequest.stop();
			if (this.#unsubscribePull) {
				this.#unsubscribePull();
				this.#unsubscribePull = null;
			}
		}
		#fetchQrCode() {
			this.#showLoader();
			return this.#linkProvider().then(response => {
				const link = response.data?.link;
				if (link) {
					this.#showQrCode(link);
				}
				this.#loader.hide();
			}).catch(() => {});
		}
		#subscribeToScanQr() {
			const pull = new pull_client.PullClient();
			this.#unsubscribePull = pull.subscribe({
				moduleId: 'security',
				command: 'pushOtpCode',
				callback: params => {
					params.signedUserId = this.#signedUserId;
					this.#callback(params).then(response => {
						this.#isAppSuccessConnected = true;
						this.#onAppConnected(this);
						this.emit('onNextView', {
							viewCode: '',
							options: {
								device: params.device
							}
						});
					}, response => console.error(response)).catch(error => {
						console.error('Error in QR scan callback:', error);
					});
				}
			});
			pull.start(this.#pullConfig);
		}
		#showLoader() {
			main_core.Dom.clean(this.#qrContainer);
			this.#loader.show();
		}
		isAppSuccessConnected() {
			return this.#isAppSuccessConnected;
		}
	}

	class SendNumberView extends BaseView {
		#signedUserId;
		#phoneNumber;
		#isPhoneNumberConfirmed;
		#changeClicked;
		#forceChangeMode = false;
		#container = new main_core_cache.MemoryCache();
		#sendButton;
		#skipButton;
		#titleContainer;
		#errorContainer;
		constructor(options) {
			super(options);
			this.#signedUserId = options.signedUserId || null;
			this.#phoneNumber = main_core.Type.isString(options.phoneNumber) ? ui_type.PhoneFormatter.formatValue(options.phoneNumber) : '';
			this.#isPhoneNumberConfirmed = options.isPhoneNumberConfirmed === true;
			this.#changeClicked = false;
			this.#sendButton = this.#createSendBtn();
			this.#skipButton = SendNumberView.createSkipAddPhoneNumberButton(this);
			this.#titleContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-subtitle">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_SUBTITLE')}</div>
		`;
			this.#errorContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors" id="enter-code-error-container"></div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_NUMBER_TITLE')}</span>`;
		}
		#renderCurrentPhoneNumber() {
			return main_core.Tag.render`
			<div>
				<div class="intranet-push-otp-connect-popup__view-phone-number-value">${this.#phoneNumber}</div>
				${this.#renderChangeNumberBtn()}
				${this.#errorContainer}
			</div>
		`;
		}
		#renderInputPhoneNumber() {
			const input = main_core.Dom.create('input', {
				attrs: {
					className: 'intranet-push-otp-connect-popup__view-phone-number-input',
					type: 'text',
					name: 'phone_number'
				},
				props: {
					value: ui_type.PhoneFormatter.formatValue(this.#phoneNumber)
				},
				events: {
					input: event => {
						if (main_core.Type.isElementNode(event?.target)) {
							event.target.value = ui_type.PhoneFormatter.formatValue(event.target.value);
							this.#phoneNumber = event.target.value;
						}
					}
				}
			});
			if (main_core.Reflection.getClass(BX.PhoneNumber)) {
				const phoneInput = new BX.PhoneNumber.Input({
					node: input
				});

				// eslint-disable-next-line promise/catch-or-return
				phoneInput.waitForInitialization().then(() => {
					const countryCode = main_core.Text.encode(phoneInput.getCountryCode());
					if (countryCode) {
						input.placeholder = `+${countryCode}`;
					}
				});
			}
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-phone-number-input-box">
				${this.#titleContainer}
				${input}
				${this.#errorContainer}
			</div>
		`;
		}
		#renderChangeNumberBtn() {
			return main_core.Dom.create('a', {
				props: {
					className: 'intranet-push-otp-connect-popup__view-phone-number-link'
				},
				html: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CHANGE_NUMBER_BTN'),
				events: {
					click: () => {
						this.#phoneNumber = '';
						this.#changeClicked = true;
						const container = this.render().querySelector('.intranet-push-otp-connect-popup__view-connect-container');
						main_core.Dom.clean(container);
						const inputBox = this.#renderInputPhoneNumber();
						main_core.Dom.append(inputBox, container);
						main_core.Dom.append(main_core.Tag.render`<div class="intranet-push-otp-connect-popup__view-phone-number-phone"></div>`, container);
						inputBox.querySelector('input')?.focus();
					}
				}
			});
		}
		render() {
			return this.#container.remember('view', () => {
				const shouldShowInput = this.#forceChangeMode || !main_core.Type.isStringFilled(this.#phoneNumber);
				return main_core.Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_NUMBER_DESC')}</div>
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
		#createSendBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_NEXT_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: false,
				onclick: button => {
					if (button.isWaiting() || button.isDisabled()) {
						return;
					}
					this.#cleanError();
					if (!this.#changeClicked && this.#isPhoneNumberConfirmed && !this.#forceChangeMode) {
						this.emit('onNextView', {
							viewCode: 'success',
							options: {
								phoneNumber: this.#phoneNumber
							}
						});
						return;
					}
					this.#sendNumber();
				}
			});
		}
		#sendNumber() {
			if (this.#sendButton.isWaiting()) {
				return;
			}
			this.#sendButton.setWaiting(true);
			BX.ajax.runAction('intranet.v2.Otp.changeAuthPhone', {
				method: 'POST',
				data: {
					signedUserId: this.#signedUserId,
					phoneNumber: this.#phoneNumber
				}
			}).then(response => {
				this.#sendButton.setWaiting(false);
				if (response.data === true) {
					this.#isPhoneNumberConfirmed = false;
					this.#nextView();
				}
			}, response => {
				this.#setError(response.errors);
				this.#sendButton.setWaiting(false);
			}).catch(response => {
				this.#setError(response.errors);
				this.#sendButton.setWaiting(false);
			});
		}
		#nextView(code = null) {
			this.emit('onNextView', {
				viewCode: code,
				options: {
					phoneNumber: this.#phoneNumber
				}
			});
		}
		#setError(errors) {
			main_core.Dom.clean(this.#errorContainer);
			errors.forEach(error => {
				main_core.Dom.append(main_core.Tag.render`<span>${error.message}</span>`, this.#errorContainer);
			});
		}
		#cleanError() {
			main_core.Dom.clean(BX('enter-code-error-container'));
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.SHOW_INPUT_PHONE);
			this.render().querySelector('input')?.focus();
		}
		setForceChangeMode(force) {
			this.#forceChangeMode = force;
		}
		isForceChangeMode() {
			return this.#forceChangeMode;
		}
		static createSkipAddPhoneNumberButton(view) {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_SKIP_ADD_PHONE_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: false,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				onclick: () => {
					BX.userOptions.del('intranet', 'require_phone_confirmation');
					if (view.isForceChangeMode()) {
						view.emit('onParentClose');
					} else {
						view.emit('onNextView', {
							viewCode: 'success'
						});
					}
				}
			});
		}
	}

	class DeviceConnectedView extends BaseView {
		#button;
		#phoneLabel;
		#phoneOs;
		#isProcessing = false;
		constructor(options) {
			super(options);
			this.#button = this.#createContinueBtn();
			this.#phoneLabel = main_core.Type.isStringFilled(options.phoneLabel) ? options.phoneLabel : '';
			this.#phoneOs = main_core.Type.isStringFilled(options.phoneOs) ? options.phoneOs : '';
		}
		#renderTitle() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECTED_TITLE')}</span>`;
		}
		beforeShow(options) {
			this.#phoneLabel = options?.device?.displayModel ?? '';
			this.#phoneOs = options?.device?.manufacturer === 'Apple' ? 'ios' : 'android';
			this.#isProcessing = false;
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.SHOW_INSTALL_APP_SUCCESS);
		}
		render() {
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div>
					<div class="intranet-push-otp-connect-popup__popup-title">
						${this.#renderTitle()}
					</div>
					${this.renderStepIndicators()}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_DESC')}</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo ${this.#phoneOs === 'ios' ? '' : '--android'}"></div>
						<div class="intranet-push-otp-connect-popup__view-connect-logo-text">${main_core.Text.encode(this.#phoneLabel)}</div>
					</div>
				</div>
				<div class="intranet-push-otp-connect-popup__view-button-container">
					${this.#button.render()}
				</div>
			</div>
		`;
		}
		#createContinueBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_NEXT_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: false,
				onclick: button => {
					if (this.#isProcessing || button.isWaiting()) {
						return;
					}
					this.#isProcessing = true;
					this.emit('onNextView', {
						viewCode: null,
						options: {
							closeIfLast: true
						}
					});
				}
			});
		}
	}

	class EnterCodeView extends BaseView {
		#signedUserId;
		#cooldown = 0;
		#input;
		#button;
		#errorContainer;
		#timerContainer;
		#cooldownInterval;
		#isPhoneNumberConfirmed = false;
		#codeSent = false;
		#container = new main_core_cache.MemoryCache();
		#phoneNumber = '';
		#backButton;
		#isFirstView = false;
		#skipButton;
		#forceChangeMode = false;
		constructor(options) {
			super(options);
			this.#signedUserId = options.signedUserId || null;
			this.#phoneNumber = options.phoneNumber || '';
			this.#backButton = this.#createBackBtn();
			this.#skipButton = intranet_pushOtp_connectPopup.SendNumberView.createSkipAddPhoneNumberButton(this);
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
				}
			});
			this.#button = this.#createConfirmCodeBtn();
			this.#timerContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-cooldown" id="enter-code-cooldown-timer">
			</div>
		`;
			this.#errorContainer = main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-enter-code-errors" id="enter-code-error-container"></div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_TITLE')}</span>`;
		}
		render() {
			return this.#container.remember('view', () => {
				const stepInfo = this.getStepInfo();
				this.#isFirstView = stepInfo.current === 1;
				return main_core.Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">
						${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_ENTER_CODE_DESCRIPTION', {
				'#PHONE_NUMBER#': `<strong>${this.#phoneNumber}</strong>`
			})}
					</div>
					<div class="intranet-push-otp-connect-popup__view-enter-code-container --content-center">
							${this.#input.render()}
							${this.#errorContainer}
							${this.#timerContainer}
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${this.#skipButton.render()}
						${this.#isFirstView ? '' : this.#backButton.render()}
						${this.#button.render()}
					</div>
				</div>
			`;
			});
		}
		#createConfirmCodeBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_CONFIRM_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				disabled: true,
				onclick: () => {
					if (this.#codeSent) {
						return;
					}
					this.#confirmCode();
				}
			});
		}
		sendCode() {
			if (!this.#canSendCode()) {
				return;
			}
			this.#cleanError();
			this.#button.setWaiting(true);
			this.#codeSent = true;
			BX.ajax.runAction('intranet.v2.Otp.sendConfirmationCode', {
				method: 'POST',
				data: {
					signedUserId: this.#signedUserId
				}
			}).then(response => {
				if (response.status === 'success') {
					this.#cooldown = main_core.Type.isNumber(response.data?.DATE_SEND) ? response.data?.DATE_SEND : 0;
					this.#startCooldownTimer();
				}
				this.#button.setWaiting(false);
			}, response => {
				this.#setError(response.errors);
				this.#cooldown = main_core.Type.isNumber(response.data?.DATE_SEND) ? response.data?.DATE_SEND : 0;
				this.#startCooldownTimer();
				this.#button.setWaiting(false);
			}).catch(error => console.error(error));
		}
		#canSendCode() {
			return this.#cooldown <= 0 && !this.#codeSent;
		}
		#startCooldownTimer() {
			clearInterval(this.#cooldownInterval);
			if (!this.#cooldown || !this.#timerContainer) {
				return;
			}
			const tickTimer = () => {
				if (this.#cooldown <= 0) {
					main_core.Dom.clean(this.#timerContainer);
					main_core.Dom.append(this.#renderResendBtn(), this.#timerContainer);
					return;
				}
				main_core.Dom.clean(this.#timerContainer);
				main_core.Dom.append(this.#renderTimer(), this.#timerContainer);
				this.#cooldown--;
			};
			tickTimer();
			this.#cooldownInterval = setInterval(() => {
				tickTimer();
				if (this.#cooldown < 0) {
					clearInterval(this.#cooldownInterval);
				}
			}, 1000);
		}
		beforeDismiss(options) {
			clearInterval(this.#cooldownInterval);
		}
		#renderResendBtn() {
			return main_core.Dom.create('a', {
				attrs: {
					href: '#'
				},
				props: {
					className: 'intranet-push-otp-connect-popup__view-enter-code-new'
				},
				html: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RESEND_CODE'),
				events: {
					click: () => {
						this.#codeSent = false;
						this.#input.clear();
						this.sendCode();
					}
				}
			});
		}
		#renderTimer() {
			return main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_COOLDOWN', {
			'#SEC#': this.#cooldown
		})}</span>`;
		}
		#confirmCode() {
			if (this.#button.isWaiting()) {
				return;
			}
			this.#cleanError();
			this.#button.setWaiting(true);
			BX.ajax.runAction('intranet.v2.Otp.confirmationPhoneNumber', {
				method: 'POST',
				data: {
					signedUserId: this.#signedUserId,
					code: this.#input.getValue()
				}
			}).then(response => {
				this.#button.setWaiting(false);
				if (response.status === 'success') {
					this.#isPhoneNumberConfirmed = true;
					this.emit('onNextView', {
						viewCode: null,
						options: {
							closeIfLast: true
						}
					});
				}
			}, response => {
				this.#setError(response.errors);
				this.#button.setWaiting(false);
			}).catch(response => {
				this.#setError(response.errors);
				this.#button.setWaiting(false);
			});
		}
		#setError(errors) {
			this.#input.setInputClass('confirm-code-input --danger');
			main_core.Dom.clean(this.#errorContainer);
			errors.forEach(error => {
				main_core.Dom.append(main_core.Tag.render`<span>${error.message}</span>`, this.#errorContainer);
			});
		}
		#cleanError() {
			this.#input.setInputClass('confirm-code-input --primary');
			main_core.Dom.clean(BX('enter-code-error-container'));
		}
		isPhoneNumberConfirmed() {
			return this.#isPhoneNumberConfirmed;
		}
		#createBackBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_BUTTON_BACK'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				disabled: false,
				onclick: () => {
					this.emit('onPreviousView');
				}
			});
		}
		beforeShow(option) {
			this.#codeSent = false;
			if (option.phoneNumber) {
				this.#phoneNumber = option.phoneNumber;
			}
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.SHOW_INPUT_PHONE_CODE);
			if (!this.#codeSent) {
				this.sendCode();
			}
		}
		afterDismiss(option) {
			this.#container.delete('view');
			main_core.Dom.clean(this.#errorContainer);
			main_core.Dom.clean(this.#timerContainer);
			this.#cooldown = 0;
			clearInterval(this.#cooldownInterval);
			this.#input.clear();
		}
		setForceChangeMode(force) {
			this.#forceChangeMode = force;
		}
		isForceChangeMode() {
			return this.#forceChangeMode;
		}
	}

	class SuccessView extends BaseView {
		render() {
			// eslint-disable-next-line no-undef
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup-success-box">
				<div class="intranet-push-otp-connect-popup-success-logo"></div>
				<div class="intranet-push-otp-connect-popup-success-title">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SUCCESS_TITLE')}</div>
				<div class="intranet-push-otp-connect-popup-success-subtitle">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SUCCESS_SUBTITLE')}</div>
			</div>
		`;
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.ADD_PHONE_SUCCESS);
			setTimeout(() => {
				this.#setConfetti().then(() => {
					setTimeout(() => {
						this.emit('onParentClose');
					}, 1000);
				});
			}, 500);
		}
		#setConfetti() {
			if (main_core.Browser.isFirefox()) {
				const canvas = main_core.Tag.render`
				<canvas></canvas>
			`;
				main_core.Dom.style(canvas, 'position', 'fixed');
				main_core.Dom.style(canvas, 'top', '0px');
				main_core.Dom.style(canvas, 'left', '0px');
				main_core.Dom.style(canvas, 'pointer-events', 'none');
				main_core.Dom.style(canvas, 'z-index', '11111');
				main_core.Dom.style(canvas, 'width', '100%');
				main_core.Dom.style(canvas, 'height', '100%');
				main_core.Dom.append(canvas, document.body);
				const confetti = ui_confetti.Confetti.create(canvas, {
					resize: true,
					useWorker: true
				});
				return confetti({
					particleCount: 250,
					origin: {
						y: 0.65
					},
					spread: 100
				});
			}
			return ui_confetti.Confetti.fire({
				particleCount: 250,
				spread: 100,
				origin: {
					y: 0.65
				},
				zIndex: 111_111
			});
		}
	}

	const resumeOtpRequest = signedUserId => {
		return BX.ajax.runAction('intranet.v2.Otp.resumeOtp', {
			mode: 'ajax',
			method: 'POST',
			data: {
				signedUserId
			}
		});
	};
	const pauseOtpRequest = (days, signedUserId) => {
		return BX.ajax.runAction('intranet.v2.Otp.pauseOtp', {
			mode: 'ajax',
			method: 'POST',
			data: {
				signedUserId,
				days
			}
		});
	};
	const deeplinkRequest = (intent, ttl) => {
		return main_core.ajax.runAction('mobile.deeplink.get', {
			data: {
				intent,
				ttl
			}
		});
	};

	class ReconnectQrView extends BaseView {
		#signedUserId;
		#pullConfig;
		#callback;
		#intent;
		#deviceName;
		#devicePlatform;
		#qrContainer;
		#loader;
		#isQrRevealed = false;
		#pull = null;
		#unsubscribePull = null;
		#repeatingRequest;
		#defaultTtl = 600;
		constructor(options) {
			super(options);
			this.#signedUserId = options.signedUserId || null;
			this.#pullConfig = main_core.Type.isObject(options.pullConfig) ? options.pullConfig : {};
			this.#callback = main_core.Type.isFunction(options.callback) ? options.callback : () => {};
			this.#intent = options.intent || '';
			this.#deviceName = options.deviceName || '';
			this.#devicePlatform = options.devicePlatform || '';
			this.#qrContainer = main_core.Tag.render`<div class="intranet-push-otp-connect-popup__qr-container"></div>`;
			this.#repeatingRequest = new RepeatingRequest(this.#defaultTtl * 1000);
			this.#loader = new main_loader.Loader({
				target: this.#qrContainer,
				mode: 'inline',
				size: 120
			});
		}
		render() {
			this.#renderQRPlaceholder();
			const deviceIconClass = this.#devicePlatform.toLowerCase() === 'ios' ? 'intranet-push-otp-connect-popup__reconnect-device-icon' : 'intranet-push-otp-connect-popup__reconnect-device-icon --android';
			return main_core.Tag.render`
			<div class="intranet-push-otp-connect-popup__view-container">
				<div class="intranet-push-otp-connect-popup__popup-title">
					${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_TITLE')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-description-text">
					${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_DESC')}
				</div>
				<div class="intranet-push-otp-connect-popup__view-connect-container">
					<div>${this.#qrContainer}</div>
					<div class="intranet-push-otp-connect-popup__view-guide-connect">
						<ol class="intranet-push-otp-connect-popup-ol-list">
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-1">
								${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_1')}
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-2">
								${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_2')}
								<div class="intranet-push-otp-connect-popup__reconnect-device-name">
									<i class="${deviceIconClass}"></i>
									${main_core.Text.encode(this.#deviceName)}
								</div>
							</li>
							<li class="intranet-push-otp-connect-popup-ol-list-item --marker-3">
								${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_STEP_3')}
							</li>
						</ol>
						<div class="intranet-push-otp-connect-popup-alert">
							<div class="ui-icon-set --o-alert"></div>
							<div class="intranet-push-otp-connect-popup-alert-text">
								${main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_QR_WARNING')}
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
		#renderQRPlaceholder() {
			const placeholder = main_core.Tag.render`<i class="intranet-push-otp-connect-popup__reconnect-qr-placeholder-image">`;
			const showButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_SHOW_QR_BTN'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_ACCENT_2,
				onclick: () => {
					Analytics.sendEventWithCSection(Analytics.RECONNECT_CLICK, 'qr');
					this.#revealQr();
				}
			});
			const qrIcon = main_core.Tag.render`<div class="intranet-push-otp-connect-popup__qr-icon ui-icon-set --o-qr-code">`;
			main_core.Dom.append(qrIcon, placeholder);
			showButton.renderTo(placeholder);
			main_core.Dom.append(placeholder, this.#qrContainer);
		}
		#revealQr() {
			if (this.#isQrRevealed) {
				return;
			}
			this.#isQrRevealed = true;
			Analytics.sendEvent(Analytics.RECONNECT_SHOW_QR);
			main_core.Dom.clean(this.#qrContainer);
			this.#subscribeToScanQr();
			this.#repeatingRequest.start(this.#fetchQrCode.bind(this));
		}
		#fetchQrCode() {
			main_core.Dom.clean(this.#qrContainer);
			this.#loader.show();
			return deeplinkRequest(this.#intent, this.#defaultTtl).then(response => {
				const link = response.data?.link;
				if (link) {
					makeQrCodeTo(this.#qrContainer, link);
				}
				this.#loader.hide();
			}).catch(() => {
				this.#loader.hide();
			});
		}
		#subscribeToScanQr() {
			this.#pull = new pull_client.PullClient();
			this.#unsubscribePull = this.#pull.subscribe({
				moduleId: 'security',
				command: 'pushOtpCode',
				callback: params => {
					params.signedUserId = this.#signedUserId;
					this.#callback(params).then(() => {
						Analytics.sendEvent(Analytics.RECONNECT_DEVICE_SUCCESS);
						this.emit('onNextView', {
							viewCode: ''
						});
					}, response => console.error(response)).catch(error => {
						console.error('Error in reconnect QR scan callback:', error);
					});
				}
			});
			this.#pull.start(this.#pullConfig);
		}
		#createRemindLaterButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECONNECT_REMIND_LATER_BTN'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: () => {
					Analytics.sendEventWithCSection(Analytics.RECONNECT_CLICK, 'later');
					this.emit('onParentClose');
				}
			});
		}
		afterShow(option) {
			Analytics.sendEvent(Analytics.SHOW_RECONNECT_DEVICE);
			BX.userOptions.save('intranet', 'push_otp_device_lost', null, 'N');
		}
		beforeDismiss(option) {
			this.#repeatingRequest.stop();
			if (this.#unsubscribePull) {
				this.#unsubscribePull();
				this.#unsubscribePull = null;
			}
		}
	}

	class EnablePushOtpProvider {
		#options;
		#defaultTtl = 600;
		constructor(options) {
			this.#options = options || {};
		}
		appConnectingHandler(params) {
			const initParams = {};
			if (params?.device) {
				initParams.deviceInfo = params.device;
			}
			if (params?.startTimestamp) {
				initParams.startTimestamp = params?.startTimestamp ?? 0;
			}
			const data = {
				secret: params.secret,
				type: 'push',
				sync1: params.code,
				sync2: '',
				signedUserId: params.signedUserId,
				initParams
			};
			return main_core.ajax.runAction('intranet.v2.Otp.setupPushOtp', {
				mode: 'ajax',
				method: 'POST',
				data
			});
		}
		#createQrView() {
			return new QrView({
				signedUserId: this.#options.signedUserId,
				pullConfig: this.#options.pullConfig,
				linkProvider: this.#options?.linkProvider ?? (() => deeplinkRequest(this.#options.intent, this.#defaultTtl)),
				repeatingRequest: this.#options?.repeatingRequest ?? new RepeatingRequest(this.#defaultTtl * 1000),
				callback: this.#options?.appConnectingProvider ?? this.appConnectingHandler,
				onAppConnected: this.#options?.events?.onAppConnected,
				id: 'qr'
			});
		}
		#createConnectedView() {
			return new DeviceConnectedView({
				id: 'connected'
			});
		}
		#createSendEmailView() {
			return new EmailView({
				id: 'email',
				signedUserId: this.#options.signedUserId,
				email: this.#options.email
			});
		}
		#createEmailEnterCodeView() {
			return new EmailEnterCodeView({
				id: 'emailCode',
				signedUserId: this.#options.signedUserId,
				email: this.#options.email
			});
		}
		#createSendNumberView() {
			return new SendNumberView({
				signedUserId: this.#options.signedUserId,
				phoneNumber: this.#options.phoneNumber,
				isPhoneNumberConfirmed: this.#options.isPhoneNumberConfirmed,
				id: 'number'
			});
		}
		#createEnterCodeView() {
			return new EnterCodeView({
				id: 'code',
				signedUserId: this.#options.signedUserId,
				phoneNumber: this.#options.phoneNumber
			});
		}
		#createSuccessView() {
			return new SuccessView({
				id: 'success',
				excludeFromSteps: true
			});
		}
		#createReconnectQrView() {
			return new ReconnectQrView({
				id: 'reconnectQr',
				excludeFromSteps: true,
				deviceName: this.#options.deviceName,
				devicePlatform: this.#options.devicePlatform,
				signedUserId: this.#options.signedUserId,
				intent: this.#options.intent,
				pullConfig: this.#options.pullConfig,
				callback: this.appConnectingHandler
			});
		}
		reconnectDevice() {
			return this.#createConnectPopup([this.#createReconnectQrView(), this.#createSuccessView()]);
		}
		create(code) {
			const viewList = [this.#createQrView(), this.#createConnectedView(), this.#createSendEmailView(), this.#createEmailEnterCodeView(), this.#createSendNumberView(), this.#createEnterCodeView(), this.#createSuccessView()];
			return this.#createConnectPopup(viewList, code);
		}
		onlySmsOtpConfirm() {
			const viewList = [this.#createEnterCodeView()];
			return this.#createConnectPopup(viewList);
		}
		onlySmsOtpChange() {
			const sendNumberView = this.#createSendNumberView();
			const enterCode = this.#createEnterCodeView();
			const viewList = [sendNumberView, enterCode];
			const popup = this.#createConnectPopup(viewList);
			sendNumberView.setForceChangeMode(true);
			enterCode.setForceChangeMode(true);
			return popup;
		}
		onlyEmailOtpChange() {
			const sendEmailView = this.#createSendEmailView();
			const enterCode = this.#createEmailEnterCodeView();
			const viewList = [sendEmailView, enterCode];
			const popup = this.#createConnectPopup(viewList);
			sendEmailView.setForceChangeMode(true);
			return popup;
		}
		onlyPushOtp() {
			const viewList = [this.#createQrView(), this.#createConnectedView()];
			return this.#createConnectPopup(viewList);
		}
		full() {
			const viewList = [this.#createQrView(), this.#createConnectedView()];
			if (main_core.Extension.getSettings('intranet.push-otp.connect-popup')?.get('canSendEmail')) {
				viewList.push(this.#createSendEmailView(), this.#createEmailEnterCodeView());
			}
			if (main_core.Extension.getSettings('intranet.push-otp.connect-popup')?.get('canSendSms')) {
				viewList.push(this.#createSendNumberView(), this.#createEnterCodeView());
			}
			viewList.push(this.#createSuccessView());
			if (this.#options.enablePostConnectFlow !== false) {
				if (Number(this.#options.userId) > 0 && this.#getCurrentUserId() !== Number(this.#options.userId)) {
					return this.#createConnectPopup(viewList);
				}
				const popup = this.#createConnectPopup(viewList, null, {
					skipDefaultOnClose: true
				});
				popup.subscribe('onClose', event => {
					const context = event.getData()?.context;
					const qrView = context?.getViewByCode('qr');
					if (qrView?.isAppSuccessConnected() === true) {
						this.openOtpSettingsWithTooltip();
					} else {
						this.#options?.events?.onPopupClose?.();
					}
				});
				return popup;
			}
			return this.#createConnectPopup(viewList);
		}
		openOtpSettingsWithTooltip() {
			const settingsUrl = this.#getCurrentUserSettingsUrl();
			if (!settingsUrl) {
				return;
			}
			sessionStorage.setItem('showRecoveryCodesTooltip', 'Y');
			const topSlider = main_sidepanel.SidePanel.Instance.getTopSlider();
			if (topSlider?.url.startsWith(settingsUrl)) {
				top.BX.Event.EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
				return;
			}
			main_sidepanel.SidePanel.Instance.open(settingsUrl, {
				events: {
					onOpen: () => {
						main_core_events.EventEmitter.subscribeOnce('BX.Intranet.Security:onChangePage', event => {
							if (event.data.page === 'otpConnected') {
								main_core_events.EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
							}
						});
					}
				}
			});
		}
		resumeOtpRequest() {
			return BX.ajax.runAction('intranet.v2.Otp.resumeOtp', {
				mode: 'ajax',
				method: 'POST',
				data: {
					signedUserId: this.#options.signedUserId
				}
			});
		}
		#createConnectPopup(viewList, viewCode = null, options = {}) {
			const popup = new ConnectPopup({
				viewList,
				viewCode
			});
			if (options.skipDefaultOnClose !== true) {
				popup.subscribe('onClose', () => {
					this.#options?.events?.onPopupClose?.();
				});
			}
			return popup;
		}
		#getCurrentUserSettingsUrl() {
			return main_core.Extension.getSettings('intranet.push-otp.connect-popup')?.get('settingsUrl') ?? '';
		}
		#getCurrentUserId() {
			return Number(main_core.Extension.getSettings('intranet.push-otp.connect-popup')?.get('userId') ?? 0);
		}
	}

	exports.ConnectPopup = ConnectPopup;
	exports.EmailEnterCodeView = EmailEnterCodeView;
	exports.EmailView = EmailView;
	exports.EnablePushOtpProvider = EnablePushOtpProvider;
	exports.QrView = QrView;
	exports.ReconnectQrView = ReconnectQrView;
	exports.RepeatingRequest = RepeatingRequest;
	exports.SendNumberView = SendNumberView;
	exports.pauseOtpRequest = pauseOtpRequest;
	exports.resumeOtpRequest = resumeOtpRequest;

})(this.BX.Intranet.PushOtp = this.BX.Intranet.PushOtp || {}, BX, BX.Cache, BX.Event, BX.Main, BX.UI, BX.UI.Analytics, BX, BX, BX, BX, BX, window, BX.Ui, BX, BX.SidePanel, BX.Intranet.PushOtp, BX.UI);
//# sourceMappingURL=connect-popup.bundle.js.map
