import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import '../css/close-icon.css';

// @vue/component
export const CloseIcon = {
	name: 'CloseIcon',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			type="button"
			class="bx-im-list-container-slider__close-container"
			:aria-label="loc('IM_LIST_SLIDER_CLOSE_BUTTON_ARIA_LABEL')"
		>
			<BIcon
				:name="OutlineIcons.CHEVRON_LEFT_L"
				class="bx-im-list-container-slider__close-icon"
				aria-hidden="true"
			/>
		</button>
	`,
};
