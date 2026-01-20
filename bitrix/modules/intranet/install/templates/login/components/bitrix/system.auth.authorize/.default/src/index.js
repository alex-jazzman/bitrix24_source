import { Type, Dom, ajax } from 'main.core';
import { BitrixVue } from 'ui.vue3';

export type SystemAuthAuthorizeParamsType = {
	authContainerNode: HTMLElement,
	isQrAvailable: 'Y' | 'N',
	isStorePasswordAvailable: 'Y' | 'N',
	isCaptchaAvailable: 'Y' | 'N',
	qrText: string,
	qrConfig: string,
	focusInput: string,
}

export class SystemAuthAuthorize
{
	#application;
	#authContainerNode: HTMLElement;
	#isQrAvailable: boolean;
	#isStorePasswordAvailable: boolean;
	#isCaptchaAvailable: boolean;
	#qrText: string;
	#qrConfig: string;
	#focusInput: string;

	constructor(params: SystemAuthAuthorizeParamsType)
	{
		this.#authContainerNode = params.authContainerNode;
		this.#isQrAvailable = params.isQrAvailable === 'Y';
		this.#isStorePasswordAvailable = params.isStorePasswordAvailable === 'Y';
		this.#isCaptchaAvailable = params.isCaptchaAvailable === 'Y';
		this.#qrText = params.qrText || '';
		this.#qrConfig = params.qrConfig || '';
		this.#focusInput = params.focusInput || '';

		if (!Type.isDomNode(this.#authContainerNode))
		{
			return;
		}

		this.#initVueApp();
	}

	#initVueApp(): void
	{
		const context = this;

		this.#application = BitrixVue.createApp({
			name: 'SystemAuthAuthorize',
			data()
			{
				return {
					isWaiting: false,
					authContainerNode: this.getApplication().#authContainerNode,
					isQrAvailable: this.getApplication().#isQrAvailable,
					isStorePasswordAvailable: this.getApplication().#isStorePasswordAvailable,
					isCaptchaAvailable: this.getApplication().#isCaptchaAvailable,
					focusInput: this.getApplication().#focusInput,
					qrText: this.getApplication().#qrText,
					qrConfig: this.getApplication().#qrConfig,
					isFormBlockVisible: true,
					isCaptchaBlockVisible: false,
				};
			},
			beforeCreate(): void
			{
				this.$bitrix.Application.set(context);
			},
			mounted(): void
			{
				BX.UI.Hint.init(this.authContainerNode);

				const focusInput = document.forms.form_auth[this.focusInput];
				focusInput?.focus();

				if (this.isQrAvailable)
				{
					this.initQrCode();
				}
			},
			methods: {
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

				initQrCode(): void
				{
					new QRCode('bx_auth_qr_code', {
						text: this.qrText,
						width: 220,
						height: 220,
						colorDark: '#000000',
						colorLight: '#ffffff',
					});

					if (!this.qrConfig)
					{
						return;
					}

					this.qrCodeSuccessIcon = this.authContainerNode.querySelector('.intranet-qr-scan-form__code-overlay');

					const Pull = new BX.PullClient();
					Pull.subscribe({
						moduleId: 'main',
						command: 'qrAuthorize',
						callback: (params) => {
							if (params.token)
							{
								this.showQrCodeSuccessIcon();

								ajax.runAction(
									'main.qrcodeauth.authenticate',
									{
										data: {
											token: params.token,
											remember: (this.isStorePasswordAvailable ? 1 : 0),
										},
									},
								).then((response) => {
									this.hideQrCodeSuccessIcon();

									if (response.status === 'success')
									{
										window.location = (params.redirectUrl !== '' ? params.redirectUrl : window.location);
									}
								}).catch((error) => console.error(error));
							}
						},
					});
					Pull.start(this.qrConfig);
				},

				showQrCodeSuccessIcon(): void
				{
					if (!Type.isDomNode(this.qrCodeSuccessIcon))
					{
						return;
					}

					Dom.addClass(this.qrCodeSuccessIcon, 'intranet-qr-scan-form__code-overlay--active');
				},

				hideQrCodeSuccessIcon(): void
				{
					if (!Type.isDomNode(this.qrCodeSuccessIcon))
					{
						return;
					}

					Dom.removeClass(this.qrCodeSuccessIcon, 'intranet-qr-scan-form__code-overlay--active');
				},

				getApplication()
				{
					return this.$bitrix.Application.get();
				},
			},
		});
		this.#application.mount(this.#authContainerNode);
	}
}
