import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { tooltip } from 'tasks.v2.component.elements.hint';
import { TaskCard } from 'tasks.v2.application.task-card';
import type { TaskModel } from 'tasks.v2.model.tasks';

// @vue/component
export const OpenFullCard = {
	components: {
		BIcon,
	},
	directives: { hint },
	inject: {
		taskId: {},
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	computed: {
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_TASK_FULL_CARD_OPEN_FULL'),
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
				},
				timeout: 500,
			});
		},
		link(): string
		{
			return TaskCard.getUrl(this.taskId);
		},
	},
	template: `
		<a :href="link" class="tasks-full-card-header-open-full" v-hint="tooltip">
			<BIcon :name="Outline.GO_TO_L" hoverable/>
		</a>
	`,
};
