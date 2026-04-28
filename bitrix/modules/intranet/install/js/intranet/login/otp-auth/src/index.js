import { BitrixVue } from 'ui.vue3';
import { Type } from 'main.core';
import { createPinia } from 'ui.vue3.pinia';
import { Main } from './app';
import './style.css';

export type SystemAuthOtpParamsType = {
	signedUserId: string,
	containerNode: HTMLElement,
	pushOtpConfig?: Object,
	authUrl: string,
	authOtpHelpLink?: string,
	authLoginUrl?: string,
	rememberOtp?: boolean,
	captchaCode?: string,
	notShowLinks?: boolean,
	isBitrix24?: boolean,
	canLoginBySms?: boolean,
	isRecoveryCodesEnabled?: boolean,
	maskedUserAuthPhoneNumber?: string,
	userDevice?: Object,
	userData?: Object,
	currentStep?: string,
	accountChangeUrl?: string,
	recoveryCodesHelpLink: string,
	errorMessage?: HTMLElement,
	canSendRequestRecoverAccess?: boolean,
}

export class OtpAuth
{
	static #rootNode: HTMLElement;
	static #application;

	static init(params: SystemAuthOtpParamsType): void
	{
		this.#rootNode = params.containerNode;

		if (!Type.isDomNode(this.#rootNode))
		{
			return;
		}

		this.#application = BitrixVue.createApp(Main, {
			signedUserId: params.signedUserId,
			rootNode: this.#rootNode,
			pushOtpConfig: params.pushOtpConfig,
			authUrl: params.authUrl,
			authOtpHelpLink: params.authOtpHelpLink,
			authLoginUrl: params.authLoginUrl,
			rememberOtp: params.rememberOtp,
			captchaCode: params.captchaCode,
			notShowLinks: params.notShowLinks,
			canLoginBySms: params.canLoginBySms,
			isRecoveryCodesEnabled: params.isRecoveryCodesEnabled,
			maskedUserAuthPhoneNumber: params.maskedUserAuthPhoneNumber,
			userDevice: params.userDevice,
			userData: params.userData,
			accountChangeUrl: params.accountChangeUrl,
			currentStep: params.currentStep,
			recoveryCodesHelpLink: params.recoveryCodesHelpLink,
			errorMessageText: params.errorMessage,
			canSendRequestRecoverAccess: params.canSendRequestRecoverAccess,
		});

		const pinia = createPinia();
		this.#application.use(pinia);
		this.#application.mount(this.#rootNode);
	}
}
