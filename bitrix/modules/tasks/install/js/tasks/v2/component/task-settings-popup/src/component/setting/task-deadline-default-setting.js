import { DurationFormat } from 'main.date';
import 'ui.forms';
import { DurationUnit } from 'tasks.v2.const';

import './task-deadline-default-setting.css';

// @vue/component
export const TaskDeadlineDefaultSetting = {
	name: 'TasksTaskDeadlineDefaultSetting',
	props: {
		modelValue: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	emits: [
		'update:modelValue',
		'updateDeadlineUserOption',
	],
	data(): Object
	{
		return {
			periodOptions: [
				{ value: DurationUnit.Hours, label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_HOUR') },
				{ value: DurationUnit.Days, label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_DAY') },
				{ value: DurationUnit.Weeks, label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_WEEK') },
				{ value: DurationUnit.Months, label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_MONTH') },
			],
			selectedPeriod: DurationUnit.Days,
			localValue: '',
		};
	},
	watch: {
		modelValue: {
			immediate: true,
			handler(newValue): void
			{
				if (newValue <= 0)
				{
					this.localValue = '';

					return;
				}

				const bestPeriod = this.findBestPeriod(newValue);
				this.selectedPeriod = bestPeriod.period;

				const periodInSeconds = this.getPeriodInSeconds(bestPeriod.period);

				const valueInPeriod = newValue / periodInSeconds;

				this.localValue = this.formatValue(valueInPeriod, bestPeriod.period);
			},
		},
	},
	methods: {
		handleBlur(): void
		{
			this.updateModelValue();
		},
		findBestPeriod(seconds: number): { period: string, value: number }
		{
			const periods = [
				{ period: DurationUnit.Months, duration: this.getPeriodInSeconds(DurationUnit.Months) },
				{ period: DurationUnit.Weeks, duration: this.getPeriodInSeconds(DurationUnit.Weeks) },
				{ period: DurationUnit.Days, duration: this.getPeriodInSeconds(DurationUnit.Days) },
				{ period: DurationUnit.Hours, duration: this.getPeriodInSeconds(DurationUnit.Hours) },
			].sort((a, b) => b.duration - a.duration);

			for (const { period, duration } of periods)
			{
				const value = seconds / duration;

				if (Number.isInteger(value) && value >= 1)
				{
					return { period, value };
				}
			}

			for (const { period, duration } of periods)
			{
				const value = seconds / duration;

				if (value >= 1 && value < 1000)
				{
					return { period, value };
				}
			}

			return { period: DurationUnit.Hours, value: seconds / this.getPeriodInSeconds(DurationUnit.Hours) };
		},
		formatValue(value: number, period: string): string
		{
			if (period === DurationUnit.Hours && value >= 24)
			{
				const days = value / 24;
				if (days === Math.floor(days))
				{
					return days.toString();
				}
			}

			if (value % 1 !== 0)
			{
				return value.toFixed(2).replace(/\.?0+$/, '');
			}

			return value.toString();
		},
		updateSelectedPeriod(event): void
		{
			this.selectedPeriod = event.target.value;
			this.updateModelValue();
		},
		updateModelValue(): void
		{
			if (!this.localValue || Number.isNaN(parseFloat(this.localValue)))
			{
				this.$emit('update:modelValue', 0);

				return;
			}

			const numericValue = parseFloat(this.localValue);
			if (numericValue <= 0)
			{
				this.$emit('update:modelValue', 0);

				return;
			}

			this.emitDeadlineUserOptionUpdate(this.selectedPeriod);

			const periodInSeconds = this.getPeriodInSeconds(this.selectedPeriod);
			const seconds = numericValue * periodInSeconds;

			this.$emit('update:modelValue', Math.round(seconds));
		},
		getPeriodInSeconds(selectedPeriod: string): number
		{
			const unitDurations = DurationFormat.getUnitDurations();

			switch (selectedPeriod)
			{
				case DurationUnit.Hours:
					return unitDurations.H / 1000;
				case DurationUnit.Days:
					return unitDurations.d / 1000;
				case DurationUnit.Weeks:
					return unitDurations.d * 7 / 1000;
				case DurationUnit.Months:
					return unitDurations.d * 30 / 1000;
				default:
					return unitDurations.H / 1000;
			}
		},
		emitDeadlineUserOptionUpdate(selectedPeriod: string): void
		{
			this.$emit('updateDeadlineUserOption', {
				isExactDeadlineTime: selectedPeriod === DurationUnit.Hours,
			});
		},
	},
	template: `
		<div class="tasks-task-deadline-setting">
			<div class="ui-ctl ui-ctl-textbox">
				<input
					type="number"
					class="ui-ctl-element"
					v-model.trim="localValue"
					data-id="tasks-task-deadline-setting-value"
					@blur="handleBlur"
				/>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
				<div class="ui-ctl-after ui-ctl-icon-angle"/>
				<select class="ui-ctl-element" :value="selectedPeriod" @change="updateSelectedPeriod">
					<option
						v-for="option in periodOptions"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</select>
			</div>
		</div>
	`,
};
