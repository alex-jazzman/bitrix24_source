import { BitrixVue } from 'ui.vue3';
import { Type } from 'main.core';
import {
	type PasswordRequirementsPolicy,
	validatePasswordRequirements,
} from 'intranet.login.password-requirements';

export type SystemAuthChangePasswordParamsType = {
	containerNode: HTMLElement,
	passwordRequirementsPolicy: PasswordRequirementsPolicy | null,
	isFormVisible: boolean,
	isCaptchaAvailable: boolean,
}

export class SystemAuthChangePassword
{
	#application;
	#rootNode: HTMLElement;
	#passwordRequirementsPolicy: PasswordRequirementsPolicy | null;
	#isFormVisible: boolean;
	#isCaptchaAvailable: boolean;

	constructor(params: SystemAuthChangePasswordParamsType): void
	{
		this.#rootNode = params.containerNode;
		this.#passwordRequirementsPolicy = params.passwordRequirementsPolicy;
		this.#isFormVisible = params.isFormVisible === 'Y';
		this.#isCaptchaAvailable = params.isCaptchaAvailable === 'Y';

		if (!Type.isDomNode(this.#rootNode))
		{
			return;
		}

		this.#initVueApp();
	}

	#initVueApp(): void
	{
		const getApplication = (): SystemAuthChangePassword => this;

		this.#application = BitrixVue.createApp({
			name: 'SystemAuthChangePassword',
			data()
			{
				return {
					isWaiting: false,
					isFormVisible: this.getApplication().#isFormVisible,
					isCaptchaAvailable: this.getApplication().#isCaptchaAvailable,
					isPasswordBlockVisible: true,
					isCaptchaBlockVisible: false,
					isPasswordRequirementsInvalid: true,
				};
			},
			beforeCreate(): void
			{
				this.$bitrix.Application.set(getApplication());
			},
			mounted(): void
			{
				const passwordInput: ?HTMLInputElement = this.$refs?.passwordInput;
				if (Type.isDomNode(passwordInput) && passwordInput.value !== '')
				{
					this.updatePasswordRequirementsState(passwordInput.value);
				}
			},
			methods: {
				onPasswordInput(event: InputEvent): void
				{
					if (event.target instanceof HTMLInputElement)
					{
						this.updatePasswordRequirementsState(event.target.value);
					}
				},

				updatePasswordRequirementsState(password: string): void
				{
					this.isPasswordRequirementsInvalid = validatePasswordRequirements(
						password,
						this.getApplication().#passwordRequirementsPolicy,
					) !== 'valid';
				},

				onButtonClick(event): void
				{
					if (this.isCaptchaAvailable && !this.isCaptchaBlockVisible)
					{
						event.preventDefault();
						this.showCaptchaBlock();
					}
					else
					{
						this.isWaiting = true;
					}
				},

				showCaptchaBlock(): void
				{
					this.isPasswordBlockVisible = false;
					this.isCaptchaBlockVisible = true;
				},

				getApplication()
				{
					return this.$bitrix.Application.get();
				},
			},
		});
		this.#application.mount(this.#rootNode);
	}
}
