import { Headline } from 'ui.system.typography.vue';
// @vue/component
export const Captcha = {
	components: {
		Headline,
	},
	props: {
		captchaCode: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			isWaiting: false,
		};
	},
	computed: {
		getCaptchaSrc(): string
		{
			return `/bitrix/tools/captcha.php?captcha_sid=${this.captchaCode}`;
		},
	},
	methods: {
		onSubmitForm()
		{
			this.isWaiting = true;
		},
	},
	template: `
		<div class="intranet-island-otp-captcha__wrapper">
			<Headline size='md' class="intranet-form-add-block__headline --margin">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT') }}
			</Headline>
			<div class="intranet-text-captcha_item">
				<input type="hidden" name="captcha_sid" :value="captchaCode" class="login-inp"/>
				<img :src="getCaptchaSrc" width="180" height="40" alt="CAPTCHA"/>
			</div>
			<div class="intranet-text-input intranet-login-enter-form__login">
				<input
					type="text"
					name="captcha_word"
					:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT')"
					maxlength="50"
					value=""
					class="ui-ctl-element intranet-text-input__field"
				/>
			</div>
	
			<button
				class="intranet-text-btn ui-btn ui-btn-lg ui-btn-success --wide"
				type="submit"
				@click="onSubmitForm"
			>
				<span class="intranet-text-btn__content-wrapper">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
				</span>
				<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
			</button>
		</div>
	`,
};
