import { defineComponent } from 'ui.vue3';

import { CALL_TOOLTIP_DEFAULT_POSITION, CallTooltipPositions } from './const';

import './css/tooltip.css';

export const CallTooltip = defineComponent({
	name: 'CallTooltip',
	props: {

		value: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		testId: {
			type: String,
			default: '',
		},
		tooltipClass: {
			type: String,
			default: '',
		},
		position: {
			type: String,
			default: CALL_TOOLTIP_DEFAULT_POSITION,
			validator: (value: string): boolean => (CallTooltipPositions as ReadonlySet<string>).has(value),
		},
	},
	computed: {
		tooltipClasses(): string[]
		{
			const classes = [`--${this.position}`];

			if (this.tooltipClass)
			{
				classes.push(this.tooltipClass);
			}

			return classes;
		},
		isTooltipVisible(): boolean
		{
			return !this.disabled && this.value.length > 0;
		},
	},
	template: /* HTML */`
		<div class="call-tooltip-container">
			<slot></slot>
			<div
				v-if="isTooltipVisible"
				class="call-tooltip"
				:class="tooltipClasses"
				:data-test-id="testId || null"
			>
				{{ value }}
			</div>
		</div>
	`,
});
