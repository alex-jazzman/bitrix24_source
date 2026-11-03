module.exports = {
	input: 'src/widget.js',
	output: 'dist/widget.bundle.js',
	namespace: 'BX.Crm.RepeatSale',
	// Lowered because the popup background must not ride along in the always-loaded CSS.
	cssImages: {
		maxSize: 8,
	},
	browserslist: true,
};
