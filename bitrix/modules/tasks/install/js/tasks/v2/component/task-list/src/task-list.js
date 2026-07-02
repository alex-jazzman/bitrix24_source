import { Loc } from 'main.core';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Limit } from 'tasks.v2.const';

// eslint-disable-next-line import/namespace
import { TaskLineGroup } from './components/task-line-group/task-line-group';
import { TaskLineSkeleton } from './components/task-line/task-line-skeleton';
import './task-list.css';

const limit = Limit.RelationList;

// @vue/component
export const TaskList = {
	components: {
		BIcon,
		TaskLineGroup,
		TaskLineSkeleton,
	},
	provide(): Object
	{
		return {
			shouldShowSubTasksOption: this.shouldShowSubTasksOption,
			isTemplateEntities: this.isTemplateEntities,
			fields: this.fields,
		};
	},
	props: {
		ids: {
			type: Array,
			required: true,
		},
		loadingIds: {
			type: Array,
			required: true,
		},
		canOpenMore: {
			type: Boolean,
			default: true,
		},
		shouldShowSubTasksOption: {
			type: Boolean,
			default: true,
		},
		fields: {
			type: Set,
			default: new Set(['responsible', 'deadline']),
		},
		idsLoaded: {
			type: Boolean,
			default: false,
		},
		isTemplateEntities: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['openMore', 'removeTask'],
	setup(): Object
	{
		return {
			Outline,
			limit,
		};
	},
	computed: {
		limitedTasks(): number[]
		{
			return this.ids.slice(0, limit);
		},
		moreText(): string
		{
			const count = this.ids.length - limit;

			return Loc.getMessagePlural('TASKS_V2_TASK_LIST_MORE', count, {
				'#COUNT#': count,
			});
		},
		shouldShow(): boolean
		{
			if (!this.idsLoaded)
			{
				return true;
			}

			return this.ids.length > 0 || this.loadingIds.length > 0;
		},
	},
	template: `
		<div
			v-if="shouldShow"
			class="tasks-task-list print-no-box-shadow"
			:style="{ '--fields-count': fields.size }"
		>
			<template v-if="ids.length === 0 && !idsLoaded">
				<div class="tasks-task-line-separator print-background-white"/>
				<TaskLineSkeleton/>
			</template>
			<template v-for="taskId in limitedTasks" :key="taskId">
				<div class="tasks-task-line-separator print-background-white"/>
				<TaskLineGroup
					:taskId
					:isLoading="loadingIds.includes(taskId)"
					@remove="$emit('removeTask', $event)"
				/>
			</template>
		</div>
		<div
			v-if="ids.length > limit"
			class="tasks-task-list-more print-background-white"
			:class="{ '--readonly': !canOpenMore }"
			@click="$emit('openMore')"
		>
			<div class="tasks-task-list-more-text print-font-color-base-1">{{ moreText }}</div>
			<BIcon
				v-if="canOpenMore"
				class="tasks-task-list-icon print-ignore"
				:name="Outline.CHEVRON_RIGHT_L"
				hoverable
			/>
		</div>
	`,
};
