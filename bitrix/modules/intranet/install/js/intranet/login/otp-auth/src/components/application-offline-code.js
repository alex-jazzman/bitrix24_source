import { Captcha } from './captcha';
import { Headline } from 'ui.system.typography.vue';
import { VerificationCode } from './verification-code';
import { useOtpCaptchaFlow } from '../composables/use-otp-captcha-flow';

export const ApplicationOfflineCode = {
	components: {
		Captcha,
		Headline,
		VerificationCode,
	},
	props: {
		authUrl: {
			type: String,
			required: true,
		},
		errorMessage: {
			type: String,
			default: null,
		},
		captchaCode: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			isWaiting: false,
			isCaptchaBlockVisible: false,
			isMainBlockVisible: true,
			code: '',
		};
	},
	methods: {
		...useOtpCaptchaFlow({
			mainBlockVisibleKey: 'isMainBlockVisible',
		}),
		onSubmitForm(event)
		{
			this.handleFormSubmit(event);
		},
		onCodeChange(code)
		{
			this.code = code;
		},
		onCodeComplete(code)
		{
			this.code = code;
			this.handleCodeComplete(code);
		},
		showAlternativeMethods() {
			this.$emit('clear-errors');
			this.$emit('show-alternatives');
		},
		getStep3Text(): string {
			return this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_3', {
				'#MORE_ICON#': "<div class='intranet-island-otp-offline-code__icon-more'><i class='ui-icon-set --more-l'></i></div>",
			});
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="USER_OTP" :value="code"/>
			<input type="hidden" name="CURRENT_STEP" value="applicationOfflineCode"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isMainBlockVisible" class="intranet-island-otp-push__wrapper">
				<div @click="showAlternativeMethods" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --offline-code"></i>
				</div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<div class="intranet-island-otp-offline-code__main-content">
					<div class="intranet-island-otp-offline-code__description">
						<div class="intranet-island-otp-offline-code__steps">
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									1
								</div>
								<div class="intranet-island-otp-offline-code-step__title">
									{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_1') }}
								</div>
							</div>
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									2
								</div>
								<div class="intranet-island-otp-offline-code-step__title">
									{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_2') }}
								</div>
							</div>
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									3
								</div>
								<div v-html="getStep3Text()" class="intranet-island-otp-offline-code-step__title"></div>
							</div>
						</div>
						<VerificationCode
							:code="code"
							:label="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_INPUT_LABEL')"
							:isPhoneCode=true
							:enableSpacing=false
							:error="errorMessage"
							@code-change="onCodeChange"
							@code-complete="onCodeComplete"
						></VerificationCode>
					</div>
					<div class='intranet-island-otp-push__arrow --offline-code'></div>
					<div class="intranet-island-otp-offline-code__mobile"></div>
					<div class="intranet-island-otp-offline-code__button-wrapper">
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
				</div>
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
