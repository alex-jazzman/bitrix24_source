import { createIndexHtml } from './src/create-index-html';

export default {
	input: './src/index.ts',
	output: 'dist/ui.text-editor.mobile.bundle.js',
	sourceMaps: false,
	minification: false,
	adjustConfigPhp: false,
	treeshake: false,
	protected: true,
	namespace: 'BX.UI.TextEditor',
	plugins: {
		custom: [
			createIndexHtml(),
		],
	},
	standalone: {
		exposeNamespaces: true,
		remap: {
			'ui.lexical.core': { npm: 'lexical', from: 'ui.lexical' },
			'ui.lexical.*': { npm: '@lexical/*', from: 'ui.lexical' },
		},
	},
	cssImages: {
		type: 'inline',
		maxSize: Infinity,
	},
};
