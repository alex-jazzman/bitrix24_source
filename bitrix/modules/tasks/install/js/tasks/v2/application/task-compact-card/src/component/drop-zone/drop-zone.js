import { BIcon } from 'ui.icon-set.api.vue';
import { Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.main';

import './drop-zone.css';

// @vue/component
export const DropZone = {
	components: {
		BIcon,
	},
	setup(): Object
	{
		return {
			Main,
		};
	},
	template: `
		<div class="tasks-compact-card-drop-zone-container">
			<div class="tasks-compact-card-drop-zone">
				<BIcon :name="Main.ATTACH"/>
				<div class="tasks-compact-card-drop-zone-text">{{ loc('TASKS_V2_TCC_DROP_ZONE') }}</div>
			</div>
		</div>
	`,
};
