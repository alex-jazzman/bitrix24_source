import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './settings-label.css';

// @vue/component
export const SettingsLabel = {
	name: 'UiSettingsLabel',
	components: {
		BIcon,
	},
	props: {
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		label(): string
		{
			return this.ariaLabel || this.loc('TASKS_V2_SETTINGS_ARIA_LABEL');
		},
	},
	template: `
		<button type="button" class="b24-settings-label" :aria-label="label">
			<BIcon :name="Outline.FILTER_2_LINES" hoverable aria-hidden="true"/>
		</button>
	`,
};
