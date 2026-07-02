import { Loc, Type } from 'main.core';

import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextXs } from 'ui.system.typography.vue';

import { ReplicationPeriod } from 'tasks.v2.const';
import { Checkbox as UiCheckbox } from 'tasks.v2.component.elements.checkbox';
import { UiRadio } from 'tasks.v2.component.elements.radio';

import './interval.css';

const ReplicationIntervalControlType = Object.freeze({
	Checkbox: 'checkbox',
	Radio: 'radio',
	None: 'none',
});

// @vue/component
export const ReplicationInterval = {
	name: 'ReplicationInterval',
	components: {
		RichLoc,
		BInput,
		TextXs,
		UiCheckbox,
		UiRadio,
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
		controlType: {
			type: String,
			default: ReplicationIntervalControlType.Checkbox,
			validator: (value: string) => {
				return Object.values(ReplicationIntervalControlType).includes(value);
			},
		},
		inputName: {
			type: String,
			default: '',
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
		isCheckbox(): boolean
		{
			return this.controlType === ReplicationIntervalControlType.Checkbox;
		},
		isRadio(): boolean
		{
			return this.controlType === ReplicationIntervalControlType.Radio;
		},
		radioValue(): string
		{
			return this.useInterval ? 'selected' : '';
		},
	},
	methods: {
		toggleCheckbox(): void
		{
			this.useIntervalValue = !this.useInterval;
		},
		selectRadio(): void
		{
			if (!this.useInterval)
			{
				this.$emit('update:useInterval', true);
			}
		},
	},
	template: `
		<div
			class="tasks-replication-sheet-action-row"
			:class="{
				'--active': useInterval,
				'--selectable': isRadio,
			}"
			@click.self="isRadio && selectRadio()"
		>
				<UiCheckbox
					v-if="isCheckbox"
					:checked="useIntervalValue"
					@click="toggleCheckbox"
				/>
				<UiRadio
					v-else-if="isRadio"
					tag="label"
					:modelValue="radioValue"
					value="selected"
				:inputName
				@update:modelValue="selectRadio"
			/>
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
