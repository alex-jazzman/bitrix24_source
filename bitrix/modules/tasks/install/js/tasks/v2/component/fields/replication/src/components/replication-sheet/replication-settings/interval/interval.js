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
	data(): { prevInterval: number }
	{
		return {
			prevInterval: this.interval,
		};
	},
	computed: {
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
	},
	template: `
		<div class="task-field-replication-interval">
			<BInput
				v-model="intervalValue"
				:size="InputSize.Lg"
				:design="InputDesign.Grey"
				style="padding-bottom: 0;"
			/>
		</div>
	`,
};
