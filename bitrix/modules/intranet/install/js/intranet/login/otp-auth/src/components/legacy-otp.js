// @vue/component
import { Headline } from 'ui.system.typography.vue';
import { useOtpCaptchaFlow } from '../composables/use-otp-captcha-flow';
import { Captcha } from './captcha';

export const LegacyOtp = {
	components: {
		Headline,
		Captcha,
	},
	props: {
		authUrl: {
			type: String,
			required: true,
		},
		authOtpHelpLink: {
			type: String,
			default: '',
		},
		authLoginUrl: {
			type: String,
			default: '',
		},
		accountChangeUrl: {
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
		userData: {
			type: Object,
			default: null,
		},
		errorMessage: {
			type: String,
			default: null,
		},
	},
	data()
	{
		return {
			isWaiting: false,
			csrfToken: null,
			isOtpBlockVisible: true,
			isCaptchaBlockVisible: false,
		};
	},
	computed: {
		photoImage(): String
		{
			return `url('${this.userData?.photoUrl}')`;
		},
	},
	mounted()
	{
		if (this.$refs.modalInput)
		{
			this.$refs.modalInput.focus();
		}
	},
	methods: {
		...useOtpCaptchaFlow({
			mainBlockVisibleKey: 'isOtpBlockVisible',
		}),
		onSubmitForm() {
			this.handleFormSubmit(event);
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')" />

			<div v-show="isOtpBlockVisible" class="intranet-island-otp-push-legacy-otp__wrapper">
				<a v-if="accountChangeUrl" :href="accountChangeUrl" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --legacyotp"></i>
				</a>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_TITLE') }}
				</Headline>
				<div class="intranet-login-enter-form intranet-logging-in__login-form">
					<div v-if="errorMessage" class="intranet-login-error-block" v-html="errorMessage"></div>
					
					<div v-if="userData" class="intranet-account-card">
						<div class="intranet-account-card__user-wrapper">
							<div class="intranet-account-card__user">
								<span class="intranet-account-card__avatar intranet-account-card__avatar--email"
									  :style="userData?.photoUrl ? { backgroundImage: photoImage } : {}"
								></span>
								<div class="intranet-account-card__details-wrapper">
									<div v-if="userData?.fullName" class="intranet-account-card__full-name">{{ userData.fullName }}</div>
									<div class="intranet-account-card__login">{{ userData.login }}</div>
								</div>
							</div>
						</div>
					</div>

					<h4 class="intranet-form-add-block__title --margin">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PLACEHOLDER') }}
					</h4>
					
					<div class="intranet-login-enter-form__login-wrapper">
						<div class="intranet-text-input intranet-login-enter-form__login">
							<input
								type="text"
								name="USER_OTP"
								class="ui-ctl-element intranet-text-input__field"
								maxlength="50"
								value=""
								autocomplete="off"
								ref="modalInput"
							/>
						</div>
					</div>
					<button
						class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success"
						type="submit"
						@click="onSubmitForm($event)"
					>
						<span class="intranet-text-btn__content-wrapper">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
						</span>
						<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
					</button>
					<div v-if="rememberOtp" class="intranet-base-checkbox intranet-password-enter-form__remember-me">
						<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"/>
						<label for="OTP_REMEMBER" class="login-item-checkbox-label">&nbsp;
							{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
						</label>
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
		<Teleport to=".intranet-body__footer-right">
			<button class="intranet-help-widget intranet-page-base__help">
				<i class="ui-icon-set intranet-help-widget__icon"></i>
				<a class="intranet-help-widget__text" :href="authOtpHelpLink">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_HELP') }}
				</a>
			</button>
		</Teleport>

		<Teleport to=".intranet-body__header-right" v-if="!notShowLinks && !isBitrix24">
			<div class="intranet-text-btn intranet-text-btn--auth">
				<a class="intranet-text-btn-link" :href="authLoginUrl" rel="nofollow">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_LINK') }}
				</a>
			</div>
		</Teleport>
	`,
};
