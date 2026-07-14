import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import '../css/close-icon.css';

// @vue/component
export const CloseIcon = {
	name: 'CloseIcon',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	template: `
		<div class="bx-im-list-container-slider__close-container">
			<BIcon
				:name="OutlineIcons.CHEVRON_LEFT_L"
				:hoverable="true"
				class="bx-im-list-container-slider__close-icon"
			/>
		</div>
	`,
};
