/**
 * @module ui-system/blocks/chips/chip-button/src/design-enum
 */
jn.define('ui-system/blocks/chips/chip-button/src/design-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Color } = require('tokens');
	const { ChipButtonMode } = require('ui-system/blocks/chips/chip-button/src/mode-enum');

	/**
	 * @class ChipButtonDesign
	 * @template TChipButtonDesign
	 * @extends {BaseEnum<ChipButtonDesign>}
	 */
	class ChipButtonDesign extends BaseEnum
	{
		static PRIMARY = new ChipButtonDesign('PRIMARY', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.accentMainPrimary,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.accentSoftBorderBlue.toHex(),
				color: Color.accentMainPrimary,
			},
		});

		static SUCCESS = new ChipButtonDesign('SUCCESS', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.accentMainSuccess,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.accentSoftBorderGreen.toHex(),
				color: Color.accentMainSuccess,
			},
		});

		static ALERT = new ChipButtonDesign('ALERT', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.accentMainAlert,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.accentSoftBorderRed.toHex(),
				color: Color.accentMainAlert,
			},
		});

		static BLACK = new ChipButtonDesign('BLACK', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.base2,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.base5.toHex(),
				color: Color.base1,
			},
		});

		static GREY = new ChipButtonDesign('GREY', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.base4,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.base5.toHex(),
				color: Color.base3,
			},
		});

		static #DISABLED = new ChipButtonDesign('GREY', {
			[ChipButtonMode.SOLID]: {
				backgroundColor: Color.base7,
				color: Color.baseWhiteFixed,
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.base6.toHex(),
				color: Color.base6,
			},
		});

		static BITRIX_GPT = new ChipButtonDesign('BITRIX_GPT', {
			[ChipButtonMode.SOLID]: {
				backgroundColorGradient: {
					start: Color.bgBitrixGptLightGradient4.toHex(),
					middle: Color.bgBitrixGptLightGradient3.toHex(),
					end: Color.bgBitrixGptLightGradient1.toHex(),
					angle: 45,
				},
				colorGradient: {
					colors: [
						Color.bgBitrixGptGradient7,
						Color.bgBitrixGptGradient4,
						Color.bgBitrixGptGradient3,
						Color.bgBitrixGptGradient2,
						Color.bgBitrixGptGradient1,
					],
					angle: 225,
				},
			},
			[ChipButtonMode.OUTLINE]: {
				borderWidth: 1,
				borderColor: Color.bgBitrixGptLineGradient2.toHex(),
				colorGradient: {
					colors: [
						Color.bgBitrixGptGradient7,
						Color.bgBitrixGptGradient4,
						Color.bgBitrixGptGradient3,
						Color.bgBitrixGptGradient2,
						Color.bgBitrixGptGradient1,
					],
					angle: 225,
				},
			},
		});

		getDisabled()
		{
			return ChipButtonDesign.#DISABLED;
		}

		getStyle(mode)
		{
			const chipMode = ChipButtonMode.resolve(mode, ChipButtonMode.SOLID);

			return this.getValue()[chipMode.getValue()];
		}
	}

	module.exports = {
		ChipButtonDesign: ChipButtonDesign.export(),
	};
});
