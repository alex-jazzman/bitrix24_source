/**
 * @module ui-system/form/buttons/button/src/design-enum
 */
jn.define('ui-system/form/buttons/button/src/design-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class ButtonDesign
	 * @template TButtonDesign
	 * @extends {BaseEnum<ButtonDesign>}
	 */
	class ButtonDesign extends BaseEnum
	{
		static FILLED = new ButtonDesign('FILLED', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.accentMainPrimary,
		});

		static TINTED = new ButtonDesign('TINTED', {
			color: Color.accentMainLink,
			backgroundColor: Color.accentSoftBlue2,
		});

		static OUTLINE = new ButtonDesign('OUTLINE', {
			color: Color.base2,
			borderColor: Color.base5,
			borderColorOpacity: 0.5,
		});

		static OUTLINE_ACCENT_1 = new ButtonDesign('OUTLINE_ACCENT_1', {
			color: Color.base1,
			borderColor: Color.accentMainPrimary,
		});

		static OUTLINE_ACCENT_2 = new ButtonDesign('OUTLINE_ACCENT_2', {
			color: Color.accentMainPrimary,
			borderColor: Color.accentMainPrimary,
			borderColorOpacity: 0.5,
		});

		static OUTLINE_NO_ACCENT = new ButtonDesign('OUTLINE_NO_ACCENT', {
			color: Color.base4,
			borderColor: Color.base5,
			borderColorOpacity: 0.5,
		});

		static PLAIN = new ButtonDesign('PLAIN', {
			color: Color.base2,
		});

		static PLAN_ACCENT = new ButtonDesign('PLAN_ACCENT', {
			color: Color.accentMainPrimary,
		});

		static PLAIN_NO_ACCENT = new ButtonDesign('PLAIN_NO_ACCENT', {
			color: Color.base4,
		});

		static #DISABLED = new ButtonDesign('DISABLED', {
			color: Color.base5,
			borderColor: Color.base6,
			backgroundColor: Color.base7,
		});

		static COPILOT = new ButtonDesign('COPILOT', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.copilotAccentPrimary,
		});

		static FILLED_BITRIX_GPT = new ButtonDesign('FILLED_BITRIX_GPT', {
			color: Color.baseWhiteFixed,
			backgroundColor: Color.bgBitrixGptGradient3,
			backgroundColorGradient: {
				colors: [
					Color.bgBitrixGptGradient6.toHex(),
					Color.bgBitrixGptGradient5.toHex(),
					Color.bgBitrixGptGradient4.toHex(),
					Color.bgBitrixGptLineGradient3.toHex(),
					Color.bgBitrixGptGradient2.toHex(),
					Color.bgBitrixGptGradient1.toHex(),
				],
				positions: [0, 0.18, 0.38, 0.57, 0.74, 0.88, 1],
				angle: 267,
			},
		});

		getStyle()
		{
			return this.getValue();
		}

		getDisabled()
		{
			return ButtonDesign.#DISABLED;
		}

		/**
		 * @return {number}
		 */
		getOpacity(style)
		{
			return this.getStyle()?.[`${style}Opacity`];
		}
	}

	module.exports = {
		ButtonDesign: ButtonDesign.export(),
	};
});
