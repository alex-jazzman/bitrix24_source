import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskCard } from 'tasks.v2.application.task-card';
import { TaskStatus } from 'tasks.v2.const';
import { Deadline } from 'tasks.v2.component.fields.deadline';
import { Responsible } from 'tasks.v2.component.fields.responsible';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { Gantt } from './field/gantt';
import './task-line.css';

// @vue/component
export const TaskLine = {
	components: {
		TextMd,
		BIcon,
		Responsible,
		Deadline,
		Gantt,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		fields: {
			type: Set,
			required: true,
		},
	},
	emits: ['remove'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isHovered: false,
		};
	},
	computed: {
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		completed(): boolean
		{
			return this.task.status === TaskStatus.Completed;
		},
		href(): string
		{
			if (String(this.taskId).startsWith('tmp.'))
			{
				return TaskCard.getUrl(idUtils.boxTemplate(this.taskId.replace('tmp.', '')));
			}

			return TaskCard.getUrl(this.taskId);
		},
		detachReadonly(): boolean
		{
			const { detachParent, detachRelated, changeDependence } = this.task.rights;
			const canDetach = detachParent || detachRelated || changeDependence;

			return !canDetach;
		},
	},
	methods: {
		handleRemove(): void
		{
			if (!this.detachReadonly)
			{
				this.$emit('remove');
			}
		},
	},
	template: `
		<div class="tasks-task-line-cross-background" @mouseover="isHovered = true" @mouseleave="isHovered = false"/>
		<div class="tasks-task-line-title-container" @mouseover="isHovered = true" @mouseleave="isHovered = false">
			<TextMd class="tasks-task-line-title" :class="{ '--completed': completed }" :title="task.title">
				<a :href>{{ task.title }}</a>
			</TextMd>
		</div>
		<div v-if="fields.has('responsible')" class="tasks-task-line-field">
			<Responsible :taskId avatarOnly/>
		</div>
		<div v-if="fields.has('deadline')" class="tasks-task-line-field">
			<Deadline :taskId :isTemplate compact/>
		</div>
		<div v-if="fields.has('gantt')" class="tasks-task-line-field">
			<Gantt :taskId/>
		</div>
		<div
			class="tasks-task-line-cross"
			:class="{ '--readonly': detachReadonly, '--hover': isHovered }"
			@click="handleRemove"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<BIcon :name="Outline.CROSS_L" hoverable/>
		</div>
	`,
};
