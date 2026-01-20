import { Cancel } from './cancel/cancel';
import { AddToCalendar } from './add-to-calendar/add-to-calendar';
import './footer.css';

// @vue/component
export const Footer = {
	name: 'Footer',
	components: {
		Cancel,
		AddToCalendar,
	},
	props: {
		booking: {
			type: Object,
			required: true,
		},
		context: {
			type: String,
			required: true,
		},
		icsDownloadRequested: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['bookingCanceled', 'bookingConfirmed', 'downloadIcs'],
	data(): Object
	{
		return {};
	},
	template: `
		<div class="confirm-page__footer">
			<Cancel
				:booking="booking"
				:context="context"
				@bookingCanceled="$emit('bookingCanceled')"
				@bookingConfirmed="$emit('bookingConfirmed')"
			/>
			<AddToCalendar
				:booking="booking"
				:icsDownloadRequested="icsDownloadRequested"
				@downloadIcs="$emit('downloadIcs')"
			/>
		</div>
	`,
};
