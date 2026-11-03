import { defineComponent } from 'ui.vue3';

import { CallBadgeSizes, CallBadgeColors } from './const';

import './css/badge.css';

export const CallBadge = defineComponent({
	name: 'CallBadge',
	props: {
		testId: {
			type: String,
			default: null,
			required: true,
		},
		label: {
			type: [String, Number],
			default: null,
		},
		size: {
			type: String,
			default: 'md',
			validator: (value: string): boolean => (CallBadgeSizes as ReadonlySet<string>).has(value),
		},
		color: {
			type: [String],
			default: 'blue',
			validator: (value: string): boolean => (CallBadgeColors as ReadonlySet<string>).has(value),
		},
	},
	computed: {
		additionalClasses(): string[]
		{
			const classes: string[] = [`--${this.size}`];

			if (this.color)
			{
				classes.push(`--${this.color}`);
			}

			return classes;
		},
	},
	template: /* HTML */`
		<span :data-testid="testId" class="call-badge" :class="additionalClasses">
			<slot>{{ label }}</slot>
		</span>
	`,
});
