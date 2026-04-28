import { Type } from 'main.core';
import { PullClient } from 'pull.client';
import { LegacyOtp } from './components/legacy-otp';
import { PushOtp } from './components/push-otp';
import { AlternativeMethods } from './components/alternative-methods';
import { Sms } from './components/sms';
import { RecoveryCodes } from './components/recovery-codes';
import { RecoverAccess } from './components/recover-access';
import { ApplicationOfflineCode } from './components/application-offline-code';
import { Captcha } from './components/captcha';
import { usePushOtpStore } from './store/push-otp-store';

// @vue/component
export const Main = {
	components: {
		LegacyOtp,
		PushOtp,
		AlternativeMethods,
		ApplicationOfflineCode,
		Sms,
		RecoveryCodes,
		RecoverAccess,
		Captcha,
	},
	props: {
		signedUserId: {
			type: String,
			default: '',
		},
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
		userData: {
			type: Object,
			default: null,
		},
		accountChangeUrl: {
			type: String,
			default: '',
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
		canSendRequestRecoverAccess: {
			type: Boolean,
			default: true,
		},
	},
	setup(): Object
	{
		const pushOtpStore = usePushOtpStore();

		return {
			pushOtpStore,
		};
	},
	data(): Object
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
			pullClient: null,
			pendingOtpCode: null,
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
				applicationOfflineCode: 'ApplicationOfflineCode',
			};

			return components[this.currentAuthStep] || 'LegacyOtp';
		},
	},
	mounted()
	{
		if (this.pushOtpConfig)
		{
			const cooldownSeconds = this.pushOtpStore.getCooldownSeconds(this.pushOtpConfig);
			this.pushOtpStore.initCooldown(cooldownSeconds);
			this.initPushOtpSubscription();
		}
	},
	beforeUnmount()
	{
		this.pushOtpStore.stopCooldown();
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
		onApplicationOfflineCode()
		{
			this.currentAuthStep = 'applicationOfflineCode';
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
		initPushOtpSubscription()
		{
			if (!this.pushOtpConfig)
			{
				return;
			}

			this.pullClient = new PullClient();
			this.pullClient.subscribe({
				moduleId: 'security',
				command: 'pushOtpCode',
				callback: (params) => {
					this.handlePushOtpCode(params);
				},
			});

			try
			{
				this.pullClient.start(this.pushOtpConfig.pullConfig);
			}
			catch (error)
			{
				console.error('Push OTP pull start failed', error);
			}
		},
		handlePushOtpCode(params)
		{
			const code = params?.code;
			if (!code)
			{
				return;
			}

			const authComponent = this.$refs?.authComponent;
			const form = authComponent?.$refs?.authForm ?? (Type.isUndefined(document) ? null : document.forms?.form_auth);
			if (this.applyOtpCode(code, authComponent, form))
			{
				return;
			}

			this.pendingOtpCode = code;
			this.currentAuthStep = 'push';
			this.$nextTick(() => {
				const pushComponent = this.$refs?.authComponent;
				const pushForm = pushComponent?.$refs?.authForm
					?? (Type.isUndefined(document) ? null : document.forms?.form_auth);
				this.applyOtpCode(this.pendingOtpCode, pushComponent, pushForm);
				this.pendingOtpCode = null;
			});
		},
		applyOtpCode(code, componentRef, formRef)
		{
			if (!formRef || !formRef.USER_OTP)
			{
				return false;
			}

			formRef.USER_OTP.value = code;

			const hasCaptcha = Boolean(this.captchaCode);

			if (hasCaptcha && componentRef?.showCaptcha)
			{
				componentRef.showCaptcha();

				return true;
			}

			formRef.submit();

			return true;
		},
	},
	template: `
		<component
		 :is="currentComponent"
		 ref="authComponent"
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
		 :userData="userData"
		 :accountChangeUrl="accountChangeUrl"
		 :pushOtpConfig="pushOtpConfig"
		 :recoveryCodesHelpLink="recoveryCodesHelpLink"
		 :errorMessage="errorMessage"
		 :isAlternativeMethodsAvailable="isAlternativeMethodsAvailable"
		 :signedUserId="signedUserId"
		 :canSendRequestRecoverAccess="canSendRequestRecoverAccess"
		 @form-submit="onSubmitForm"
		 @show-alternatives="onShowAlternatives"
		 @back-to-push="onBackToPush"
		 @back-to-legacy="onBackToLegacy"
		 @show-sms="onShowSms"
		 @show-recovery-codes="onShowRecoveryCodes"
		 @show-recover-access="onShowRecoverAccess"
		 @application-offline-code="onApplicationOfflineCode"
		 @clear-errors="onClearErrors"
		/>
	`,
};
