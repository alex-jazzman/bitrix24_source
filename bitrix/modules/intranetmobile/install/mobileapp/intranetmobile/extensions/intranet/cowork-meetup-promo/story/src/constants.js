/**
 * @module intranet/cowork-meetup-promo/story/src/constants
 */
jn.define('intranet/cowork-meetup-promo/story/src/constants', (require, exports, module) => {
	const { Color } = require('tokens');

	// Provisional palette approximated from the layout export; the designer has not sent final values yet.
	// Angle follows the css convention: 180 is top to bottom.
	const BACKGROUND_GRADIENT = {
		start: '#e4ddfe',
		end: '#f8f6ff',
		angle: 180,
	};
	const TEXT_COLOR = new Color('custom', '#12112f');
	const BUTTON_COLOR = new Color('custom', '#ccf31e');

	module.exports = {
		BACKGROUND_GRADIENT,
		TEXT_COLOR,
		BUTTON_COLOR,
	};
});
