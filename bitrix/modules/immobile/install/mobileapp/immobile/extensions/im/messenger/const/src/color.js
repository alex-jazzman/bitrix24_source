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
				ColorToken.textBitrixGptGradient1.toHex(),
				ColorToken.textBitrixGptGradient2.toHex(),
				ColorToken.textBitrixGptGradient3.toHex(),
				ColorToken.textBitrixGptGradient4.toHex(),
				ColorToken.textBitrixGptGradient5.toHex(),
			],
			positions: [0, 0.25, 0.5, 0.75, 1],
			angle: 90,
		},
	});

	module.exports = { Color };
});
