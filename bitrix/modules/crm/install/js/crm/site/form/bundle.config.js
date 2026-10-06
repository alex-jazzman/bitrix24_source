const fs = require('fs');
const path = require('path');

const vendorIntro = [
	'./babelhelpers/babel-external-helpers.js',
	'./src/vue/vue2.js',
]
	.map(file => fs.readFileSync(path.resolve(__dirname, file), 'utf8'))
	.join('\n\n\n');

module.exports = {
	input: './src/app.js',
	output: './dist/app.bundle.js',
	namespace: 'b24form',
	protected: true,
	adjustConfigPhp: false,
	transformClasses: true,
	sourceMaps: false,
	plugins: [
		{
			name: 'prepend-vendor-intro',
			intro: () => vendorIntro,
		},
	],
};
