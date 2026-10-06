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
		<button
			type="button"
			class="node-data-inspector-close-button"
			:data-test-id="$testId('nodeDataInspectorClose')"
			:aria-label="$Bitrix.Loc.getMessage('BIZPROCDESIGNER_DEBUG_BAR_LAYOUT_CLOSE_TITLE')"
		>
			<BIcon :name="iconName" :size="20" aria-hidden="true"/>
		</button>
	`,
};
