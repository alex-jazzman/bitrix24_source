import { PRESET_TITLE_ICONS } from '../../constants';

// eslint-disable-next-line no-unused-vars
import type { TitleIconItem } from '../../types';

// @vue/component
export const TitleIconComponent = {
	name: 'TitleIconComponent',
	props: {
		/** @type TitleIconItem */
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		currentIconCssClass(): string
		{
			return PRESET_TITLE_ICONS[this.item.icon] || PRESET_TITLE_ICONS.IMAGE;
		},
	},
	template: `
		<div class="bizproc-setup-template__heading --icon">
			<i class="ui-icon-set" :class="'--' + currentIconCssClass"></i>
			<div class="bizproc-setup-template__heading-text">
				{{ item.text }}
			</div>
		</div>

	`,
};
