import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import './css/value-chip.css';

// @vue/component
export const NotificationFilterValueChip = {
	name: 'NotificationFilterValueChip',
	components: { Chip },
	props: {
		text: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
	},
	emits: ['clear'],
	computed: {
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
	},
	template: `
		<Chip
			class="bx-im-notification-filter_search-value__chip-container"
			:size="ChipSize.Xs"
			:design="ChipDesign.Tinted"
			:text="text"
			:withClear="true"
			:title="title"
			:compact="false"
			@clear="$emit('clear')"
		/>
	`,
};
