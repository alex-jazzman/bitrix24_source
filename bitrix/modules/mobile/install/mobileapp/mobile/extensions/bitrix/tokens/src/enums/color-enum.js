/**
 * @module tokens/src/enums/color-enum
 */
jn.define('tokens/src/enums/color-enum', (require, exports, module) => {
	const { AppTheme } = require('apptheme/extended');
	const { withPressed, transparent } = require('utils/color');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class ColorEnum
	 * @extends {BaseEnum<ColorEnum>}
	 */
	class ColorEnum extends BaseEnum
	{
		withPressed()
		{
			return withPressed(this.toHex());
		}

		/**
		 * @param {number=} opacity
		 * @return {string}
		 */
		toHex(opacity)
		{
			if (typeof opacity !== 'undefined' && opacity < 1)
			{
				return transparent(this.toString(), opacity);
			}

			return this.toString();
		}

		/**
		 * @param {'light' | 'dark'} themeId
		 * @return {string}
		 */
		toHexByThemeId = (themeId = 'light') => AppTheme.getColorByThemeId(themeId)[this.getName()];
	}

	module.exports = { ColorEnum };
});
