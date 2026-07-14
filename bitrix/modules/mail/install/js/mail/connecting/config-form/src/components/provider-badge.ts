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
	},

	emits: ['button-click'],

	setup()
	{
		return {
			AirButtonStyle,
			loc,
		};
	},

	computed: {
		avatarStyle(): { backgroundImage: string } | null
		{
			return this.avatar ? { backgroundImage: `url("${encodeURI(this.avatar)}")` } : null;
		},
	},

	methods: {
		onButtonClick(): void
		{
			this.$emit('button-click');
		},
	},

	// language=Vue
	template: `
		<div class="mail-config-form__provider-badge" data-test-id="mail_config-form__provider-badge">
			<div class="mail-provider-img-container">
				<div :class="'mail-provider-' + iconKey + '-img'"></div>
			</div>
			<template v-if="avatar">
				<div class="mail-config-form__provider-divider"></div>
				<div class="mail-config-form__provider-account">
					<div
						class="mail-config-form__provider-avatar"
						:style="avatarStyle"
						data-test-id="mail_config-form__provider-avatar"
					></div>
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
				v-if="buttonText"
				class="mail-config-form__provider-action"
				data-id="mail-config-form-provider-action"
				data-test-id="mail_config-form__provider-action"
			>
				<UiButton
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
