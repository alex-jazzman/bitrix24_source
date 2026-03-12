import { Outline } from 'ui.icon-set.api.vue';

import { Core } from 'tasks.v2.core';

import { ActionButton } from 'tasks.v2.component.entity-text';

// @vue/component
export const CheckList = {
	name: 'TaskDescriptionCheckList',
	components: {
		ActionButton,
		Outline,
	},
	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		buttonColor(): string
		{
			return 'var(--ui-color-copilot-primary)';
		},
		iconName(): string
		{
			return this.loading ? Outline.AI_STARS : Outline.LIST_AI;
		},
		title(): string
		{
			return this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_HINT_MSGVER_1', {
				'#COPILOT_NAME#': Core.getParams().copilotName,
			});
		},
		copilotText(): string
		{
			return (
				this.loading
					? this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_CREATING')
					: this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_TITLE')
			);
		},
	},
	template: `
		<ActionButton
			:iconColor="buttonColor"
			:iconSize="loading ? 20 : null"
			:iconName
			:title
			:copilotText
		/>
	`,
};
