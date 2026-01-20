import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextXs } from 'ui.system.typography.vue';

import { ReplicationMonthlyType } from 'tasks.v2.const';
import { UiRadio } from 'tasks.v2.component.elements.radio';

// @vue/component
export const ReplicationSettingsMonthlyByDayOfMonth = {
	name: 'ReplicationSettingsMonthlyByDayOfMonth',
	components: {
		RichLoc,
		BInput,
		TextXs,
		UiRadio,
	},
	props: {
		monthlyType: {
			type: Number,
			required: true,
		},
		dayNumber: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:monthlyType', 'update:dayNumber'],
	setup(): Object
	{
		return {
			InputDesign,
			InputSize,
			ReplicationMonthlyType,
		};
	},
	data(): { prevDayNumber: number }
	{
		return {
			prevDayNumber: 0,
		};
	},
	computed: {
		disabled(): boolean
		{
			return this.monthlyType !== ReplicationMonthlyType.Absolute;
		},
	},
	mounted() {
		this.prevDayNumber = this.dayNumber;
	},
	methods: {
		updateDayNumber(dayNumber: string = ''): void
		{
			let days = parseInt(dayNumber.replaceAll(/\D/g, ''), 10) ?? 0;

			if (!Number.isInteger(days) || days < 1 || days > 31)
			{
				days = this.prevDayNumber;
			}

			this.prevDayNumber = days;
			this.$emit('update:dayNumber', days);
		},
	},
	template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:monthlyType', ReplicationMonthlyType.Absolute)"
		>
			<UiRadio
				:modelValue="monthlyType"
				:value="ReplicationMonthlyType.Absolute"
				inputName="tasks-replication-sheet-monthly-type"
				@update:modelValue="$emit('update:monthlyType', $event)"
			/>
			<RichLoc class="tasks-field-replication-row" :text="loc('TASKS_V2_REPLICATION_NTH_DAY')" placeholder="[day/]">
				<template #day>
					<BInput
						:modelValue="String(dayNumber)"
						:size="InputSize.Sm"
						:design="!disabled ? InputDesign.Grey : InputDesign.Disabled"
						:disabled
						stretched
						style="max-width: 4em; padding-bottom: 0;"
						@update:modelValue="updateDayNumber"
					/>
				</template>
			</RichLoc>
		</div>
	`,
};
