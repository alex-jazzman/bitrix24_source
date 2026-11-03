import { defineComponent } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { TextLg, TextSm } from 'ui.system.typography.vue';
import { loc } from '../utils/loc';

// @vue/component
export const ProviderBadge = defineComponent({
	name: 'provider-badge',

	components: {
		UiButton,
		TextLg,
		TextSm,
	},

	props: {
		iconKey: { type: String, default: 'other' },
		title: { type: String, required: true },
		email: { type: String, default: '' },
		avatar: { type: String, default: '' },
		buttonText: { type: String, default: '' },
		buttonDisabled: { type: Boolean, default: false },
		secondaryButtonText: { type: String, default: '' },
		secondaryButtonDisabled: { type: Boolean, default: false },
	},

	emits: ['button-click', 'secondary-button-click', 'avatar-error'],

	setup()
	{
		return {
			AirButtonStyle,
			loc,
		};
	},

	data()
	{
		return { failedAvatar: '' };
	},

	computed: {
		showAvatar(): boolean
		{
			return Boolean(this.avatar) && this.avatar !== this.failedAvatar;
		},
	},

	watch: {
		avatar(): void
		{
			this.failedAvatar = '';
		},
	},

	methods: {
		onAvatarError(event: Event): void
		{
			const url = (event.target as HTMLImageElement).getAttribute('src') ?? '';
			if (url === this.avatar)
			{
				this.failedAvatar = url;
				this.$emit('avatar-error', url);
			}
		},

		onButtonClick(): void
		{
			this.$emit('button-click');
		},

		onSecondaryButtonClick(): void
		{
			this.$emit('secondary-button-click');
		},
	},

	// language=Vue
	template: `
		<div class="mail-config-form__provider-badge" data-test-id="mail_config-form__provider-badge">
			<div class="mail-provider-img-container">
				<div :class="'mail-provider-' + iconKey + '-img'"></div>
			</div>
			<template v-if="showAvatar">
				<div class="mail-config-form__provider-divider"></div>
				<div class="mail-config-form__provider-account">
					<img
						:key="avatar"
						class="mail-config-form__provider-avatar"
						:src="avatar"
						alt=""
						data-test-id="mail_config-form__provider-avatar"
						@error="onAvatarError"
					/>
					<TextLg
						v-if="email"
						:accent="true"
					>
						{{ email }}
					</TextLg>
				</div>
			</template>
			<div v-else class="mail-config-form__provider-info">
				<TextLg
					:accent="true"
				>
					{{ title }}
				</TextLg>
				<TextSm
					v-if="email"
					className="mail-config-form__provider-email"
				>
					{{ email }}
				</TextSm>
			</div>
			<div
				v-if="buttonText || secondaryButtonText"
				class="mail-config-form__provider-action"
				data-id="mail-config-form-provider-action"
				data-test-id="mail_config-form__provider-action"
			>
				<span
					v-if="secondaryButtonText"
					data-id="mail-config-form-provider-reauthorization"
					data-test-id="mail_config-form__provider-reauthorization"
				>
					<UiButton
						:text="secondaryButtonText"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						:disabled="secondaryButtonDisabled"
						:dataset="{ testId: 'mail_config-form__provider-reauthorization_button' }"
						@click="onSecondaryButtonClick"
					/>
				</span>
				<UiButton
					v-if="buttonText"
					:text="buttonText"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:disabled="buttonDisabled"
					:dataset="{ testId: 'mail_config-form__provider-action_button' }"
					@click="onButtonClick"
				/>
			</div>
		</div>
	`,
});
