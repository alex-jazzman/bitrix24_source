/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3, intranet_login_passwordRequirements) {
	'use strict';

	const systemAuthRegistrationMethods = {
		onButtonClick(event) {
			if (this.isNameBlockVisible) {
				event.preventDefault();
				if (this.isEnteredValidLoginAndEmail()) {
					this.showPasswordBlock();
					this.isBackButtonVisible = true;
				}
			} else if (this.isPasswordBlockVisible && this.isCaptchaAvailable) {
				event.preventDefault();
				this.showCaptchaBlock();
				this.isBackButtonVisible = true;
			} else {
				this.isWaiting = true;
			}
		},
		onBackButtonClick() {
			if (this.isPasswordBlockVisible) {
				this.showNameBlock();
				this.isBackButtonVisible = false;
			} else if (this.isCaptchaAvailable && this.isCaptchaBlockVisible) {
				this.showPasswordBlock();
			}
		},
		showNameBlock() {
			this.isNameBlockVisible = true;
			this.isPasswordBlockVisible = false;
			this.isCaptchaBlockVisible = false;
		},
		showPasswordBlock() {
			this.isNameBlockVisible = false;
			this.isPasswordBlockVisible = true;
			this.isCaptchaBlockVisible = false;
		},
		showCaptchaBlock() {
			this.isNameBlockVisible = false;
			this.isPasswordBlockVisible = false;
			this.isCaptchaBlockVisible = true;
		},
		toFullName() {
			const nameSplitter = this.userName !== '' && this.userLastName !== '' ? ' ' : '';
			return `${this.userName}${nameSplitter}${this.userLastName}`;
		},
		onEnterUserEmail(value) {
			this.userEmail = value;
		},
		isEmailEnteredCorrectly() {
			return main_core.Validation.isEmail(this.userEmail);
		},
		onEnterUserLogin(value) {
			this.userLogin = value;
		},
		isLoginEnteredCorrectly() {
			return this.userLogin.length >= 3;
		},
		onEnterUserName(value) {
			this.userName = value;
		},
		onEnterUserLastName(value) {
			this.userLastName = value;
		},
		isEnteredValidLoginAndEmail() {
			return this.isLoginEnteredCorrectly() && (!this.isEmailRequired || this.isEmailRequired && this.isEmailEnteredCorrectly());
		},
		onEyeMouseDown(inputElementName) {
			if (inputElementName === 'PASSWORD') {
				this.inputPasswordType = 'text';
			} else {
				this.inputConfirmPasswordType = 'text';
			}
		},
		onEyeMouseUp(inputElementName) {
			if (inputElementName === 'PASSWORD') {
				this.inputPasswordType = 'password';
			} else {
				this.inputConfirmPasswordType = 'password';
			}
		},
		getApplication() {
			return this.$bitrix.Application.get();
		}
	};
	class SystemAuthRegistration {
		#application;
		#rootNode;
		#passwordRequirementsPolicy;
		#isEmailRequired;
		#isConfirmRegistrationBlockVisible;
		#isCaptchaAvailable;
		#userName;
		#userLastName;
		#userEmail;
		#userLogin;
		constructor(params) {
			this.#rootNode = params.containerNode;
			this.#passwordRequirementsPolicy = params.passwordRequirementsPolicy;
			this.#isEmailRequired = params.isEmailRequired === 'Y';
			this.#isConfirmRegistrationBlockVisible = params.isConfirmRegistrationBlockVisible === 'Y';
			this.#isCaptchaAvailable = params.isCaptchaAvailable === 'Y';
			this.#userName = params.userName ?? '';
			this.#userLastName = params.userLastName ?? '';
			this.#userEmail = params.userEmail ?? '';
			this.#userLogin = params.userLogin ?? '';
			if (!main_core.Type.isDomNode(this.#rootNode)) {
				return;
			}
			this.#initVueApp();
			BX.UI.Hint.init(this.#rootNode);
		}
		#initVueApp() {
			const getApplication = () => this;
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'SystemAuthRegistration',
				data() {
					return {
						isNameBlockVisible: true,
						isPasswordBlockVisible: false,
						isCaptchaBlockVisible: false,
						isBackButtonVisible: false,
						userName: this.getApplication().#userName,
						userLastName: this.getApplication().#userLastName,
						userEmail: this.getApplication().#userEmail,
						userLogin: this.getApplication().#userLogin,
						isEmailRequired: this.getApplication().#isEmailRequired,
						isConfirmRegistrationBlockVisible: this.getApplication().#isConfirmRegistrationBlockVisible,
						isCaptchaAvailable: this.getApplication().#isCaptchaAvailable,
						isWaiting: false,
						inputPasswordType: 'password',
						inputConfirmPasswordType: 'password',
						isPasswordRequirementsInvalid: true
					};
				},
				beforeCreate() {
					this.$bitrix.Application.set(getApplication());
				},
				computed: {
					fullName() {
						return this.toFullName();
					},
					email() {
						return this.userEmail;
					},
					activeOrDisabledButtonClass() {
						return this.isEnteredValidLoginAndEmail() ? 'ui-btn-success' : 'ui-btn-disabled';
					}
				},
				mounted() {
					if (this.$refs && main_core.Type.isDomNode(this.$refs.modalInput)) {
						this.$refs.modalInput.focus();
					}
					const passwordInput = this.$refs?.passwordInput;
					if (main_core.Type.isDomNode(passwordInput) && passwordInput.value !== '') {
						this.updatePasswordRequirementsState(passwordInput.value);
					}
				},
				methods: {
					...systemAuthRegistrationMethods,
					onPasswordInput(event) {
						if (event.target instanceof HTMLInputElement) {
							this.updatePasswordRequirementsState(event.target.value);
						}
					},
					updatePasswordRequirementsState(password) {
						this.isPasswordRequirementsInvalid = intranet_login_passwordRequirements.validatePasswordRequirements(password, this.getApplication().#passwordRequirementsPolicy) !== 'valid';
					}
				}
			});
			this.#application.mount(this.#rootNode);
		}
	}

	exports.SystemAuthRegistration = SystemAuthRegistration;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Vue3, BX.Intranet.Login);
//# sourceMappingURL=script.js.map
