/**
 * @module ui-system/layout/card/src/card-design-enum
 */
jn.define('ui-system/layout/card/src/card-design-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class BadgeCounterDesignType
	 * @template TBadgeModeType
	 * @extends {BaseEnum<BadgeCounterDesignType>}
	 */
	class CardDesign extends BaseEnum
	{
		static PRIMARY = new CardDesign('PRIMARY', {
			backgroundColor: Color.bgContentPrimary,
			accentColor: Color.accentMainPrimary,
		});

		static SECONDARY = new CardDesign('SECONDARY', {
			backgroundColor: Color.bgContentSecondary,
		});

		static ACCENT = new CardDesign('ACCENT', {
			backgroundColor: Color.accentSoftBlue2,
			accentColor: Color.accentMainPrimary,
		});

		static WARNING = new CardDesign('WARNING', {
			backgroundColor: Color.accentSoftOrange2,
			accentColor: Color.accentMainWarning,
		});

		static ALERT = new CardDesign('ALERT', {
			backgroundColor: Color.accentSoftRed2,
			accentColor: Color.accentMainAlert,
		});

		/**
		 * @param {Object} params
		 * @param {boolean} params.withPressed
		 * @returns {{backgroundColor: string, accentColor: string}}
		 */
		getStyle(params)
		{
			const { backgroundColor, accentColor } = this.getValue();

			const style = {
				backgroundColor: backgroundColor.toHex(),
				accentColor: accentColor?.toHex(),
			};
			if (params?.withPressed)
			{
				style.backgroundColor = backgroundColor.withPressed();
			}

			return style;
		}
	}

	module.exports = { CardDesign };
});
