import { Captcha } from './captcha';
import { Headline } from 'ui.system.typography.vue';
import { Ajax } from '../api/ajax';
import { sendData } from 'ui.analytics';

// @vue/component

export const PushOtp = {
	components: {
		Captcha,
		Headline,
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
			default: null,
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
	data(): Object
	{
		return {
			isPushBlockVisible: true,
			isCaptchaBlockVisible: false,
			isUserDeviceVisible: (Object.keys(this.userDevice).length > 0),
			isPushDisabled: true,
			cooldownSecondsLeft: 0,
			cooldownIntervalId: null,
		};
	},
	computed: {
		deviceIconClass(): String
		{
			return `intranet-island-otp__device-icon--${this.userDevice.icon}`;
		},
		isCountdownVisible(): boolean
		{
			return this.isPushDisabled && this.cooldownSecondsLeft > 0;
		},
	},
	mounted()
	{
		if (this.pushOtpConfig)
		{
			this.initPushOtp();
		}

		const storedCooldownSeconds = this.readCooldownSecondsLeft();
		if (storedCooldownSeconds > 0)
		{
			this.startCooldown(storedCooldownSeconds, false);
		}
		else if (this.wasCooldownInitialized())
		{
			this.isPushDisabled = false;
			this.cooldownSecondsLeft = 0;
			this.clearCooldownDeadline();
		}
		else
		{
			const initialCooldown = this.getCooldownSeconds();
			if (initialCooldown > 0)
			{
				this.startCooldown(initialCooldown);
			}
			else
			{
				this.isPushDisabled = false;
				this.cooldownSecondsLeft = 0;
			}
		}
		sendData({
			tool: 'security',
			category: 'fa_auth_form',
			event: 'show',
		});
	},
	beforeUnmount()
	{
		this.stopCooldownTimer();
	},
	methods: {
		repeatPush()
		{
			if (this.isPushDisabled || !this.pushOtpConfig)
			{
				return;
			}

			Ajax.sendMobilePush(this.pushOtpConfig.channelTag)
				.then(() => {
					this.startCooldown(this.getCooldownSeconds());
				})
				.catch(() => {
					this.startCooldown(this.getCooldownSeconds());
				});
		},
		getCooldownSeconds(): number
		{
			const defaultCooldown = 5;
			const seconds = Number(this.pushOtpConfig?.cooldownSeconds);

			return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : defaultCooldown;
		},
		startCooldown(seconds, shouldPersist = true)
		{
			const cooldown = Number(seconds);

			if (!cooldown || cooldown <= 0)
			{
				this.stopCooldownTimer();
				this.isPushDisabled = false;
				this.cooldownSecondsLeft = 0;
				this.clearCooldownDeadline();

				return;
			}

			this.cooldownSecondsLeft = Math.floor(cooldown);
			this.isPushDisabled = true;
			if (shouldPersist)
			{
				this.saveCooldownDeadline(this.cooldownSecondsLeft);
			}
			this.markCooldownInitialized();

			this.stopCooldownTimer();
			this.cooldownIntervalId = setInterval(() => {
				if (this.cooldownSecondsLeft <= 1)
				{
					this.stopCooldownTimer();
					this.cooldownSecondsLeft = 0;
					this.isPushDisabled = false;
					this.clearCooldownDeadline();

					return;
				}

				this.cooldownSecondsLeft -= 1;
			}, 1000);
		},
		stopCooldownTimer()
		{
			if (this.cooldownIntervalId)
			{
				clearInterval(this.cooldownIntervalId);
				this.cooldownIntervalId = null;
			}
		},
		getCooldownStorageKey(): string
		{
			const channelTag = this.pushOtpConfig?.channelTag ?? 'default';

			return `intranet:push-otp:cooldown:${channelTag}`;
		},
		getCooldownInitKey(): string
		{
			return `${this.getCooldownStorageKey()}:initialized`;
		},
		isStorageAvailable(): boolean
		{
			try
			{
				return Boolean(window?.localStorage);
			}
			catch
			{
				return false;
			}
		},
		markCooldownInitialized(): void
		{
			if (!this.isStorageAvailable())
			{
				return;
			}

			try
			{
				window.localStorage.setItem(this.getCooldownInitKey(), '1');
			}
			catch (error)
			{
				console.error(error);
			}
		},
		wasCooldownInitialized(): boolean
		{
			if (!this.isStorageAvailable())
			{
				return false;
			}

			try
			{
				return window.localStorage.getItem(this.getCooldownInitKey()) === '1';
			}
			catch (error)
			{
				console.error(error);
			}

			return false;
		},
		saveCooldownDeadline(seconds): void
		{
			if (!this.isStorageAvailable())
			{
				return;
			}

			const deadline = Date.now() + (Number(seconds) * 1000);
			try
			{
				window.localStorage.setItem(this.getCooldownStorageKey(), String(deadline));
			}
			catch (error)
			{
				console.error(error);
			}
		},
		readCooldownSecondsLeft(): number
		{
			if (!this.isStorageAvailable())
			{
				return 0;
			}

			try
			{
				const storedValue = Number(window.localStorage.getItem(this.getCooldownStorageKey()));
				if (!Number.isFinite(storedValue))
				{
					return 0;
				}

				const diffMs = storedValue - Date.now();

				return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
			}
			catch (error)
			{
				console.error(error);
			}

			return 0;
		},
		clearCooldownDeadline(): void
		{
			if (!this.isStorageAvailable())
			{
				return;
			}

			try
			{
				window.localStorage.removeItem(this.getCooldownStorageKey());
			}
			catch (error)
			{
				console.error(error);
			}
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
		showCaptcha()
		{
			this.isPushBlockVisible = false;
			this.isCaptchaBlockVisible = true;
		},
		initPushOtp()
		{
			const BX = window.BX;
			if (!BX || !this.pushOtpConfig)
			{
				return;
			}

			const Pull = new BX.PullClient();
			Pull.subscribe({
				moduleId: 'security',
				command: 'pushOtpCode',
				callback: (params) => {
					if (params.code)
					{
						const form = document.forms.form_auth;
						if (form && form.USER_OTP)
						{
							form.USER_OTP.value = params.code;
							if (this.captchaCode)
							{
								this.showCaptcha();
							}
							else
							{
								form.submit();
							}
						}
					}
				},
			});
			Pull.start(this.pushOtpConfig.pullConfig);
		},
	},
	template: `
		<form name="form_auth" method="post" target="_top" :action="authUrl">
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
							<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"/>
							<label for="OTP_REMEMBER" class="login-item-checkbox-label">
								{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
							</label>
						</div>
					</div>
					<div class="intranet-island-otp-push__mobile"></div>
				</div>
				<div class="intranet-island-otp-push-links__wrapper">
					<span 
						class="intranet-island-otp-push__link --repeat-push" 
						:class="{ '--disabled': isPushDisabled }"
						@click="repeatPush"
					>
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RESEND_PUSH') }}
						<template v-if="isCountdownVisible">
							({{ cooldownSecondsLeft }})
						</template>
					</span>
					<span class="intranet-island-otp-push__link" @click="showAlternatives">
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
