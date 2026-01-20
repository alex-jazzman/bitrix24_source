import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { calendar } from 'tasks.v2.lib.calendar';

export const DatePlanDate = {
	components: {
		HoverPill,
	},
	props: {
		dateTs: {
			type: Number,
			required: true,
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
				<div>{{ calendar.formatDateTime(dateTs, { forceYear: true }) }}</div>
			</HoverPill>
		</div>
	`,
};
