import { Type } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';

import { ReplicationYearlyType } from 'tasks.v2.const';
import { UiRadio } from 'tasks.v2.component.elements.radio';

import { MonthSelect } from '../../components/month-select';

// @vue/component
export const ReplicationSettingsYearAbsoluteDate = {
	name: 'ReplicationSettingsYearAbsoluteDate',
	components: {
		BInput,
		UiRadio,
		MonthSelect,
	},
	props: {
		yearlyType: {
			type: Number,
			required: true,
		},
		yearlyDayNumber: {
			type: Number,
			required: true,
		},
		yearlyMonth: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:yearlyType', 'update:yearlyDayNumber', 'update:yearlyMonth'],
	setup(): Object
	{
		return {
			InputDesign,
			InputSize,
			ReplicationYearlyType,
		};
	},
	data(): { localDayNumber: string, lastValidDayNumber: number }
	{
		return {
			localDayNumber: '',
			lastValidDayNumber: 1,
		};
	},
	watch: {
		yearlyDayNumber: {
			immediate: true,
			handler(value: number): void
			{
				this.lastValidDayNumber = value;
				this.localDayNumber = String(value);
			},
		},
	},
	computed: {
		disabled(): boolean
		{
			return this.yearlyType !== ReplicationYearlyType.Absolute;
		},
		dayNumber: {
			get(): number
			{
				return this.yearlyDayNumber;
			},
			set(value: number): void
			{
				this.$emit('update:yearlyDayNumber', value);
			},
		},
		month: {
			get(): number
			{
				return this.yearlyMonth;
			},
			set(value: number): void
			{
				this.$emit('update:yearlyMonth', value);
			},
		},
	},
	methods: {
		updateDayNumber(value: string = ''): void
		{
			this.localDayNumber = value.replaceAll(/\D/g, '').slice(0, 2);
		},
		handleDayNumberBlur(): void
		{
			const day = parseInt(this.localDayNumber, 10);

			if (!Type.isInteger(day) || day < 1 || day > 31)
			{
				this.localDayNumber = String(this.lastValidDayNumber);

				return;
			}

			this.lastValidDayNumber = day;
			this.localDayNumber = String(day);
			this.$emit('update:yearlyDayNumber', day);
		},
	},
	template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:yearlyType', ReplicationYearlyType.Absolute)"
		>
			<UiRadio
				tag="label"
				:modelValue="yearlyType"
				:value="ReplicationYearlyType.Absolute"
				inputName="tasks-replication-sheet-yearly-type"
				@update:modelValue="$emit('update:yearlyType', $event)"
			/>
			<BInput
				:modelValue="localDayNumber"
				:size="InputSize.Sm"
				:design="disabled ? InputDesign.Disabled : InputDesign.Grey"
				:disabled
				stretched
				style="max-width: 4em;"
				@update:modelValue="updateDayNumber"
				@blur="handleDayNumberBlur"
			/>
			<MonthSelect v-model="month" :disabled/>
		</div>
	`,
};
