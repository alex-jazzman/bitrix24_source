import { Headline } from 'ui.system.typography.vue';
import { RecoveryCodeInput } from './recovery-code-input';
import { Captcha } from './captcha';
import { sendData } from 'ui.analytics';

// @vue/component
export const RecoveryCodes = {
	components: {
		RecoveryCodeInput,
		Captcha,
		Headline,
	},
	props: {
		rootNode: {
			type: HTMLElement,
			default: null,
		},
		authUrl: {
			type: String,
			required: true,
		},
		captchaCode: {
			type: String,
			default: '',
		},
		recoveryCodesHelpLink: {
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
			recoveryCode: '',
			isRecoveryCodeBlockVisible: true,
			isCaptchaBlockVisible: false,
		};
	},
	mounted()
	{
		BX.UI.Hint.init(this.rootNode);
		sendData({
			tool: 'security',
			category: 'fa_auth_form',
			event: 'form_code_show',
		});
	},
	methods: {
		onSubmitForm(event)
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
		onRecoveryCodeChange(code)
		{
			this.recoveryCode = code;
		},
		onRecoveryCodeComplete(code)
		{
			this.recoveryCode = code;
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
			this.isRecoveryCodeBlockVisible = false;
			this.isCaptchaBlockVisible = true;
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP"/>
			<input type="hidden" name="USER_OTP" :value="recoveryCode"/>
			<input type="hidden" name="CURRENT_STEP" value="recoveryCodes"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isRecoveryCodeBlockVisible" class="intranet-island-otp-push-recovery-codes__wrapper">
				<div @click="showPushOtp" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --recovery"></i>
				</div>

				<Headline size='lg' class="intranet-form-title --padding">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<span class="intranet-island-otp-push-recovery-codes__description">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_INPUT_RECOVERY_CODE') }}
				</span>
				<a class="intranet-island-otp-push__link --underline" :href="recoveryCodesHelpLink" target="_blank">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_MORE') }}
				</a>
				<RecoveryCodeInput 
					:code="recoveryCode"
					:error="errorMessage"
					@code-change="onRecoveryCodeChange"
					@code-complete="onRecoveryCodeComplete"
				></RecoveryCodeInput>
				<div class="intranet-otp-error-block" v-html="errorMessage"></div>

				<button
					class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success --wide"
					type="submit"
					@click="onSubmitForm($event)"
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
