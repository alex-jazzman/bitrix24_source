import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskList } from 'tasks.v2.component.task-list';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { restoreOpenerFocus } from 'tasks.v2.lib.entity-selector-dialog';
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
	data(): Object
	{
		return {
			isDialogShown: false,
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
		addLabel(): string
		{
			return this.loc('TASKS_V2_PARENT_TASK_SELECT');
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.addLabel,
				popupOptions: {
					offsetLeft: this.$refs.add.offsetWidth / 2,
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
			this.isDialogShown = true;
			parentTaskDialog.show({
				targetNode: this.$refs.add,
				taskId: this.taskId,
				withTemplates: !this.task.replicate && !this.task.isForNewUser,
				onClose: this.handleDialogClose,
			});
		},
		handleDialogClose(): void
		{
			this.isDialogShown = false;
			restoreOpenerFocus(this.$refs.add);
		},
		async handleRemoveParentTask(): void
		{
			await subTasksService.setParent(this.taskId, 0);
		},
	},
	template: `
		<div class="tasks-field-parent-task print-no-box-shadow" :data-task-id="taskId" :data-task-field-id="parentTaskMeta.id">
			<div class="tasks-field-parent-task-title">
				<div class="tasks-field-parent-task-main" :class="{ '--readonly': true }">
					<BIcon :name="Outline.SUBTASK" aria-hidden="true"/>
					<TextMd accent>{{ title }}</TextMd>
				</div>
				<div v-if="task.rights.edit" v-hint="tooltip" class="tasks-field-parent-task-edit-container print-ignore">
					<button
						type="button"
						class="tasks-field-parent-task-icon"
						aria-haspopup="dialog"
						:aria-expanded="isDialogShown"
						:aria-label="addLabel"
						:data-task-relation-add="parentTaskMeta.id"
						ref="add"
						@click="handleEditClick"
					>
						<BIcon :name="Outline.PLUS_L" hoverable aria-hidden="true"/>
					</button>
				</div>
			</div>
			<div v-if="hasParent" role="group" :aria-label="title">
				<TaskList
					:ids="hasParent ? [parentId] : []"
					:loadingIds="!subTasksService.hasStoreTask(parentId) ? [parentId] : []"
					:shouldShowSubTasksOption="false"
					@removeTask="handleRemoveParentTask"
				/>
			</div>
		</div>
	`,
};
