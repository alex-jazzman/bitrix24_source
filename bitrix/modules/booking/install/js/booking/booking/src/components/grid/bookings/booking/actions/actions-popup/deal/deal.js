import 'ui.icon-set.main';

import { CrmEntity, Model } from 'booking.const';
import { DealHelper } from 'booking.lib.deal-helper';
import { Deal } from 'booking.component.actions-popup';
import type { BookingModel, DealData } from 'booking.model.bookings';

type BookingDealData = {
	dealHelper: DealHelper;
}

export const BookingDeal = {
	name: 'BookingActionsPopupDeal',
	emits: ['freeze', 'unfreeze'],
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(props): BookingDealData
	{
		const dealHelper = new DealHelper(props.bookingId);

		return {
			dealHelper,
		};
	},
	computed: {
		booking(): BookingModel
		{
			return this.$store.getters[`${Model.Bookings}/getById`](this.bookingId);
		},
		deal(): DealData | null
		{
			return this.booking.externalData?.find((data) => data.entityTypeId === CrmEntity.Deal) ?? null;
		},
	},
	components: {
		Deal,
	},
	template: `
		<Deal
			:deal="deal"
			:dealHelper="dealHelper"
			:dataId="booking.id"
			dataElementPrefix="booking"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`,
};
