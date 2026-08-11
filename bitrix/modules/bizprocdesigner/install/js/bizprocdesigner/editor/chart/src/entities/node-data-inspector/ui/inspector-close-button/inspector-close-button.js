import { BIcon, Outline } from 'ui.icon-set.api.vue';

import './inspector-close-button.css';

// @vue/component
export const InspectorCloseButton = {
	name: 'InspectorCloseButton',
	components: {
		BIcon,
	},
	computed: {
		iconName: (): string => Outline.CROSS_L,
	},
	template: `
		<div class="node-data-inspector-close-button">
			<BIcon :name="iconName" :size="20"/>
		</div>
	`,
};
