import { mapGetters } from 'ui.vue3.vuex';
import { Model } from 'booking.const';
import { Core } from 'booking.core';
import { BookingActionsPopup } from './actions-popup/actions-popup';

export type { ActionsPopupOptions } from './actions-popup/actions-popup';

// @vue/component
export const Actions = {
	name: 'BookingActions',
	components: {
		BookingActionsPopup,
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
		actionsPopupOptions: {
			type: Object,
			default: null,
		},
	},
	computed: mapGetters({
		editingBookingId: `${Model.Interface}/editingBookingId`,
		isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
		isMenuOpenedForBooking: `${Model.Interface}/isMenuOpenedForBooking`,
	}),
	async mounted(): void
	{
		if (this.isEditingBookingMode && this.editingBookingId === this.bookingId)
		{
			await Core.getStore().dispatch(
				`${Model.Interface}/setMenuOpenedForBooking`,
				{ bookingId: this.bookingId, resourceId: this.resourceId },
			);
		}
	},
	methods: {
		async clickHandler(): void
		{
			await Core.getStore().dispatch(
				`${Model.Interface}/setMenuOpenedForBooking`,
				{ bookingId: this.bookingId, resourceId: this.resourceId },
			);
		},
		async onClose(): void
		{
			if (this.isMenuOpenedForBooking(this.bookingId, this.resourceId))
			{
				await Core.getStore().dispatch(
					`${Model.Interface}/setMenuOpenedForBooking`,
					{ bookingId: 0, resourceId: 0 },
				);
			}
		},
	},
	template: `
		<div 
			ref="node"
			class="booking-booking-booking-actions"
			data-element="booking-booking-actions-button"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			@click="clickHandler"
		>
		</div>
		<BookingActionsPopup
			v-if="isMenuOpenedForBooking(this.bookingId, this.resourceId)"
			:bookingId
			:bindElement="this.$refs.node"
			:resourceId
			:options="actionsPopupOptions"
			@close="onClose()"
		/>
	`,
};
