import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskList } from 'tasks.v2.component.task-list';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { parentTaskMeta } from './parent-task-meta';
import { parentTaskDialog } from './parent-task-dialog';

import './parent-task.css';

// @vue/component
export const ParentTask = {
	name: 'TaskParentTask',
	components: {
		BIcon,
		TaskList,
		TextMd,
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
			parentTaskMeta,
			subTasksService,
		};
	},
	computed: {
		parentId(): number
		{
			return this.task.parentId;
		},
		hasParent(): boolean
		{
			return idUtils.isReal(this.parentId);
		},
		title(): string
		{
			if (idUtils.isTemplate(this.parentId))
			{
				return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE');
			}

			return this.loc('TASKS_V2_PARENT_TASK_TITLE');
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_PARENT_TASK_SELECT'),
				popupOptions: {
					offsetLeft: this.$refs.add.$el.offsetWidth / 2,
				},
			});
		},
	},
	watch: {
		parentId: {
			immediate: true,
			handler(): void
			{
				if (this.hasParent)
				{
					void subTasksService.getParent(this.taskId, this.parentId);
				}
			},
		},
	},
	methods: {
		handleEditClick(): void
		{
			parentTaskDialog.show({
				targetNode: this.$refs.add.$el,
				taskId: this.taskId,
			});
		},
		async handleRemoveParentTask(): void
		{
			await subTasksService.setParent(this.taskId, 0);
		},
	},
	template: `
		<div class="tasks-field-parent-task" :data-task-id="taskId" :data-task-field-id="parentTaskMeta.id">
			<div class="tasks-field-parent-task-title">
				<div class="tasks-field-parent-task-main" :class="{ '--readonly': true }">
					<BIcon :name="Outline.SUBTASK"/>
					<TextMd accent>{{ title }}</TextMd>
				</div>
				<div v-if="task.rights.edit" v-hint="tooltip" class="tasks-field-parent-task-edit-container">
					<BIcon
						class="tasks-field-parent-task-icon"
						:name="Outline.PLUS_L"
						hoverable
						:data-task-relation-add="parentTaskMeta.id"
						ref="add"
						@click="handleEditClick"
					/>
				</div>
			</div>
			<TaskList
				v-if="hasParent"
				:ids="hasParent ? [parentId] : []"
				:loadingIds="!subTasksService.hasStoreTask(parentId) ? [parentId] : []"
				@removeTask="handleRemoveParentTask"
			/>
		</div>
	`,
};
