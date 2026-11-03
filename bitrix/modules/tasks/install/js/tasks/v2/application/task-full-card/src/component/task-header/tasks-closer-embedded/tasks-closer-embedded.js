import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { type TaskModel } from 'tasks.v2.model.tasks';

import './tasks-closer-embedded.css';

// @vue/component
export const TasksCloserEmbedded = {
	components: {
		BIcon,
	},
	props: {
		onCloseEmbedded: {
			type: Function,
			required: true,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	methods: {
		handleClickCloser(): void
		{
			this.onCloseEmbedded();
		},
	},
	template: `
		<button
			type="button"
			class="tasks-closer-embedded"
			data-testid="task-full-card-header-close-btn"
			:aria-label="loc('TASKS_V2_TASK_FULL_CARD_CLOSE')"
			@click="handleClickCloser"
		>
			<BIcon
				:name="Outline.CROSS_L"
				class="tasks-closer-embedded__icon"
				aria-hidden="true"
				hoverable
			/>
		</button>
	`,
};
