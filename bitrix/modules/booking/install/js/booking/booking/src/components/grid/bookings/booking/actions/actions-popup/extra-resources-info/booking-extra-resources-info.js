import { ExtraResourcesInfo } from 'booking.component.actions-popup';

// @vue/component
export const BookingExtraResourcesInfo = {
	name: 'BookingExtraResourcesInfo',
	components: {
		ExtraResourcesInfo,
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
		<ExtraResourcesInfo
			:id="bookingId"
			:resourceId
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`,
};
