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
	methods: {
		openTaskInNewTab(): void
		{
			const newWindowUrl = this.urlTaskCard;
			Object.assign(document.createElement('a'), {
				target: '_blank',
				href: newWindowUrl,
			}).click();
		},
		handleClickOpener(): void
		{
			this.openTaskInNewTab();
		},
	},
	template: `
		<button
			class="tasks-opener-full-card"
			@click="handleClickOpener"
		>
			<BIcon
				:name="Outline.GO_TO_L"
				class="tasks-opener-full-card__icon"
				hoverable
			/>
			<span class="tasks-opener-full-card__text">{{ loc('TASKS_V2_TASK_FULL_CARD_OPEN_TASK_NEW_TAB') }}</span>
		</button>
	`,
};
