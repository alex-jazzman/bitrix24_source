import { Type, Validation } from 'main.core';
import { BitrixVue } from 'ui.vue3';

export type SystemAuthForgotPasswordParamsType = {
	containerNode: HTMLElement,
	isFormVisible: boolean,
	isCaptchaAvailable: boolean,
}

export class SystemAuthForgotPassword
{
	#application;
	#rootNode: HTMLElement;
	#isFormVisible: boolean;
	#isCaptchaAvailable: boolean;

	constructor(params: SystemAuthForgotPasswordParamsType): void
	{
		this.#rootNode = params.containerNode;
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
		const context = this;

		this.#application = BitrixVue.createApp({
			name: 'SystemAuthForgotPassword',
			data()
			{
				return {
					isWaiting: false,
					isFormVisible: this.getApplication().#isFormVisible,
					isEmailEntered: false,
					isFormBlockVisible: true,
					isCaptchaBlockVisible: false,
					isCaptchaAvailable: this.getApplication().#isCaptchaAvailable,
				};
			},
			beforeCreate(): void
			{
				this.$bitrix.Application.set(context);
			},
			computed: {
				loginOrEmail(): string
				{
					return (this.isEmailEntered) ? 'USER_EMAIL' : 'USER_LOGIN';
				},
			},
			mounted(): void
			{
				if (this.$refs && Type.isDomNode(this.$refs.modalInput))
				{
					this.$refs.modalInput.focus();
				}
			},
			methods: {
				onEnterLoginOrEmail(value: string): void
				{
					this.isEmailEntered = Validation.isEmail(value);
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
					this.isFormBlockVisible = false;
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
