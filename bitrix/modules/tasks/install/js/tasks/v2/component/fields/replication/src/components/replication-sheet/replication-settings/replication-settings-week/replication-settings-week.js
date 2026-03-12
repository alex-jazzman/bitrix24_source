import { Loc } from 'main.core';
import { markRaw } from 'ui.vue3';

import { ReplicationPeriod } from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import { ReplicationInterval } from '../interval/interval';
import { ReplicationSettingsWeekDaysList } from './days-list/replication-settings-week-days-list';

import './replication-settings-week.css';

// @vue/component
export const ReplicationSettingsWeek = {
	name: 'ReplicationSettingsWeek',
	components: {
		QuestionMark,
		ReplicationInterval,
		ReplicationSettingsWeekDaysList,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	computed: {
		period(): string
		{
			return markRaw(ReplicationPeriod.Weekly);
		},
		useInterval: {
			get(): boolean
			{
				return this.replicateParams.everyWeek > 0;
			},
			set(useInterval: boolean): void
			{
				this.$emit('update', { everyWeek: useInterval ? 1 : null });
			},
		},
		interval: {
			get(): number
			{
				return this.replicateParams.everyWeek || 1;
			},
			set(value: number): void
			{
				this.$emit('update', { everyWeek: value });
			},
		},
		weekDays: {
			get(): number[]
			{
				return this.replicateParams.weekDays;
			},
			set(weekDays: number[]): void
			{
				this.$emit('update', { weekDays });
			},
		},
		hintText(): string
		{
			return Loc.getMessagePlural(
				'TASKS_V2_REPLICATION_SETTINGS_WEEK_HINT',
				this.interval,
				{
					'#COUNT#': this.interval,
				},
			);
		},
	},
	template: `
		<div class="tasks-replication-sheet-replication-settings-week tasks-field-replication-sheet__stack">
			<ReplicationSettingsWeekDaysList v-model:selectedDays="weekDays"/>
			<ReplicationInterval
				v-model:useInterval="useInterval"
				v-model:interval="interval"
				:period
			>
				<template #hint>
					<QuestionMark
						:hintText
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
		</div>
	`,
};
