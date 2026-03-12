module.exports = {
	input: 'src/index.js',
	output: {
		js: 'dist/promo-boost.bundle.js',
		css: 'dist/promo-boost.bundle.css',
	},
	namespace: 'BX.Disk.PromoBoost',
	browserslist: true,
	minification: true,
	adjustConfigPhp: false,
};
