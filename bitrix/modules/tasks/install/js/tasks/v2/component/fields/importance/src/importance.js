import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { tooltip } from 'tasks.v2.component.elements.hint';

import type { TaskModel } from 'tasks.v2.model.tasks';

import './importance.css';

// @vue/component
export const Importance = {
	components: {
		BIcon,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	computed: {
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		tooltip(): Function
		{
			const phraseCode = this.task.isImportant
				? 'TASKS_V2_IMPORTANCE_ACTIVE_HINT'
				: 'TASKS_V2_IMPORTANCE_INACTIVE_HINT'
			;

			return (): HintParams => tooltip({
				html: this.loc(phraseCode, { '[br/]': '<br/>' }),
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
				},
				timeout: 500,
			});
		},
		isResponsible(): boolean
		{
			const userId = Core.getParams().currentUser.id;

			return this.task.responsibleIds.includes(userId) || this.task.accomplicesIds.includes(userId);
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.readonly)
			{
				return;
			}

			const isImportant = !this.task.isImportant;

			void taskService.update(this.taskId, { isImportant });
		},
	},
	template: `
		<div
			v-if="!readonly || (isResponsible && task.isImportant)"
			v-hint="tooltip"
			class="tasks-field-importance"
			:class="{ '--active': task.isImportant, '--readonly': readonly }"
			:data-task-id="taskId"
			:data-task-field-id="'isImportant'"
			:data-task-field-value="task.isImportant"
			@click="handleClick"
		>
			<BIcon :name="task.isImportant ? Outline.FIRE_SOLID : Outline.FIRE"/>
		</div>
	`,
};
