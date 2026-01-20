// @vue/component
import { Headline } from 'ui.system.typography.vue';
import { sendData } from 'ui.analytics';

export const RecoverAccess = {
	components: {
		Headline,
	},
	props: {
		isAlternativeMethodsAvailable: {
			type: Boolean,
			default: false,
		},
	},
	mounted() {
		sendData({
			tool: 'security',
			category: 'fa_auth_form',
			event: 'restore_access_show',
		});
	},
	methods: {
		showAlternatives()
		{
			if (this.isAlternativeMethodsAvailable)
			{
				this.$emit('show-alternatives');
			}
			else
			{
				this.$emit('back-to-push');
			}
		},
	},
	template: `
		<div class="intranet-island-otp-recover-access__wrapper">
			<Headline size='lg' class="intranet-form-title">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TITLE') }}
			</Headline>
			<div class="intranet-island-otp-recover-access__description --width">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TEXT') }}
			</div>
			<div class="intranet-island-revover-access-links__wrapper">
				<span class="intranet-island-recover-access__link" @click="showAlternatives">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY') }}
				</span>
			</div>
		</div>
	`,
};
