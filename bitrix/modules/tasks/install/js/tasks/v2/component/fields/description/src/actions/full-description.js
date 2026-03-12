import { Outline } from 'ui.icon-set.api.vue';

import { ActionButton } from 'tasks.v2.component.entity-text';

// @vue/component
export const FullDescription = {
	name: 'TaskFullDescription',
	components: {
		ActionButton,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<ActionButton
			:iconName="Outline.GO_TO_L"
			:title="loc('TASKS_V2_DESCRIPTION_BUTTON_EXPAND')"
		/>
	`,
};
