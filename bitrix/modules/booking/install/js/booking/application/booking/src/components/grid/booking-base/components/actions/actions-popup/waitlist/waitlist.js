import { BIcon as Icon, Set as IconSet, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';

import { LimitFeatureId, Model } from 'booking.const';
import { isRealId } from 'booking.lib.is-real-id';
import { limit } from 'booking.lib.limit';

import { dragActions } from 'booking.lib.drag';

import './waitlist.css';

// @vue/component
export const Waitlist = {
	name: 'BookingActionsPopupWaitlist',
	components: {
		Icon,
	},
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			IconSet,
			Outline,
		};
	},
	computed: {
		disabled(): boolean
		{
			return !isRealId(this.bookingId);
		},
		featureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingWaitlist;
		},
	},
	methods: {
		async toWaitList(): Promise<void>
		{
			if (this.disabled)
			{
				return;
			}

			if (!this.featureEnabled)
			{
				void limit.show(LimitFeatureId.Waitlist);

				return;
			}

			await dragActions.moveBookingToWaitList(this.bookingId);
		},
	},
	template: `
		<div
			class="booking--booking-actions-popup__item-waitlist-btn --end"
			:class="{
				'--disabled': disabled,
				'--locked': !featureEnabled,
			}"
			@click="toWaitList"
		>
			<Icon
				:name="featureEnabled ? IconSet.BLACK_CLOCK : Outline.LOCK_S"
				:size="20"
				:color="featureEnabled ? 'var(--ui-color-gray-60)': 'var(--ui-color-gray-40)'"
			/>
			<div class="booking-actions-popup__item-waitlist-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_LIST') }}
			</div>
		</div>
	`,
};
