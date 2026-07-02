/**
 * @module ui-system/blocks/badges/button/src/design-enum
 */
jn.define('ui-system/blocks/badges/button/src/design-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class BadgeButtonDesign
	 */
	class BadgeButtonDesign extends BaseEnum
	{
		static GREY = new BadgeButtonDesign('GREY', {
			color: Color.base8,
			backgroundColor: Color.base5,
			borderColor: Color.base8,
		});

		static LIGHT = new BadgeButtonDesign('LIGHT', {
			color: Color.base4,
			backgroundColor: Color.base8,
			borderColor: Color.base8,
		});

		/**
		 *
		 * @returns {Color}
		 */
		getColor()
		{
			return this.getValue().color;
		}

		/**
		 *
		 * @returns {Color}
		 */
		getBackgroundColor()
		{
			return this.getValue().backgroundColor;
		}

		/**
		 *
		 * @returns {Color}
		 */
		getBorderColor()
		{
			return this.getValue().borderColor;
		}
	}

	module.exports = {
		BadgeButtonDesign: BadgeButtonDesign.export(),
	};
});
