import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { calendar } from 'tasks.v2.lib.calendar';

export const DatePlanDuration = {
	components: {
		HoverPill,
	},
	props: {
		dateTs: {
			type: Number,
			required: true,
		},
		matchWorkTime: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			calendar,
		};
	},
	template: `
		<div>
			<HoverPill textOnly :readonly>
				<div>{{ calendar.formatDuration(dateTs, matchWorkTime) }}</div>
			</HoverPill>
		</div>
	`,
};
