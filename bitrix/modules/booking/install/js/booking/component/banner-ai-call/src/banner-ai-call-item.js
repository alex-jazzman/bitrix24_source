import { BIcon as Icon } from 'ui.icon-set.api.vue';

// @vue/component
export const BannerAiCallItem = {
	components: {
		Icon,
	},
	props: {
		text: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="booking-banner__ai-call-popup_item">
			<Icon :name="icon" />
			<span>{{ text }}</span>
		</div>
	`,
};
