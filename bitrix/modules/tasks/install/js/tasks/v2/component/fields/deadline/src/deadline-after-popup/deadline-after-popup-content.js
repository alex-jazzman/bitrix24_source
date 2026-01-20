import { DurationFormat } from 'main.date';

import { TextSm } from 'ui.system.typography.vue';
import { Chip, ChipDesign } from 'ui.system.chip.vue';

import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { Duration } from 'tasks.v2.component.elements.duration';
import { calendar } from 'tasks.v2.lib.calendar';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './deadline-after-popup.css';

const unitDurations = DurationFormat.getUnitDurations();

// @vue/component
export const DeadlineAfterPopupContent = {
	components: {
		TextSm,
		Chip,
		QuestionMark,
		Duration,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		freeze: {
			type: Function,
			required: true,
		},
		unfreeze: {
			type: Function,
			required: true,
		},
	},
	emits: ['update', 'close'],
	setup(): Object
	{
		return {
			ChipDesign,
		};
	},
	data(): Object
	{
		return {
			deadlineAfter: 0,
		};
	},
	computed: {
		duration: {
			get(): number
			{
				return this.deadlineAfter;
			},
			set(deadlineAfter: number): number
			{
				this.$emit('update', deadlineAfter);
			},
		},
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		presets(): Object
		{
			const dayDuration = this.task?.matchesWorkTime ? calendar.workdayDuration : unitDurations.d;

			return [
				{
					duration: dayDuration,
					title: new DurationFormat(unitDurations.d).format(),
				},
				{
					duration: dayDuration * 3,
					title: new DurationFormat(unitDurations.d * 3).format(),
				},
				{
					duration: dayDuration * 7,
					title: this.loc('TASKS_V2_DEADLINE_A_WEEK'),
				},
				{
					duration: dayDuration * 14,
					title: this.loc('TASKS_V2_DEADLINE_TWO_WEEKS'),
				},
			];
		},
	},
	created(): void
	{
		this.deadlineAfter = this.task?.deadlineAfter;
	},
	methods: {
		applyPreset(duration: number): void
		{
			this.duration = duration;
			this.$emit('close');
		},
	},
	template: `
		<div class="tasks-field-deadline-after-header">
			<TextSm>{{ loc('TASKS_V2_DEADLINE_AFTER_TEXT') }}</TextSm>
			<QuestionMark :hintText="loc('TASKS_V2_DEADLINE_AFTER_HINT')"/>
		</div>
		<div class="tasks-field-deadline-after-chips">
			<template v-for="preset in presets" :key="preset.title">
				<Chip
					:text="preset.title"
					:design="ChipDesign.Outline"
					:compact="false"
					@click="applyPreset(preset.duration)"
				/>
			</template>
		</div>
		<Duration
			v-model="duration"
			:label="loc('TASKS_V2_DEADLINE_AFTER_CUSTOM')"
			:matchesWorkTime="task?.matchesWorkTime"
			@menuShown="freeze"
			@menuHidden="unfreeze"
		/>
	`,
};
