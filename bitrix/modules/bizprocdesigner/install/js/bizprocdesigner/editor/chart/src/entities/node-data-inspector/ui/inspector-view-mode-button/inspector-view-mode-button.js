import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import './style.css';

// @vue/component
export const InspectorViewModeButton = {
	name: 'InspectorViewModeButton',
	components: {
		Chip,
	},
	props: {
		isActive: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			required: true,
		},
	},
	computed: {
		design(): string
		{
			return this.isActive ? ChipDesign.OutlineAccent2 : ChipDesign.Outline;
		},
		ChipSize: (): typeof ChipSize => ChipSize,
	},
	template: `
		<Chip 
			:text="title"
			:size="ChipSize.Md"
			:design="design"
		/>
	`,
};
