import { BitrixVue } from 'ui.vue3';
import { Type } from 'main.core';
import { createPinia } from 'ui.vue3.pinia';
import { Main } from './app';
import './style.css';

export type SystemAuthOtpParamsType = {
	containerNode: HTMLElement,
	pushOtpConfig?: Object,
	authUrl: string,
	authOtpHelpLink?: string,
	helpButtonConfigByStep?: {[step: string]: {articleId?: number, anchor?: string}},
	authLoginUrl?: string,
	rememberOtp?: boolean,
	captchaCode?: string,
	notShowLinks?: boolean,
	isBitrix24?: boolean,
	canLoginBySms?: boolean,
	canLoginByEmail?: boolean,
	isRecoveryCodesEnabled?: boolean,
	maskedUserAuthPhoneNumber?: string,
	maskedUserAuthEmail?: string,
	userDevice?: Object,
	userData?: Object,
	currentStep?: string,
	accountChangeUrl?: string,
	recoveryCodesHelpLink: string,
	errorMessage?: HTMLElement,
	canSendRequestRecoverAccess?: boolean,
	userId?: number,
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
			rootNode: this.#rootNode,
			pushOtpConfig: params.pushOtpConfig,
			authUrl: params.authUrl,
			authOtpHelpLink: params.authOtpHelpLink,
			helpButtonConfigByStep: params.helpButtonConfigByStep,
			authLoginUrl: params.authLoginUrl,
			rememberOtp: params.rememberOtp,
			captchaCode: params.captchaCode,
			notShowLinks: params.notShowLinks,
			canLoginBySms: params.canLoginBySms,
			canLoginByEmail: params.canLoginByEmail,
			isRecoveryCodesEnabled: params.isRecoveryCodesEnabled,
			maskedUserAuthPhoneNumber: params.maskedUserAuthPhoneNumber,
			maskedUserAuthEmail: params.maskedUserAuthEmail,
			recoveryCodesHelpLink: params.recoveryCodesHelpLink,
			userDevice: params.userDevice,
			userData: params.userData,
			accountChangeUrl: params.accountChangeUrl,
			currentStep: params.currentStep,
			errorMessageText: params.errorMessage,
			canSendRequestRecoverAccess: params.canSendRequestRecoverAccess,
			userId: params.userId,
		});

		const pinia = createPinia();
		this.#application.use(pinia);
		this.#application.mount(this.#rootNode);
	}
}
