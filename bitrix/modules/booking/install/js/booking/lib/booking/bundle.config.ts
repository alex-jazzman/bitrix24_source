import { type BundleConfig } from '@bitrix/chef';

export default {
	input: './src/booking-service.ts',
	output: './dist/booking-service.bundle.js',
	namespace: 'BX.Booking.Lib',
} as BundleConfig;
