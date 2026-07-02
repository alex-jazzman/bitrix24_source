/**
 * @module ui-system/blocks/chips/chip-inner-tab/src/badge-type-enum
 */
jn.define('ui-system/blocks/chips/chip-inner-tab/src/badge-type-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Loc } = require('loc');
	const { BadgeCounterDesign } = require('ui-system/blocks/badges/counter');

	/**
	 * @class ChipInnerTabBadgeType
	 * @template TChipInnerTabBadgeType
	 * @extends {BaseEnum<ChipInnerTabBadgeType>}
	 */
	class ChipInnerTabBadgeType extends BaseEnum
	{
		static NEW = new ChipInnerTabBadgeType('NEW', {
			text: Loc.getMessage('MOBILE_UI_SYSTEM_BLOCKS_CHIPS_CHIP_INNER_TAB_BADGE_NEW'),
			design: BadgeCounterDesign.SUCCESS,
		});

		static COMING_SOON = new ChipInnerTabBadgeType('COMING_SOON', {
			text: Loc.getMessage('MOBILE_UI_SYSTEM_BLOCKS_CHIPS_CHIP_INNER_TAB_BADGE_COMING_SOON'),
			design: BadgeCounterDesign.PRIMARY,
		});

		getText()
		{
			return this.getValue().text;
		}

		getDesign()
		{
			return this.getValue().design;
		}
	}

	module.exports = {
		ChipInnerTabBadgeType: ChipInnerTabBadgeType.export(),
	};
});
