import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskCard } from 'tasks.v2.application.task-card';
import { type TaskModel } from 'tasks.v2.model.tasks';

import './tasks-opener-full-card.css';

// @vue/component
export const TasksOpenerFullCard = {
	components: {
		BIcon,
	},
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
		urlTaskCard(): string
		{
			return TaskCard.getUrl(this.taskId);
		},
	},
	template: `
		<a
			class="tasks-opener-full-card"
			:href="urlTaskCard"
			target="_blank"
			rel="noopener"
			data-slider-ignore-autobinding="true"
		>
			<BIcon
				:name="Outline.GO_TO_L"
				class="tasks-opener-full-card__icon"
				aria-hidden="true"
				hoverable
			/>
			<span class="tasks-opener-full-card__text">{{ loc('TASKS_V2_TASK_FULL_CARD_OPEN_TASK_NEW_TAB') }}</span>
		</a>
	`,
};
