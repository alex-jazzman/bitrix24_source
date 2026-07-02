/**
 * @module ui-system/blocks/badges/counter/src/design-enum
 */
jn.define('ui-system/blocks/badges/counter/src/design-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class BadgeCounterDesign
	 * @template TBadgeCounterDesign
	 * @extends {BaseEnum<BadgeCounterDesign>}
	 */
	class BadgeCounterDesign extends BaseEnum
	{
		static PRIMARY = new BadgeCounterDesign('PRIMARY', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainPrimary,
		});

		static PRIMARY_EFFECTIVINESS = new BadgeCounterDesign('PRIMARY', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainWarning,
		});

		static ALERT = new BadgeCounterDesign('ALERT', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainAlert,
		});

		static WHITE_ALERT = new BadgeCounterDesign('WHITE_ALERT', {
			color: Color.accentMainAlert,
			backgroundColor: Color.baseWhiteFixed,
		});

		static SUCCESS = new BadgeCounterDesign('SUCCESS', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainSuccess,
		});

		// todo use proper tokens
		static COLLAB_SUCCESS = new BadgeCounterDesign('COLLAB_SUCCESS', {
			color: Color.baseWhiteFixed,
			backgroundColor: new Color('collabSuccess', '#19CC45'),
		});

		static GREY = new BadgeCounterDesign('GREY', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.base5,
		});

		static LIGHT_GREY = new BadgeCounterDesign('LIGHT_GREY', {
			color: Color.base3,
			backgroundColor: Color.base7,
		});

		static LIGHT_GREY_ACCENT = new BadgeCounterDesign('LIGHT_GREY_ACCENT', {
			color: Color.base4,
			backgroundColor: Color.base7,
		});

		static LIGHT_GREY_NAVIGATION = new BadgeCounterDesign('LIGHT_GREY_NAVIGATION', {
			color: Color.base5,
			backgroundColor: Color.base7,
		});

		static WHITE = new BadgeCounterDesign('WHITE', {
			color: Color.base3,
			backgroundColor: Color.baseWhiteFixed,
		});

		static COPILOT = new BadgeCounterDesign('COPILOT', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainCopilot,
		});

		static BITRIX_GPT_SOLID = new BadgeCounterDesign('BITRIX_GPT_SOLID', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainCopilot,
			backgroundColorGradient: {
				colors: [
					Color.bgBitrixGptGradient1.toHex(),
					Color.bgBitrixGptGradient2.toHex(),
					Color.bgBitrixGptGradient3.toHex(),
					Color.bgBitrixGptGradient4.toHex(),
					Color.bgBitrixGptGradient5.toHex(),
				],
				angle: 90,
			},
		});

		static BITRIX_GPT_TINTED = new BadgeCounterDesign('BITRIX_GPT_TINTED', {
			color: Color.accentMainCopilot,
			colorGradient: {
				colors: [
					Color.bgBitrixGptGradient1.toHex(),
					Color.bgBitrixGptGradient2.toHex(),
					Color.bgBitrixGptGradient3.toHex(),
					Color.bgBitrixGptGradient4.toHex(),
					Color.bgBitrixGptGradient5.toHex(),
				],
				angle: 90,
			},
			backgroundColor: Color.bgBitrixGptLightGradient1,
			backgroundColorGradient: {
				colors: [
					Color.bgBitrixGptLightGradient1.toHex(),
					Color.bgBitrixGptLightGradient2.toHex(),
					Color.bgBitrixGptLightGradient3.toHex(),
					Color.bgBitrixGptLightGradient4.toHex(),
				],
				angle: 90,
			},
		});

		getColor()
		{
			return this.getValue().color;
		}

		getColorGradient()
		{
			return this.getValue().colorGradient;
		}

		getBackgroundColor()
		{
			return this.getValue().backgroundColor;
		}

		getBackgroundColorGradient()
		{
			return this.getValue().backgroundColorGradient;
		}
	}

	module.exports = { BadgeCounterDesign };
});
