import type { BundleConfig } from '@bitrix/chef';

export default {
	input: './src/dev.d.ts',
	output: './dist/dev.bundle.js',
	namespace: 'BX.UI',
	browserslist: true,
	protected: true,
} as BundleConfig;
