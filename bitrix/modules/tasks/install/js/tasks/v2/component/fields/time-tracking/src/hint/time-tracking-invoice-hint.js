import { Hint } from 'tasks.v2.component.elements.hint';

import './time-tracking-hint.css';

// @vue/component
export const TimeTrackingInvoiceHint = {
	name: 'TasksTimeTrackingInvoiceHint',
	components: {
		Hint,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			default: null,
		},
	},
	template: `
		<Hint
			:bindElement
			:options="{
				maxWidth: 430,
				closeIcon: true,
				offsetLeft: bindElement ? bindElement.offsetWidth / 2 : 0,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-time-tracking-hint">
				<div class="tasks-time-tracking-hint-image">
					<div class="tasks-time-tracking-invoice-hint-icon"/>
				</div>
				<div class="tasks-time-tracking-hint-content">
					<div class="tasks-time-tracking-hint-title">
						{{ loc('TASKS_V2_TIME_TRACKING_HINT_TITLE_INVOICE') }}
					</div>
					<div class="tasks-time-tracking-hint-text">
						{{ loc('TASKS_V2_TIME_TRACKING_HINT_TEXT_INVOICE') }}
					</div>
				</div>
			</div>
		</Hint>
	`,
};
