import { mapGetters } from 'ui.vue3.vuex';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { idUtils, TaskId } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { type TaskListOptions } from 'tasks.v2.model.interface';

import { TaskLine } from '../task-line/task-line';
import { TaskLineSkeleton } from '../task-line/task-line-skeleton';
import { TaskLineExpandToggle } from '../task-line-expand-toggle/task-line-expand-toggle';

import './task-line-group.css';

// @vue/component
export const TaskLineGroup = {
	components: {
		TaskLine,
		TaskLineSkeleton,
		TaskLineExpandToggle,
	},
	inject: {
		fields: {},
		settings: {},
		shouldShowSubTasksOption: {},
		isTemplateEntities: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['remove'],
	setup(): { taskListOptions: TaskListOptions }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isExpanded: false,
		};
	},
	computed: {
		...mapGetters({
			taskListOptions: `${Model.Interface}/taskListOptions`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		subTaskIds(): number[]
		{
			return subTasksService.getSortedIds(
				this.taskId,
				this.task?.subTaskIds ?? [],
				this.taskListOptions.showCompletedSubTasks,
				this.isTemplateEntities,
			);
		},
		showSubTasksOption(): boolean
		{
			return this.isTemplate
				? this.taskListOptions.showSubTemplates
				: this.taskListOptions.showSubTasks
			;
		},
		showSubTasks(): boolean
		{
			return this.shouldShowSubTasksOption
				&& this.showSubTasksOption
				&& this.subTaskIds.length > 0
				&& this.isExpanded
			;
		},
		loadingSubTaskIds(): number[]
		{
			return this.subTaskIds.filter((id) => !subTasksService.hasStoreTask(id));
		},
		hasUnloadedSubTasks(): boolean
		{
			return this.loadingSubTaskIds.length > 0;
		},
		isTaskLineExpanded(): boolean
		{
			return this.showSubTasks && this.isExpanded;
		},
	},
	methods: {
		async toggleExpand(): Promise<void>
		{
			this.isExpanded = !this.isExpanded;

			if (!this.isExpanded)
			{
				return;
			}

			if (this.hasUnloadedSubTasks)
			{
				void subTasksService.listByIds(this.taskId, this.subTaskIds);
			}
		},
		openSubTaskGrid(taskId): void
		{
			const isLocked = this.isTemplate
				? this.settings.restrictions.templatesSubtasks.available
				: false
			;

			if (isLocked)
			{
				void showLimit({ featureId: this.settings.restrictions.templatesSubtasks.featureId });

				return;
			}

			const userId = Core.getParams().currentUser.id;

			const gridPath = this.isTemplate
				? this.settings.paths.userTemplateListPathTemplate.replace('#user_id#', userId)
				: this.settings.paths.userListTaskPathTemplate.replace('#user_id#', userId)
			;
			const relationType = this.isTemplate ? 'subTemplates' : 'subTasks';
			const relationToId = idUtils.unbox(taskId);
			const urlParams = new URLSearchParams({ relationToId, relationType });

			BX.SidePanel.Instance.open(`${gridPath}?${urlParams}`, {
				newWindowLabel: false,
				copyLinkLabel: false,
			});
		},
		isLastSubTask(subTaskId: TaskId): boolean
		{
			return this.subTaskIds[this.subTaskIds.length - 1] === subTaskId;
		},
		removeSubTask(subTaskId): void
		{
			void subTasksService.delete(this.taskId, [subTaskId]);
		},
	},
	template: `
		<template v-if="isLoading">
			<TaskLineSkeleton/>
		</template>
		<template v-else>
			<TaskLine
				:taskId
				:isExpanded="isTaskLineExpanded"
				@remove="$emit('remove', taskId)"
				@toggleSubTasks="toggleExpand"
			/>
			<template v-if="showSubTasks">
				<template v-for="subTaskId in subTaskIds" :key="subTaskId">
					<template v-if="loadingSubTaskIds.includes(subTaskId)">
						<TaskLineSkeleton
							isSubTask
							:isLastSubTask="isLastSubTask(subTaskId)"
						/>
					</template>
					<template v-else>
						<TaskLine
							:taskId="subTaskId"
							:isLastSubTask="isLastSubTask(subTaskId)"
							isSubTask
							@remove="removeSubTask(subTaskId)"
							@toggleSubTasks="openSubTaskGrid(subTaskId)"
						/>
					</template>
				</template>
				<TaskLineExpandToggle
					:text="loc('TASKS_V2_TASK_LINE_GROUP_COLLAPSE')"
					:icon="Outline.CHEVRON_TOP_M"
					extraPadding
					@click="toggleExpand"
				/>
			</template>
		</template>
	`,
};
