import { Loc, Type } from 'main.core';

import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextXs } from 'ui.system.typography.vue';

import { ReplicationPeriod } from 'tasks.v2.const';
import { Checkbox as UiCheckbox } from 'tasks.v2.component.elements.checkbox';

import './interval.css';

// @vue/component
export const ReplicationInterval = {
	name: 'ReplicationInterval',
	components: {
		RichLoc,
		BInput,
		TextXs,
		UiCheckbox,
	},
	props: {
		interval: {
			type: Number,
			required: true,
		},
		useInterval: {
			type: Boolean,
			default: false,
		},
		period: {
			type: String,
			default: ReplicationPeriod.Daily,
			validator: (value: string) => {
				return [ReplicationPeriod.Daily, ReplicationPeriod.Weekly, ReplicationPeriod.Monthly].includes(value);
			},
		},
	},
	emits: ['update:interval', 'update:useInterval'],
	setup(): { InputDesign: typeof InputDesign, InputSize: typeof InputSize }
	{
		return {
			InputDesign,
			InputSize,
		};
	},
	data(): { prevInterval: number }
	{
		return {
			prevInterval: this.interval,
		};
	},
	computed: {
		useIntervalValue: {
			get(): boolean
			{
				return this.useInterval;
			},
			set(value: boolean): void
			{
				this.$emit('update:useInterval', value);
			},
		},
		intervalValue: {
			get(): string
			{
				return this.interval?.toString() || '';
			},
			set(value: ?string = ''): void
			{
				let interval = parseInt(value.replaceAll(/\D/g, ''), 10) ?? 0;
				if (!Type.isInteger(interval) || interval < 1)
				{
					interval = this.prevInterval;
				}

				this.prevInterval = interval;
				this.$emit('update:interval', interval);
			},
		},
		intervalPeriod(): string
		{
			const getMess = (period: $Values<typeof ReplicationPeriod>) => {
				switch (period)
				{
					case ReplicationPeriod.Weekly:
						return 'TASKS_V2_REPLICATION_SETTINGS_WEEK';
					case ReplicationPeriod.Monthly:
						return 'TASKS_V2_REPLICATION_SETTINGS_MONTH';
					default:
						return 'TASKS_V2_REPLICATION_SETTINGS_DAY';
				}
			};

			return Loc.getMessagePlural(getMess(this.period), this.interval);
		},
	},
	template: `
		<div class="tasks-replication-sheet-action-row" :class="{'--active': useInterval}">
			<UiCheckbox :checked="useIntervalValue" @click="useIntervalValue = !useInterval"/>
			<RichLoc
				class="tasks-field-replication-row --text"
				:text="loc('TASKS_V2_REPLICATION_SETTINGS_INTERVAL')"
				placeholder="[interval/]"
			>
				<template #interval>
					<RichLoc class="tasks-field-replication-row" :text="intervalPeriod" placeholder="[value/]">
						<template #value>
							<BInput
								v-model="intervalValue"
								:size="InputSize.Sm"
								:design="useInterval ? InputDesign.Grey : InputDesign.Disabled"
								:disabled="!useInterval"
								style="width: 5em; padding-bottom: 0;"
							/>
						</template>
					</RichLoc>
				</template>
			</RichLoc>
			<div class="tasks-field-replication-row-grow"></div>
			<slot name="hint"/>
		</div>
	`,
};
