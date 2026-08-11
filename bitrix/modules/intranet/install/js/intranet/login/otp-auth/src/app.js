import { Type } from 'main.core';
import { PullClient } from 'pull.client';
import { LegacyOtp } from './components/legacy-otp';
import { PushOtp } from './components/push-otp';
import { AlternativeMethods } from './components/alternative-methods';
import { Sms } from './components/sms';
import { Email } from './components/email';
import { RecoveryCodes } from './components/recovery-codes';
import { RecoverAccess } from './components/recover-access';
import { ApplicationOfflineCode } from './components/application-offline-code';
import { Captcha } from './components/captcha';
import { usePushOtpStore } from './store/push-otp-store';
import { configureOtpAnalytics } from './analytics';

// @vue/component
export const Main = {
	components: {
		LegacyOtp,
		PushOtp,
		AlternativeMethods,
		ApplicationOfflineCode,
		Sms,
		Email,
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
		helpButtonConfigByStep: {
			type: Object,
			default: () => ({}),
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
		canLoginByEmail: {
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
		maskedUserAuthEmail: {
			type: String,
			default: '',
		},
		recoveryCodesHelpLink: {
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
		errorMessageText: {
			type: String,
			default: null,
		},
		canSendRequestRecoverAccess: {
			type: Boolean,
			default: true,
		},
		userId: {
			type: Number,
			default: 0,
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
			isAlternativeMethodsAvailable: (this.canLoginBySms || this.canLoginByEmail || this.isRecoveryCodesEnabled),
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
				email: 'Email',
				recoveryCodes: 'RecoveryCodes',
				recoverAccess: 'RecoverAccess',
				applicationOfflineCode: 'ApplicationOfflineCode',
			};

			return components[this.currentAuthStep] || 'LegacyOtp';
		},
		currentHelpButtonConfig(): ?Object
		{
			const helpButtonConfig = this.helpButtonConfigByStep?.[this.currentAuthStep];

			if (!helpButtonConfig)
			{
				return null;
			}

			if (helpButtonConfig.articleId)
			{
				return helpButtonConfig;
			}

			return null;
		},
	},
	created()
	{
		configureOtpAnalytics({ userId: this.userId });
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
		onShowEmail()
		{
			this.currentAuthStep = 'email';
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
		onHelpButtonClick()
		{
			const articleId = this.currentHelpButtonConfig?.articleId;
			const anchor = this.currentHelpButtonConfig?.anchor;

			if (!articleId)
			{
				return;
			}

			const query = anchor
				? `redirect=detail&code=${articleId}&anchor=${encodeURIComponent(anchor)}`
				: `redirect=detail&code=${articleId}`;

			BX.Helper.show(query);
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
		 :canLoginByEmail="canLoginByEmail"
		 :isRecoveryCodesEnabled="isRecoveryCodesEnabled"
		 :maskedUserAuthPhoneNumber="maskedUserAuthPhoneNumber"
		 :maskedUserAuthEmail="maskedUserAuthEmail"
		 :userDevice="userDevice"
		 :userData="userData"
		 :accountChangeUrl="accountChangeUrl"
		 :pushOtpConfig="pushOtpConfig"
		 :recoveryCodesHelpLink="recoveryCodesHelpLink"
		 :errorMessage="errorMessage"
		 :isAlternativeMethodsAvailable="isAlternativeMethodsAvailable"
		 :canSendRequestRecoverAccess="canSendRequestRecoverAccess"
		 @form-submit="onSubmitForm"
		 @show-alternatives="onShowAlternatives"
		 @back-to-push="onBackToPush"
		 @back-to-legacy="onBackToLegacy"
		 @show-sms="onShowSms"
		 @show-email="onShowEmail"
		 @show-recovery-codes="onShowRecoveryCodes"
		 @show-recover-access="onShowRecoverAccess"
		 @application-offline-code="onApplicationOfflineCode"
		 @clear-errors="onClearErrors"
		/>
		<Teleport to=".intranet-body__footer-right" v-if="currentHelpButtonConfig">
			<button type="button" class="intranet-help-widget intranet-page-base__help" @click="onHelpButtonClick">
				<i class="ui-icon-set intranet-help-widget__icon"></i>
				<span class="intranet-help-widget__text">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_HELP') }}
				</span>
			</button>
		</Teleport>
	`,
};
