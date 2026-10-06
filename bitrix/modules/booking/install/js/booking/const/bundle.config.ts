import { type BundleConfig } from '@bitrix/chef';

export default {
	input: './src/const.ts',
	output: './dist/const.bundle.js',
	namespace: 'BX.Booking.Const',
} as BundleConfig;
