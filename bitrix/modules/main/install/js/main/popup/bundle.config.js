module.exports = {
	input: 'src/index.js',
	output: 'dist/main.popup.bundle.js',
	namespace: 'BX.Main',
	transformClasses: ['Popup', 'Menu', 'Button'],
	cssImages: {
		type: 'inline',
	},
};
