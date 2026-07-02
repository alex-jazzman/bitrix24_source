/**
 * @module im/messenger/const/color
 */
jn.define('im/messenger/const/color', (require, exports, module) => {
	const { Color: ColorToken } = require('tokens');

	const Color = Object.freeze({
		base: '#17a3ea',
		transparent: 'transparent',
		copilotGradient: {
			colors: [
				ColorToken.bgBitrixGptGradient1.toHex(),
				ColorToken.bgBitrixGptGradient2.toHex(),
				ColorToken.bgBitrixGptGradient3.toHex(),
				ColorToken.bgBitrixGptGradient4.toHex(),
				ColorToken.bgBitrixGptGradient5.toHex(),
			],
			positions: [0, 0.25, 0.5, 0.75, 1],
			angle: 90,
		},
	});

	module.exports = { Color };
});
