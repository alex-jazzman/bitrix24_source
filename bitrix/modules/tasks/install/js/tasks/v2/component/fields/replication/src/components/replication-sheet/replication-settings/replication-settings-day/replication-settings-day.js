import { Loc } from 'main.core';
import { markRaw } from 'ui.vue3';

import { ReplicationPeriod } from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import { ReplicationInterval } from '../interval/interval';

// @vue/component
export const ReplicationSettingsDay = {
	name: 'ReplicationSettingsDay',
	components: {
		QuestionMark,
		ReplicationInterval,
	},
	inject: {
		replicateParams: {},
		isTemplate: {},
	},
	emits: ['update'],
	computed: {
		monthPeriod(): string
		{
			return markRaw(ReplicationPeriod.Monthly);
		},
		useMonthInterval: {
			get(): boolean
			{
				return this.replicateParams.dailyMonthInterval > 0;
			},
			set(useInterval: boolean): void
			{
				this.$emit('update', { dailyMonthInterval: useInterval ? 1 : null });
			},
		},
		monthInterval: {
			get(): number
			{
				return this.replicateParams.dailyMonthInterval || 1;
			},
			set(value: number): void
			{
				this.$emit('update', { dailyMonthInterval: value });
			},
		},
		monthHintText(): string
		{
			return Loc.getMessagePlural(
				'TASKS_V2_REPLICATION_SETTINGS_MONTH_HINT',
				this.monthInterval,
				{
					'#COUNT#': this.monthInterval,
				},
			);
		},
	},
	template: `
		<div class="tasks-replication-sheet-replication-settings-day tasks-field-replication-sheet__stack">
			<ReplicationInterval
				v-if="isTemplate"
				v-model:useInterval="useMonthInterval"
				v-model:interval="monthInterval"
				:period="monthPeriod"
			>
				<template #hint>
					<QuestionMark
						class="tasks-replication-sheet-action-row__hint"
						:hintText="monthHintText"
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
		</div>
	`,
};
