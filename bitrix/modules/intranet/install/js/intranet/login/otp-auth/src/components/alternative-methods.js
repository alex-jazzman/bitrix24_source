// @vue/component
import { Headline } from 'ui.system.typography.vue';
import { sendData } from 'ui.analytics';

export const AlternativeMethods = {
	components: {
		Headline,
	},
	props: {
		canLoginBySms: {
			type: Boolean,
			default: false,
		},
		isRecoveryCodesEnabled: {
			type: Boolean,
			default: false,
		},
	},
	mounted() {
		this.sendAnalytics('other_type_show');
	},
	methods: {
		showPushOtp()
		{
			this.$emit('back-to-push');
			this.sendAnalytics('choose_auth_type', 'app');
		},
		showSms()
		{
			this.$emit('show-sms');
			this.sendAnalytics('choose_auth_type', 'sms');
		},
		showRecoveryCodes()
		{
			this.$emit('show-recovery-codes');
			this.sendAnalytics('choose_auth_type', 'code');
		},
		showRecoverAccess()
		{
			this.$emit('show-recover-access');
			this.sendAnalytics('choose_auth_type', 'restore_access');
		},
		showApplicationOfflineCode()
		{
			this.$emit('application-offline-code');
			this.sendAnalytics('choose_auth_type', 'offline_code');
		},
		sendAnalytics(event, type = null)
		{
			const options = {
				tool: 'security',
				category: 'fa_auth_form',
				event,
			};

			if (type)
			{
				options.type = type;
			}

			sendData(options);
		},
	},
	template: `
		<div class="intranet-island-otp-push-alternative__wrapper">
			<div @click="showPushOtp" class="intranet-back-button">
				<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --alternative"></i>
			</div>
			<Headline size='lg' class="intranet-form-title --padding">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY_TITLE') }}
			</Headline>

			<div class="intranet-island-otp-push-alternative-items__wrapper">
				<div data-testid="bx-intranet-2fa-alternative-methods-sms" v-if="canLoginBySms" class="intranet-island-otp-push-alternative__item" @click="showSms">
					<i class="ui-icon-set --o-sms intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS') }}</span>
				</div>
				<div data-testid="bx-intranet-2fa-alternative-methods-recovery-codes" v-if="isRecoveryCodesEnabled" class="intranet-island-otp-push-alternative__item" @click="showRecoveryCodes">
					<i class="ui-icon-set --o-key intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVERY_CODES') }}</span>
				</div>
				<div data-testid="bx-intranet-2fa-alternative-methods-offline-code" class="intranet-island-otp-push-alternative__item" @click="showApplicationOfflineCode">
					<i class="ui-icon-set --o-shield-checked intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE') }}</span>
				</div>
				<span data-testid="bx-intranet-2fa-alternative-methods-recover-access" class="intranet-island-otp-push__link --gray --underline" @click="showRecoverAccess">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TITLE') }}
				</span>
			</div>
		</div>
	`,
};
