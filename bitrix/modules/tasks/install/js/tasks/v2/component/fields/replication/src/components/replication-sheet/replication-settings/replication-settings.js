import { InputSize } from 'ui.system.input.vue';
import { TextMd } from 'ui.system.typography.vue';

import { UiSelect } from 'tasks.v2.component.elements.select';
import type { Item as SelectItem, MenuOptions } from 'tasks.v2.component.elements.select';
import { ReplicationPeriod, ReplicationMonthlyType } from 'tasks.v2.const';
import { ReplicateCreator } from 'tasks.v2.provider.service.task-service';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationInterval } from './interval/interval';
import { ReplicationSettingsMonth } from './replication-settings-month/replication-settings-month';
import { ReplicationSettingsWeek } from './replication-settings-week/replication-settings-week';
import { ReplicationSettingsYear } from './replication-settings-year/replication-settings-year';

import './replication-settings.css';

type Period = $Values<typeof ReplicationPeriod>;

type PeriodSelectItem = SelectItem & {
	component: Object,
};

// @vue/component
export const ReplicationSettings = {
	name: 'ReplicationSettings',
	components: {
		TextMd,
		UiSelect,
		ReplicationInterval,
		ReplicationSettingsMonth,
		ReplicationSettingsWeek,
		ReplicationSettingsYear,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	setup(): { InputSize: typeof InputSize }
	{
		return {
			InputSize,
		};
	},
	computed: {
		period: {
			get(): Period
			{
				return this.replicateParams.period;
			},
			set(period: Period): void
			{
				this.update({
					period,
					...this.getEmptyPrevTabData(this.replicateParams.period),
					...this.getDefaultTabData(period),
				});
			},
		},
		interval: {
			get(): number
			{
				switch (this.period)
				{
					case ReplicationPeriod.Daily:
						return this.replicateParams.everyDay || 1;
					case ReplicationPeriod.Weekly:
						return this.replicateParams.everyWeek || 1;
					case ReplicationPeriod.Monthly:
						return (
							this.replicateParams.monthlyType === ReplicationMonthlyType.Absolute
								? this.replicateParams.monthlyMonthNum1
								: this.replicateParams.monthlyMonthNum2
						) || 1;
					default:
						return 1;
				}
			},
			set(value: number): void
			{
				switch (this.period)
				{
					case ReplicationPeriod.Daily:
						this.update({ everyDay: value });
						break;
					case ReplicationPeriod.Weekly:
						this.update({ everyWeek: value });
						break;
					case ReplicationPeriod.Monthly:
						if (this.replicateParams.monthlyType === ReplicationMonthlyType.Absolute)
						{
							this.update({ monthlyMonthNum1: value });
						}
						else
						{
							this.update({ monthlyMonthNum2: value });
						}
						break;
					default:
						break;
				}
			},
		},
		selectWidth(): number
		{
			return 160;
		},
		showInterval(): boolean
		{
			return this.period !== ReplicationPeriod.Yearly;
		},
		title(): string
		{
			return this.period === ReplicationPeriod.Weekly
				? this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE_ALT')
				: this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE');
		},
		items(): PeriodSelectItem[]
		{
			return [
				{
					id: ReplicationPeriod.Daily,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_DAY'),
					component: null,
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
		item(): PeriodSelectItem
		{
			return this.items.find(({ id }) => id === this.replicateParams.period) ?? this.items[0];
		},
		menuOptions(): MenuOptions
		{
			return {
				width: this.selectWidth,
			};
		},
	},
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
		},
		onSelectItem(selectedItem: PeriodSelectItem): void
		{
			const prevPeriod = this.replicateParams.period;
			const newPeriod = selectedItem.id;

			if (prevPeriod === newPeriod)
			{
				return;
			}

			this.update({
				period: newPeriod,
				...this.getEmptyPrevTabData(prevPeriod),
				...this.getDefaultTabData(newPeriod),
			});
		},
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
		<div class="tasks-field-replication-settings">
			<div class="tasks-field-replication-repeat-select">
				<TextMd tag="div" className="tasks-field-replication-secondary">
					{{ title }}
				</TextMd>
				<ReplicationInterval
					v-if="showInterval"
					v-model:interval="interval"
					:period="period"
				/>
				<div class="tasks-field-replication-period-select">
					<UiSelect
						:item="item"
						:items="items"
						:size="InputSize.Lg"
						:style="{ width: selectWidth }"
						:menuOptions="menuOptions"
						@update:item="onSelectItem"
					/>
				</div>
			</div>
			<component
				:is="item.component"
				@update="$emit('update', $event)"
			/>
		</div>
	`,
};
