import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './settings-label.css';

// @vue/component
export const SettingsLabel = {
	name: 'UiSettingsLabel',
	components: {
		BIcon,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="b24-settings-label">
			<BIcon :name="Outline.SETTINGS" hoverable/>
		</div>
	`,
};
