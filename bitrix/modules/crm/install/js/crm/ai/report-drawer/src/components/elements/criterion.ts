import { defineComponent, PropType } from 'ui.vue3';
import { type CriterionStatus } from '../../types';

export const Criterion = defineComponent({
	name: 'Criterion',

	props: {
		name: {
			type: String,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		status: {
			type: String as PropType<CriterionStatus>,
			required: true,
		},
	},

	computed: {
		statusClass(): string {
			return `--${this.status}`;
		},
	},

	template: `
		<div class="crm-ai-report-drawer__criteria">
			<div class="crm-ai-report-drawer__criteria-name ui-typography-text-lg ui-typography-text-bold">
				<span :class="['crm-ai-report-drawer__criteria-name-circle', statusClass]" />
				{{ name }}
			</div>
			<div class="crm-ai-report-drawer__criteria-text ui-typography-text-lg">{{ text }}</div>
		</div>
	`,
});
