import { Type } from 'main.core';
import { Headline } from 'ui.system.typography.vue';
import { VerificationCode } from './verification-code';
import { Ajax } from '../api/ajax';
import { Captcha } from './captcha';
import { sendData } from 'ui.analytics';

// @vue/component
export const Sms = {
	components: {
		VerificationCode,
		Captcha,
		Headline,
	},
	props: {
		authUrl: {
			type: String,
			default: '',
		},
		captchaCode: {
			type: String,
			default: '',
		},
		maskedUserAuthPhoneNumber: {
			type: String,
			default: '',
		},
		errorMessage: {
			type: String,
			default: null,
		},
	},
	data(): Object
	{
		return {
			isWaiting: false,
			code: '',
			isSmsBlockVisible: true,
			isCaptchaBlockVisible: false,
			countdown: null,
			countdownInterval: null,
		};
	},
	computed: {
		phoneMessage(): String
		{
			return this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_SENDED', {
				'#NUMBER#': `<strong>${this.maskedUserAuthPhoneNumber}</strong>`,
			});
		},
		isResendSmsAvailable(): boolean
		{
			return (this.countdown && this.countdown <= 0);
		},
		isCountdownVisible(): boolean
		{
			return (this.countdown && this.countdown > 0);
		},
	},
	mounted()
	{
		this.sendSmsCode();
		this.sendAnalytics('sms_show');
	},
	methods: {
		onSubmitForm()
		{
			if (this.captchaCode)
			{
				event.preventDefault();
				this.showCaptcha();
			}
			else
			{
				this.isWaiting = true;
				this.$emit('form-submit');
			}
		},
		async sendSmsCode()
		{
			await Ajax.sendAuthSms().then((response) => {
				this.countdown = Type.isNumber(response.data?.timeLeft) ? response.data?.timeLeft : 0;
				this.startCountdownTimer();
			}, (response) => {
				this.countdown = Type.isNumber(response.data?.timeLeft) ? response.data?.timeLeft : 0;
				this.startCountdownTimer();
			}).catch((error) => console.error(error));
		},
		async resendSendSmsCode()
		{
			this.sendAnalytics('sms_repeat_click');
			await this.sendSmsCode();
		},
		startCountdownTimer()
		{
			clearInterval(this.countdownInterval);

			this.countdownInterval = setInterval(() => {
				this.countdown--;
				if (this.countdown < 0)
				{
					clearInterval(this.countdownInterval);
				}
			}, 1000);
		},
		onCodeChange(code)
		{
			this.code = code;
		},
		onCodeComplete(code)
		{
			this.code = code;
			this.$nextTick(() => {
				if (this.captchaCode)
				{
					this.showCaptcha();
				}
				else
				{
					this.isWaiting = true;
					this.$emit('form-submit');
					if (this.$refs.authForm)
					{
						this.$refs.authForm.submit();
					}
				}
			});
		},
		showPushOtp()
		{
			this.$emit('clear-errors');
			this.$emit('back-to-push');
		},
		showCaptcha()
		{
			this.isSmsBlockVisible = false;
			this.isCaptchaBlockVisible = true;
		},
		sendAnalytics(event)
		{
			sendData({
				tool: 'security',
				category: 'fa_auth_form',
				event,
			});
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y"/>
			<input type="hidden" name="TYPE" value="OTP"/>
			<input type="hidden" name="USER_OTP" :value="code"/>
			<input type="hidden" name="CURRENT_STEP" value="sms"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isSmsBlockVisible" class="intranet-island-otp-push-sms__wrapper">
				<div @click="showPushOtp" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --smscode"></i>
				</div>
				<Headline size='lg' class="intranet-form-title --padding">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<span class="intranet-island-otp-push-sms__description">
					<div v-html="phoneMessage"></div>
				</span>
				<VerificationCode
					:code="code"
					:isPhoneCode=true
					:error="errorMessage"
					@code-change="onCodeChange"
					@code-complete="onCodeComplete"
				></VerificationCode>
				<div class="intranet-otp-error-block" v-html="errorMessage"></div>

				<div class="intranet-island-otp-push-sms__resend">
					<span v-if="isResendSmsAvailable" class="intranet-island-otp-push__link" @click="resendSendSmsCode">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_RESEND') }}
					</span>
					<span v-if="isCountdownVisible" class="intranet-island-otp-push-sms__countdown">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_COUNTDOWN', {'#SEC#': this.countdown}) }}
					</span>
				</div>

				<button
					class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success --wide"
					type="submit"
					@click="onSubmitForm"
				>
						<span class="intranet-text-btn__content-wrapper">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
						</span>
					<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
				</button>
			</div>

			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
	`,
};
