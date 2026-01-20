/**
 * @module tokens/src/enums/style-enum
 */
jn.define('tokens/src/enums/style-enum', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @abstract
	 * @class StyleEnum
	 * @extends {BaseEnum<StyleEnum>}
	 */
	class StyleEnum extends BaseEnum
	{
		/**
		 * @public
		 */
		getValue()
		{
			const baseValue = super.getValue();

			if (baseValue)
			{
				return baseValue;
			}

			const localStyleValue = AppTheme.localStyles?.[this.getName()];
			if (localStyleValue)
			{
				return localStyleValue;
			}

			console.error(`The style "${this.getName()}" is not defined in the AppTheme styles`);

			return null;
		}
	}

	module.exports = {
		StyleEnum,
	};
});
