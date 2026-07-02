import { SkusInfo } from 'booking.component.actions-popup';

// @vue/component
export const BookingSkusInfo = {
	name: 'BookingSkusInfo',
	components: {
		SkusInfo,
	},
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	emits: ['freeze', 'unfreeze'],
	template: `
		<SkusInfo
			:id="bookingId"
			:resourceId="resourceId"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`,
};
