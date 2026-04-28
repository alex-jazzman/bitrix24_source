import { Captcha } from './captcha';
import { Headline } from 'ui.system.typography.vue';
import { Ajax } from '../api/ajax';
import { sendData } from 'ui.analytics';
import { usePushOtpStore } from '../store/push-otp-store';
import { useOtpCaptchaFlow } from '../composables/use-otp-captcha-flow';

// @vue/component

export const PushOtp = {
	components: {
		Captcha,
		Headline,
	},
	setup()
	{
		const store = usePushOtpStore();

		return {
			store,
		};
	},
	props: {
		pushOtpConfig: {
			type: Object,
			default: null,
		},
		authUrl: {
			type: String,
			required: true,
		},
		rememberOtp: {
			type: Boolean,
			default: false,
		},
		captchaCode: {
			type: String,
			default: '',
		},
		userDevice: {
			type: Object,
			default: () => ({}),
		},
		errorMessage: {
			type: String,
			default: null,
		},
		isAlternativeMethodsAvailable: {
			type: Boolean,
			default: false,
		},
	},
	data()
	{
		const userDevice = this.userDevice ?? {};

		return {
			isPushBlockVisible: true,
			isCaptchaBlockVisible: false,
			isUserDeviceVisible: (Object.keys(userDevice).length > 0),
			isRememberChecked: localStorage.getItem('OTP_REMEMBER_CHECKED') === 'Y',
		};
	},
	computed: {
		deviceIconClass()
		{
			return this.userDevice?.icon
				? `intranet-island-otp__device-icon--${this.userDevice.icon}`
				: '';
		},
		isCountdownVisible()
		{
			return this.store.isCountdownVisible;
		},
		isPushDisabled()
		{
			return this.store.isPushDisabled;
		},
		cooldownSecondsLeft()
		{
			return this.store.cooldownSecondsLeft;
		},
	},
	mounted()
	{
		sendData({
			tool: 'security',
			category: 'fa_auth_form',
			event: 'show',
		});
	},
	methods: {
		...useOtpCaptchaFlow({
			mainBlockVisibleKey: 'isPushBlockVisible',
		}),
		repeatPush()
		{
			if (this.store.isPushDisabled || !this.pushOtpConfig)
			{
				return;
			}

			const cooldownSeconds = this.store.getCooldownSeconds(this.pushOtpConfig);
			Ajax.sendMobilePush(this.pushOtpConfig.channelTag)
				.then(() => {
					this.store.startCooldown(cooldownSeconds);
				})
				.catch(() => {
					this.store.startCooldown(cooldownSeconds);
				});
		},
		showAlternatives()
		{
			if (this.isAlternativeMethodsAvailable)
			{
				this.$emit('show-alternatives');
			}
			else
			{
				this.$emit('show-recover-access');
			}
			sendData({
				tool: 'security',
				category: 'fa_auth_form',
				event: 'other_type_click',
			});
		},
		onRememberChange(event)
		{
			this.isRememberChecked = event.target.checked;
			if (this.isRememberChecked)
			{
				localStorage.setItem('OTP_REMEMBER_CHECKED', 'Y');
			}
			else
			{
				localStorage.removeItem('OTP_REMEMBER_CHECKED');
			}
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="USER_OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isPushBlockVisible" class="intranet-island-otp-push__wrapper">
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_AUTH') }}
				</Headline>
				<div v-if="errorMessage" class="intranet-otp-error-block" v-html="errorMessage"></div>
				<div class="intranet-island-otp-push__main-content">
					<div class="intranet-island-otp-push__description">
						<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_PUSH_SENDED") }}</span>
						<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_CONFIRM_TEXT") }}</span>
						<div class="intranet-island-otp-push__arrow"
							 :class="{ '--low': !isUserDeviceVisible }"
						>
						</div>
						<div v-if="isUserDeviceVisible" class="intranet-island-otp__device-row">
							<div class="intranet-island-otp__device-icon"
								 :class="deviceIconClass"
							></div>
							{{ this.userDevice.model }}
						</div>
						<div v-if="rememberOtp" class="intranet-base-checkbox intranet-password-enter-form__remember-me">
							<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"
								:checked="isRememberChecked"
								@change="onRememberChange"
							/>
							<label for="OTP_REMEMBER" class="login-item-checkbox-label">
								{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
							</label>
						</div>
					</div>
					<div class="intranet-island-otp-push__mobile"></div>
				</div>
				<div class="intranet-island-otp-push-links__wrapper">
					<span 
						data-testid="bx-intranet-2fa-main-push-resend-push-link"
						class="intranet-island-otp-push__link --repeat-push" 
						:class="{ '--disabled': isPushDisabled }"
						@click="repeatPush"
					>
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RESEND_PUSH') }}
						<template v-if="isCountdownVisible">
							({{ cooldownSecondsLeft }})
						</template>
					</span>
					<span data-testid="bx-intranet-2fa-main-alternative-way" class="intranet-island-otp-push__link" @click="showAlternatives">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY') }}
					</span>
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
