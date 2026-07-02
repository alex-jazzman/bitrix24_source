import { Event } from 'main.core';
import { EventName, LimitFeatureId } from 'booking.const';
import { limit } from 'booking.lib.limit';

export const lockedAnimationMixin = {
	data(): { isLockedAnimation: boolean }
	{
		return {
			isLockedAnimation: false,
		};
	},
	beforeMount(): void
	{
		if (!this.enabledFeature.bookingOverbooking || !this.enabledFeature.bookingWaitlist)
		{
			Event.EventEmitter.subscribe(EventName.StartLockedBookingAnimation, this.startLockBookingAnimation);
		}
	},
	unmounted(): void
	{
		Event.EventEmitter.unsubscribe(EventName.StartLockedBookingAnimation, this.startLockBookingAnimation);
	},
	methods: {
		startLockBookingAnimation(event): void
		{
			if (this.bookingId !== event.getData()?.bookingId)
			{
				return;
			}

			void this.$nextTick(() => {
				this.isLockedAnimation = true;

				setTimeout(() => {
					this.isLockedAnimation = false;

					void limit.show(event.getData()?.featureId ?? LimitFeatureId.Overbooking);
				}, 800);
			});
		},
	},
};
