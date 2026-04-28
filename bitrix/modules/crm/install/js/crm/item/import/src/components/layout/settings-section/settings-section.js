import { BitrixVueComponentProps } from 'ui.vue3';
import { Delimiter } from '../delimiter/delimiter';

import './settings-section.css';

export const SettingsSection: BitrixVueComponentProps = {
	name: 'SettingsSection',

	components: {
		Delimiter,
	},

	props: {
		title: {
			type: String,
			required: true,
		},
		isDelimiterEnabled: {
			type: Boolean,
			default: () => true,
		},
	},

	template: `
		<div class="crm-item-import__settings-section">
			<div class="crm-item-import__settings-section-container">
				<div class="crm-item-import__settings-section-title">
					{{ title }}
				</div>
			</div>
			<Delimiter v-if="isDelimiterEnabled" />
			<div class="crm-item-import__settings-section-content">
				<slot />
			</div>
		</div>
	`,
};
