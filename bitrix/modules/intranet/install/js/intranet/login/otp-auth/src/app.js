import { LegacyOtp } from './components/legacy-otp';
import { PushOtp } from './components/push-otp';
import { AlternativeMethods } from './components/alternative-methods';
import { Sms } from './components/sms';
import { RecoveryCodes } from './components/recovery-codes';
import { RecoverAccess } from './components/recover-access';
import { Captcha } from './components/captcha';

// @vue/component
export const Main = {
	components: {
		LegacyOtp,
		PushOtp,
		AlternativeMethods,
		Sms,
		RecoveryCodes,
		RecoverAccess,
		Captcha,
	},
	props: {
		rootNode: {
			type: HTMLElement,
			default: null,
		},
		pushOtpConfig: {
			type: Object,
			default: null,
		},
		authUrl: {
			type: String,
			default: '',
		},
		authOtpHelpLink: {
			type: String,
			default: '',
		},
		authLoginUrl: {
			type: String,
			default: '',
		},
		rememberOtp: {
			type: Boolean,
			default: false,
		},
		captchaCode: {
			type: String,
			default: '',
		},
		notShowLinks: {
			type: Boolean,
			default: false,
		},
		isBitrix24: {
			type: Boolean,
			default: false,
		},
		canLoginBySms: {
			type: Boolean,
			default: false,
		},
		isRecoveryCodesEnabled: {
			type: Boolean,
			default: false,
		},
		maskedUserAuthPhoneNumber: {
			type: String,
			default: '',
		},
		userDevice: {
			type: Object,
			default: null,
		},
		currentStep: {
			type: String,
			default: '',
		},
		recoveryCodesHelpLink: {
			type: String,
			default: '',
		},
		errorMessageText: {
			type: String,
			default: null,
		},
	},
	data()
	{
		let currentStep = 'legacy';

		if (this.pushOtpConfig)
		{
			currentStep = this.currentStep ?? 'push';
		}

		return {
			isWaiting: false,
			errorMessage: this.errorMessageText,
			currentAuthStep: currentStep,
			isAlternativeMethodsAvailable: (this.canLoginBySms || this.isRecoveryCodesEnabled),
		};
	},
	computed: {
		currentComponent(): string
		{
			const components = {
				legacy: 'LegacyOtp',
				push: 'PushOtp',
				alternative: 'AlternativeMethods',
				sms: 'Sms',
				recoveryCodes: 'RecoveryCodes',
				recoverAccess: 'RecoverAccess',
			};

			return components[this.currentAuthStep] || 'LegacyOtp';
		},
	},
	methods: {
		onSubmitForm()
		{
			this.isWaiting = true;
		},
		onShowAlternatives()
		{
			this.currentAuthStep = 'alternative';
		},
		onShowSms()
		{
			this.currentAuthStep = 'sms';
		},
		onShowRecoveryCodes()
		{
			this.currentAuthStep = 'recoveryCodes';
		},
		onShowRecoverAccess()
		{
			this.currentAuthStep = 'recoverAccess';
		},
		onBackToPush()
		{
			this.currentAuthStep = 'push';
		},
		onBackToLegacy()
		{
			this.currentAuthStep = 'legacy';
		},
		onClearErrors()
		{
			this.errorMessage = '';
		},
	},
	template: `
		<component
		 :is="currentComponent"
		 :authUrl="authUrl"
		 :authOtpHelpLink="authOtpHelpLink"
		 :authLoginUrl="authLoginUrl"
		 :rememberOtp="rememberOtp"
		 :captchaCode="captchaCode"
		 :notShowLinks="notShowLinks"
		 :isBitrix24="isBitrix24"
		 :canLoginBySms="canLoginBySms"
		 :isRecoveryCodesEnabled="isRecoveryCodesEnabled"
		 :maskedUserAuthPhoneNumber="maskedUserAuthPhoneNumber"
		 :userDevice="userDevice"
		 :pushOtpConfig="pushOtpConfig"
		 :recoveryCodesHelpLink="recoveryCodesHelpLink"
		 :errorMessage="errorMessage"
		 :isAlternativeMethodsAvailable="isAlternativeMethodsAvailable"
		 @form-submit="onSubmitForm"
		 @show-alternatives="onShowAlternatives"
		 @back-to-push="onBackToPush"
		 @back-to-legacy="onBackToLegacy"
		 @show-sms="onShowSms"
		 @show-recovery-codes="onShowRecoveryCodes"
		 @show-recover-access="onShowRecoverAccess"
		 @clear-errors="onClearErrors"
		/>
	`,
};
