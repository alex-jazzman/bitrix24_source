// @vue/component
import { Headline } from 'ui.system.typography.vue';

export const LegacyOtp = {
	components: {
		Headline,
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
		};
	},
	mounted()
	{
		if (this.$refs.modalInput)
		{
			this.$refs.modalInput.focus();
		}
	},
	methods: {
		onSubmitForm() {
			this.isWaiting = true;
			this.$emit('form-submit');
		},
	},
	template: `
		<form name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')" />

			<div class="intranet-island-otp-push-legacy-otp__wrapper">
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_TITLE') }}
				</Headline>
				<div class="intranet-login-enter-form intranet-logging-in__login-form">
					<div v-if="errorMessage" class="intranet-login-error-block" v-html="errorMessage"></div>
					<div class="intranet-login-enter-form__login-wrapper">
						<div class="intranet-text-input intranet-login-enter-form__login">
							<input
								type="text"
								name="USER_OTP"
								class="ui-ctl-element intranet-text-input__field"
								maxlength="50"
								value=""
								autocomplete="off"
								:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PLACEHOLDER')"
								ref="modalInput"
							/>
						</div>
	
						<template v-if="captchaCode">
							<Headline size='sm' class="intranet-form-title --vertical-padding">
								{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT') }}
							</Headline>
							<div class="intranet-text-captcha_item">
								<input type="hidden" name="captcha_sid" :value="captchaCode" />
								<img :src="'/bitrix/tools/captcha.php?captcha_sid=' + captchaCode" width="180" height="40" alt="CAPTCHA" />
							</div>
							<div class="intranet-text-input intranet-login-enter-form__login">
								<input
									type="text"
									name="captcha_word"
									:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT')"
									maxlength="50"
									value=""
									autocomplete="off"
									class="ui-ctl-element intranet-text-input__field"
								/>
							</div>
						</template>
					</div>
					<button
						class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success"
						type="submit"
						@click="onSubmitForm"
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
		</form>
	`,
};
