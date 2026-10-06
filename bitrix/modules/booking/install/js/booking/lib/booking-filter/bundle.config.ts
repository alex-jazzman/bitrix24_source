import { type BundleConfig } from '@bitrix/chef';

export default {
	input: './src/index.ts',
	output: './dist/booking-filter.bundle.js',
	namespace: 'BX.Booking.Lib',
} as BundleConfig;
