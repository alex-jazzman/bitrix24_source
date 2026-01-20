import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import type { TaskModel } from 'tasks.v2.model.tasks';

export const DatePlanContent = {
	components: {
		HoverPill,
		FieldAdd,
		QuestionMark,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	template: `
		<HoverPill v-if="task.matchesSubTasksTime" textOnly readonly>
			<div class="tasks-field-date-plan-content">
				<div>{{ loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME_STATE') }}</div>
				<QuestionMark :hintText="loc('TASKS_V2_DATE_PLAN_NO_SUBTASKS_HINT')"/>
			</div>
		</HoverPill>
		<FieldAdd v-else :icon="Outline.PLANNING"/>
	`,
};
