import { Outline } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';
import type { HintParams } from 'ui.vue3.directives.hint';
import { hint } from 'ui.vue3.directives.hint';

import { tooltip } from 'tasks.v2.component.elements.hint';

import { ActionButton } from './action-button';

// @vue/component
export const CheckList = {
	name: 'TaskDescriptionCheckList',
	components: {
		ActionButton,
		Outline,
		TextSm,
	},
	directives: { hint },
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
		title(): string
		{
			return (
				this.loading
					? this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_CREATING')
					: this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_TITLE')
			);
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_DESCRIPTION_ACTION_CHECK_LIST_HINT'),
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
				},
			});
		},
	},
	template: `
		<div class="tasks-card-description-action-check-list" v-hint="tooltip">
			<div :class="{ 'tasks-card-description-action-check-list-spinner': loading }">
				<ActionButton
					:iconName="loading ? Outline.AI_STARS : Outline.LIST_AI"
					:iconColor="buttonColor"
					:iconSize="loading ? 20 : null"
				/>
			</div>
			<TextSm class="tasks-card-description-action-check-list-label">
				{{ title }}
			</TextSm>
		</div>
	`,
};
