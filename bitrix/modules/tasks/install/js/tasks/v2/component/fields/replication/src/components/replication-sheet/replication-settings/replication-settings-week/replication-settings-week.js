import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import { ReplicationSettingsWeekDaysList } from './days-list/replication-settings-week-days-list';

import './replication-settings-week.css';

// @vue/component
export const ReplicationSettingsWeek = {
	name: 'ReplicationSettingsWeek',
	components: {
		QuestionMark,
		ReplicationSettingsWeekDaysList,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	computed: {
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
	},
	template: `
		<div class="tasks-replication-sheet-replication-settings-week tasks-field-replication-sheet__stack">
			<ReplicationSettingsWeekDaysList v-model:selectedDays="weekDays"/>
		</div>
	`,
};
