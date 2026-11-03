import { Type } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';

import { ReplicationPeriod } from 'tasks.v2.const';

import './interval.css';

// @vue/component
export const ReplicationInterval = {
	name: 'ReplicationInterval',
	components: {
		BInput,
	},
	props: {
		interval: {
			type: Number,
			required: true,
		},
		period: {
			type: String,
			default: ReplicationPeriod.Daily,
			validator: (value: string) => {
				return [ReplicationPeriod.Daily, ReplicationPeriod.Weekly, ReplicationPeriod.Monthly].includes(value);
			},
		},
	},
	emits: ['update:interval'],
	setup(): { InputDesign: typeof InputDesign, InputSize: typeof InputSize }
	{
		return {
			InputDesign,
			InputSize,
		};
	},
	data(): { inputValue: string }
	{
		return {
			inputValue: this.interval.toString(),
		};
	},
	watch: {
		interval(interval: number): void
		{
			this.inputValue = interval.toString();
		},
		period(): void
		{
			this.restoreInputValue();
		},
	},
	computed: {
		intervalValue: {
			get(): string
			{
				return this.inputValue;
			},
			set(value: ?string = ''): void
			{
				this.inputValue = value.replaceAll(/\D/g, '');
				const interval = parseInt(this.inputValue, 10);
				if (!Type.isInteger(interval) || interval < 1)
				{
					return;
				}

				this.$emit('update:interval', interval);
			},
		},
	},
	methods: {
		restoreInputValue(): void
		{
			this.inputValue = this.interval.toString();
		},
	},
	template: `
		<div class="task-field-replication-interval">
			<BInput
				v-model="intervalValue"
				:size="InputSize.Lg"
				:design="InputDesign.Grey"
				:ariaLabel="loc('TASKS_V2_REPLICATION_INTERVAL_ARIA_LABEL')"
				data-testid="tasks-replication-interval-input"
				style="padding-bottom: 0;"
				@blur="restoreInputValue"
			/>
		</div>
	`,
};
