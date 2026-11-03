import { defineComponent } from 'ui.vue3';

import { CallIcon } from './component';
import { CallIconColors, CallIconList, CallIconSizes } from './const';

import './css/icon.css';

export const CallIconLevel = defineComponent({
	name: 'CallIconLevel',
	components: {
		CallIcon,
	},
	props: {
		icon: {
			type: String,
			required: true,
			validator: (value: string): boolean => (CallIconList as ReadonlySet<string>).has(value),
		},
		color: {
			type: String,
			default: 'white',
			validator: (value: string): boolean => (CallIconColors as ReadonlySet<string>).has(value),
		},
		size: {
			type: Number,
			default: 24,
			validator: (value: number): boolean => (CallIconSizes as ReadonlySet<number>).has(value),
		},
		animated: {
			type: Boolean,
			default: false,
		},
		fillColor: {
			type: String,
			default: 'white',
			validator: (value: string): boolean => (CallIconColors as ReadonlySet<string>).has(value),
		},
		level: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		clampedLevel(): number
		{
			return Math.max(0, Math.min(100, this.level));
		},
		fillStyle(): Record<string, string>
		{
			return { clipPath: `inset(${100 - this.clampedLevel}% 0 0 0)` };
		},
	},
	template: /* HTML */`
		<div class="call-icon-level">
			<CallIcon :icon="icon" :color="color" :size="size" :animated="animated" />
			<CallIcon
				class="call-icon-level__fill"
				:icon="icon"
				:color="fillColor"
				:size="size"
				:style="fillStyle"
			/>
		</div>
	`,
});
