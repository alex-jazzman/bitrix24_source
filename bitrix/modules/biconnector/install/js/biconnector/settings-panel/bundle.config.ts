import type { BundleConfig } from '@bitrix/chef';

export default {
	input: './src/settings-panel.ts',
	output: {
		js: './dist/settings-panel.bundle.js',
		css: './dist/settings-panel.bundle.css',
	},
	namespace: 'BX.BIConnector',
	sourceMaps: true,
} satisfies BundleConfig;
