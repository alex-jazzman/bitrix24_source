// @vue/component
import { Headline } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UIButton, ButtonSize, ButtonState } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.core';
import { sendData } from 'ui.analytics';
import { useRecoverAccessStore } from '../store/recover-access-store';
import { Ajax } from '../api/ajax';

export const RecoverAccess = {
	components: {
		Headline,
		UIButton,
	},
	setup(): Object
	{
		const store = useRecoverAccessStore();

		return {
			store,
			ButtonSize,
			AirButtonStyle,
			ButtonState,
			Outline,
		};
	},
	props: {
		signedUserId: {
			type: String,
			default: '',
		},
		isAlternativeMethodsAvailable: {
			type: Boolean,
			default: false,
		},
		canSendRequestRecoverAccess: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		isRequesting(): boolean
		{
			return this.store.isRequesting;
		},
		isRequestSent(): boolean
		{
			return this.store.isRequestSent;
		},
	},
	mounted()
	{
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
		requestAccess(): void
		{
			this.store.setRequesting(true);
			Ajax.sendRequestRecoverAccess(this.signedUserId).then(() => {
				this.store.setRequestSent();
				this.store.setRequesting(false);
			}).catch(() => {
				this.store.setRequesting(false);
			});
			sendData({
				tool: 'security',
				category: 'fa_auth_form',
				event: 'click_admin_restore_access',
			});
		},
		resetSessionAndReload(): void
		{
			this.store.setRequesting(true);
			sendData({
				tool: 'security',
				category: 'fa_auth_form',
				event: 'click_reload_after_restore_access',
			});
			Ajax.resetOtpSession().then(() => {
				location.reload();
			}).catch(() => {
				location.reload();
			});
		},
	},
	template: `
		<div class="intranet-island-otp-recover-access__wrapper">
			<div @click="showAlternatives" class="intranet-back-button">
				<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --alternative"></i>
			</div>
			<template v-if="isRequestSent || !canSendRequestRecoverAccess">
				<div class="intranet-island-otp-recover-access__icon --request-sent"></div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_TITLE') }}
				</Headline>
				<div class="intranet-island-otp-recover-access__description --width">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_DESCRIPTION') }}
				</div>
				<UIButton
					:text="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_BUTTON')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.REFRESH"
					:state="isRequesting ? ButtonState.WAITING : ButtonState.ACTIVE"
					:wide="true"
					@click="resetSessionAndReload"
				/>
			</template>
			<template v-else>
				<div class="intranet-island-otp-recover-access__icon --request"></div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_TITLE') }}
				</Headline>
				<div class="intranet-island-otp-recover-access__description --width">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_DESCRIPTION') }}
				</div>
				<UIButton
					:text="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_BUTTON')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.FILLED"
					:state="isRequesting ? ButtonState.WAITING : ButtonState.ACTIVE"
					:wide="true"
					@click="requestAccess"
				/>
			</template>
		</div>
	`,
};
