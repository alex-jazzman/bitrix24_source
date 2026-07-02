import browserVersionsPlugin from './plugins/browser-versions';

export default {
	input: './src/index.ts',
	output: './dist/baseline.bundle.js',
	namespace: 'BX',
	adjustConfigPhp: false,
	plugins: [
		browserVersionsPlugin(),
	],
};
