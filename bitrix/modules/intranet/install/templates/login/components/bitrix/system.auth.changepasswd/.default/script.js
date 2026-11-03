/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue3, main_core, intranet_login_passwordRequirements) {
	'use strict';

	class SystemAuthChangePassword {
		#application;
		#rootNode;
		#passwordRequirementsPolicy;
		#isFormVisible;
		#isCaptchaAvailable;
		constructor(params) {
			this.#rootNode = params.containerNode;
			this.#passwordRequirementsPolicy = params.passwordRequirementsPolicy;
			this.#isFormVisible = params.isFormVisible === 'Y';
			this.#isCaptchaAvailable = params.isCaptchaAvailable === 'Y';
			if (!main_core.Type.isDomNode(this.#rootNode)) {
				return;
			}
			this.#initVueApp();
		}
		#initVueApp() {
			const getApplication = () => this;
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'SystemAuthChangePassword',
				data() {
					return {
						isWaiting: false,
						isFormVisible: this.getApplication().#isFormVisible,
						isCaptchaAvailable: this.getApplication().#isCaptchaAvailable,
						isPasswordBlockVisible: true,
						isCaptchaBlockVisible: false,
						isPasswordRequirementsInvalid: true
					};
				},
				beforeCreate() {
					this.$bitrix.Application.set(getApplication());
				},
				mounted() {
					const passwordInput = this.$refs?.passwordInput;
					if (main_core.Type.isDomNode(passwordInput) && passwordInput.value !== '') {
						this.updatePasswordRequirementsState(passwordInput.value);
					}
				},
				methods: {
					onPasswordInput(event) {
						if (event.target instanceof HTMLInputElement) {
							this.updatePasswordRequirementsState(event.target.value);
						}
					},
					updatePasswordRequirementsState(password) {
						this.isPasswordRequirementsInvalid = intranet_login_passwordRequirements.validatePasswordRequirements(password, this.getApplication().#passwordRequirementsPolicy) !== 'valid';
					},
					onButtonClick(event) {
						if (this.isCaptchaAvailable && !this.isCaptchaBlockVisible) {
							event.preventDefault();
							this.showCaptchaBlock();
						} else {
							this.isWaiting = true;
						}
					},
					showCaptchaBlock() {
						this.isPasswordBlockVisible = false;
						this.isCaptchaBlockVisible = true;
					},
					getApplication() {
						return this.$bitrix.Application.get();
					}
				}
			});
			this.#application.mount(this.#rootNode);
		}
	}

	exports.SystemAuthChangePassword = SystemAuthChangePassword;

})(this.BX.Intranet = this.BX.Intranet || {}, BX.Vue3, BX, BX.Intranet.Login);
//# sourceMappingURL=script.js.map
