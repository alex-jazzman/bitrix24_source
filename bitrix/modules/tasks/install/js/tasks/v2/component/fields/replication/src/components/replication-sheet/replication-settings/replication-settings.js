import { TextMd } from 'ui.system.typography.vue';

import { ReplicationPeriod } from 'tasks.v2.const';
import { UiTabs } from 'tasks.v2.component.elements.ui-tabs';
import { ReplicateCreator } from 'tasks.v2.provider.service.task-service';
import type { Tab } from 'tasks.v2.component.elements.ui-tabs';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationSettingsDay } from './replication-settings-day/replication-settings-day';
import { ReplicationSettingsWeek } from './replication-settings-week/replication-settings-week';
import { ReplicationSettingsMonth } from './replication-settings-month/replication-settings-month';
import { ReplicationSettingsYear } from './replication-settings-year/replication-settings-year';
import './replication-settings.css';

type Period = $Values<typeof ReplicationPeriod>;

// @vue/component
export const ReplicationSettings = {
	name: 'ReplicationSettings',
	components: {
		TextMd,
		UiTabs,
		ReplicationSettingsDay,
		ReplicationSettingsWeek,
		ReplicationSettingsMonth,
		ReplicationSettingsYear,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	computed: {
		period: {
			get(): Period
			{
				return this.replicateParams.period;
			},
			set(period: Period): void
			{
				this.$emit('update', {
					period,
					...this.getEmptyPrevTabData(this.replicateParams.period),
					...this.getDefaultTabData(period),
				});
			},
		},
		title(): string
		{
			return this.period === ReplicationPeriod.Weekly
				? this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE_ALT')
				: this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE');
		},
		tabs(): Tab<Period>[]
		{
			return [
				{
					id: ReplicationPeriod.Daily,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_DAY'),
					component: ReplicationSettingsDay,
				},
				{
					id: ReplicationPeriod.Weekly,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_WEEK'),
					component: ReplicationSettingsWeek,
				},
				{
					id: ReplicationPeriod.Monthly,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_MONTH'),
					component: ReplicationSettingsMonth,
				},
				{
					id: ReplicationPeriod.Yearly,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_YEAR'),
					component: ReplicationSettingsYear,
				},
			];
		},
	},
	methods: {
		getEmptyPrevTabData(prevPeriod: Period): Partial<TaskReplicateParams>
		{
			switch (prevPeriod)
			{
				case ReplicationPeriod.Daily:
					return ReplicateCreator.createReplicateParamsDaily();
				case ReplicationPeriod.Weekly:
					return ReplicateCreator.createReplicateParamsWeekly();
				case ReplicationPeriod.Monthly:
					return ReplicateCreator.createReplicateParamsMonthly();
				case ReplicationPeriod.Yearly:
					return ReplicateCreator.createReplicateParamsYearly();
				default:
					return {};
			}
		},
		getDefaultTabData(period: Period): Partial<TaskReplicateParams>
		{
			switch (period)
			{
				case ReplicationPeriod.Daily:
					return ReplicateCreator.createDefaultReplicationParamsDaily();
				case ReplicationPeriod.Weekly:
					return ReplicateCreator.createDefaultReplicationParamsWeekly();
				case ReplicationPeriod.Monthly:
					return ReplicateCreator.createDefaultReplicationParamsMonthly();
				case ReplicationPeriod.Yearly:
					return ReplicateCreator.createDefaultReplicationParamsYearly();
				default:
					return {};
			}
		},
	},
	template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row">
				<span class="tasks-field-replication-secondary">{{ title }}</span>
			</TextMd>
			<div class="tasks-field-replication-sheet-replication-settings-content">
				<UiTabs
					v-model="period"
					:tabs
				>
					<template v-slot="{ activeTab }">
						<component
							:is="activeTab.component"
							@update="$emit('update', $event)"
						/>
					</template>
				</UiTabs>
			</div>
		</div>
	`,
};
