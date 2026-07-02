/**
 * @module ui-system/blocks/chips/chip-inner-tab/src/design-enum
 */
jn.define('ui-system/blocks/chips/chip-inner-tab/src/design-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Component } = require('tokens');

	/**
	 * @class ChipInnerTabDesign
	 * @template TChipInnerTabDesign
	 * @extends {BaseEnum<ChipInnerTabDesign>}
	 */
	class ChipInnerTabDesign extends BaseEnum
	{
		static OUTLINE = new ChipInnerTabDesign('OUTLINE', {
			borderWidth: Component.itbChipStroke.toNumber(),
		});

		static PLAIN = new ChipInnerTabDesign('PLAIN', {
			borderWidth: 0,
		});

		getBorderWidth()
		{
			return this.getValue().borderWidth;
		}
	}

	module.exports = {
		ChipInnerTabDesign: ChipInnerTabDesign.export(),
	};
});
