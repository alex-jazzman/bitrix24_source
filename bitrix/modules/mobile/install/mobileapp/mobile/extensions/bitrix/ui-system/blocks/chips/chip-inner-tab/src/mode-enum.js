/**
 * @module ui-system/blocks/chips/chip-inner-tab/src/mode-enum
 */
jn.define('ui-system/blocks/chips/chip-inner-tab/src/mode-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Component } = require('tokens');
	const { Icon } = require('ui-system/blocks/icon');

	/**
	 * @class ChipInnerTabMode
	 * @template TChipInnerTabMode
	 * @extends {BaseEnum<ChipInnerTabMode>}
	 */
	class ChipInnerTabMode extends BaseEnum
	{
		static ACTIVE = new ChipInnerTabMode('ACTIVE', {
			paddingRight: Component.itbChipPaddingLr.toNumber(),
			icon: null,
		});

		static LOCK = new ChipInnerTabMode('LOCK', {
			paddingRight: Component.itbChipPaddingLrLess.toNumber(),
			icon: Icon.LOCK,
		});

		getPaddingRight()
		{
			return this.getValue().paddingRight;
		}

		getIcon()
		{
			return this.getValue().icon;
		}
	}

	module.exports = {
		ChipInnerTabMode: ChipInnerTabMode.export(),
	};
});
