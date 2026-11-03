import { defineComponent } from 'ui.vue3';

import { CallIconColors, CallIconList, CallIconSizes } from './const';
import { ensureCallIconSprite } from './sprite';

import './css/icon.css';

export const CallIcon = defineComponent({
	name: 'CallIcon',
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
	},
	computed: {
		additionalClasses(): string[]
		{
			const classes = [`call-icon-${this.icon}`];

			if (this.color)
			{
				classes.push(`--${this.color}`);
			}

			return classes;
		},
		additionalStyles(): Record<string, string>
		{
			return {
				'--call-icon-size': `${this.size}px`,
			};
		},
	},
	created(): void
	{
		ensureCallIconSprite();
	},
	template: /* HTML */ `
		<div class="call-icon" :class="additionalClasses" :style="additionalStyles" aria-hidden="true">
			<svg>
				<use :href="'#call-icon-' + icon" />
			</svg>
		</div>
	`,
});
