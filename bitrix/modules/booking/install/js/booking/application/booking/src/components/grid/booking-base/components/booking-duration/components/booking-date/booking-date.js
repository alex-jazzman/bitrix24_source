import { mapGetters } from 'ui.vue3.vuex';

import { DateTimeFormat } from 'main.date';

import { Model } from 'booking.const';
import { ChangeDatePopup } from './change-date-popup/change-date-popup';

import './booking-date.css';

// @vue/component
export const BookingDate = {
	name: 'BookingDate',
	components: {
		ChangeDatePopup,
	},
	props: {
		startTs: {
			type: Number,
			required: true,
		},
		endTs: {
			type: Number,
			required: true,
		},
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	data(): Object
	{
		return {
			showPopup: false,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
		}),
		dateFormat(): string
		{
			return DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
		},
		timeFormat(): string
		{
			return DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
		},
		startLocalSeconds(): number
		{
			return (this.startTs + this.offset) / 1000;
		},
		endLocalSeconds(): number
		{
			return (this.endTs + this.offset) / 1000;
		},
		dateFromFormatted(): string
		{
			return this.loc('BOOKING_BOOKING_DATE_FROM', {
				'#DATE#': DateTimeFormat.format(this.dateFormat, this.startLocalSeconds),
				'#TIME#': DateTimeFormat.format(this.timeFormat, this.startLocalSeconds),
			});
		},
		dateToFormatted(): string
		{
			return this.loc('BOOKING_BOOKING_DATE_TO', {
				'#DATE#': DateTimeFormat.format(this.dateFormat, (this.endTs + this.offset) / 1000),
				'#TIME#': DateTimeFormat.format(this.timeFormat, this.endLocalSeconds),
			});
		},
	},
	methods: {
		openPopup(): void
		{
			if (!this.isFeatureEnabled)
			{
				return;
			}

			this.showPopup = true;
		},
		closePopup(): void
		{
			this.showPopup = false;
		},
	},
	template: `
		<div
			class="booking-booking-booking__date"
			:class="{'--lock': !isFeatureEnabled}"
			data-element="booking-booking-date"
			ref="date"
			@click="openPopup"
		>
			<div class="booking-booking-booking__date-line">{{ dateFromFormatted }}</div>
			<div class="booking-booking-booking__date-line">{{ dateToFormatted }}</div>
		</div>
		<ChangeDatePopup
			v-if="showPopup"
			:bookingId="bookingId"
			:resourceId="resourceId"
			:targetNode="$refs.date"
			@close="closePopup"
		/>
	`,
};
