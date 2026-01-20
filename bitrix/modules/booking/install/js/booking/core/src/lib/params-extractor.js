import type { EnabledFeatures } from 'booking.model.interface';

import type { BookingParams } from '../types';

const featuresMap = Object.freeze({
	booking: 'booking',
	booking_calendar: 'bookingCalendar',
	booking_waitlist: 'bookingWaitlist',
	booking_overbooking: 'bookingOverbooking',
	booking_multi: 'bookingMulti',
	booking_crm_slider: 'bookingCrmSlider',
	booking_notifications_settings: 'bookingNotificationsSettings',
});

export function extractFeatures({ features }: BookingParams): EnabledFeatures
{
	const enabledFeature: EnabledFeatures = {
		booking: false,
		bookingCalendar: false,
		bookingWaitlist: false,
		bookingOverbooking: false,
		bookingCrmSlider: false,
		bookingMulti: false,
		bookingNotificationsSettings: false,
	};

	for (const feature of features)
	{
		if (!(feature.id in featuresMap))
		{
			void console.error(`Extracting feature name ${feature.id} not found.`);
		}

		enabledFeature[featuresMap[feature.id]] = Boolean(feature.isEnabled);
	}

	return enabledFeature;
}
