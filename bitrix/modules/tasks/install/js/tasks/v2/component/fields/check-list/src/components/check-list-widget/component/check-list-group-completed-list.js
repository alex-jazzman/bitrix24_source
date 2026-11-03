import { BIcon, Actions, Outline } from 'ui.icon-set.api.vue';

import 'ui.icon-set.actions';
import 'ui.icon-set.outline';

// @vue/component
export const CheckListGroupCompletedList = {
	name: 'CheckListGroupCompletedList',
	components: {
		BIcon,
	},
	props: {
		totalCompletedParents: {
			type: Number,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Actions,
			Outline,
		};
	},
	computed: {
		completedParentsLabel(): string
		{
			return this.loc(
				'TASKS_V2_CHECK_LIST_PREVIEW_COMPLETED',
				{ '#number#': this.totalCompletedParents },
			);
		},
	},
	template: `
		<button type="button" class="check-list-widget-group-completed-list" data-testid="tasks-check-list-group-completed-btn">
			<div class="check-list-widget-group-completed-list-icon">
				<BIcon :name="Outline.CHECK_L" aria-hidden="true"/>
			</div>
			<div class="check-list-widget-group-completed-list-title">
				{{ completedParentsLabel }}
			</div>
			<div class="check-list-widget-group-completed-list-action print-ignore">
				<BIcon :name="Actions.CHEVRON_RIGHT" aria-hidden="true"/>
			</div>
		</button>
	`,
};
