export default {
	input: 'src/index.ts',
	output: 'dist/main.popup.bundle.js',
	namespace: 'BX.Main',
	transformClasses: ['Popup', 'Menu', 'Button'],
	cssImages: {
		type: 'inline',
	},
};
