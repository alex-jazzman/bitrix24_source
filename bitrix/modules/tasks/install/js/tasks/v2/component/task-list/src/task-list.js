import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Limit } from 'tasks.v2.const';

import { TaskLine } from './task-line';
import { TaskLineSkeleton } from './task-line-skeleton';
import './task-list.css';

const limit = Limit.RelationList;

// @vue/component
export const TaskList = {
	components: {
		BIcon,
		TaskLine,
		TaskLineSkeleton,
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
		fields: {
			type: Set,
			default: new Set(['responsible', 'deadline']),
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
	},
	template: `
		<div>
			<div class="tasks-task-list print-no-box-shadow" :style="{ '--fields-count': fields.size }">
				<template v-if="ids.length === 0">
					<div class="tasks-task-line-separator print-background-white"/>
					<TaskLineSkeleton :fields/>
				</template>
				<template v-for="taskId in limitedTasks" :key="taskId">
					<div class="tasks-task-line-separator print-background-white"/>
					<TaskLineSkeleton v-if="loadingIds.includes(taskId)" :fields/>
					<TaskLine v-else :taskId :fields @remove="$emit('removeTask', taskId)"/>
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
		</div>
	`,
};
