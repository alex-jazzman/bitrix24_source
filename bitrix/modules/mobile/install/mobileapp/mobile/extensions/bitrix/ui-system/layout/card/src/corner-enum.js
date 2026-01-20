/**
 * @module ui-system/layout/card/src/corner-enum
 */
jn.define('ui-system/layout/card/src/corner-enum', (require, exports, module) => {
	const { Component } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class CardCorner
	 * @template TCardCorner
	 * @extends {BaseEnum<CardCorner>}
	 */
	class CardCorner extends BaseEnum
	{
		static M = new CardCorner('M', Component.cardCorner);

		static L = new CardCorner('L', Component.cardCornerL);

		static XL = new CardCorner('XL', Component.cardCornerXL);
	}

	module.exports = {
		CardCorner: CardCorner.export(),
	};
});
