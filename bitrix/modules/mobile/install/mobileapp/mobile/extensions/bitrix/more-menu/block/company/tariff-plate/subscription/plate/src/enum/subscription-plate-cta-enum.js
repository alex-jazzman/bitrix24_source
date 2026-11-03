/**
 * @module more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-cta-enum
 */
jn.define('more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-cta-enum', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');
	const { ChipButtonMode, ChipButtonDesign, ChipButtonSize } = require('ui-system/blocks/chips/chip-button');

	/**
	 * Purchase CTA presentation for the subscription card: the tinted accent of every call to action
	 * in the section, so the button of the card is not the odd one out. The call looks the same
	 * wherever it is drawn, so the preset owns the look outright and no state has a say in it.
	 *
	 * @extends {BaseEnum<SubscriptionPlateCtaEnum>}
	 */
	class SubscriptionPlateCtaEnum extends BaseEnum
	{
		static BUY = new SubscriptionPlateCtaEnum('buy', {
			text: Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_BUY'),
			chip: () => ({
				mode: ChipButtonMode.TINTED,
				design: ChipButtonDesign.PRIMARY,
				size: ChipButtonSize.L,
				rounded: false,
			}),
		});

		getText()
		{
			return this.getValue().text;
		}

		/**
		 * @return {object}
		 */
		getChipProps()
		{
			return this.getValue().chip();
		}
	}

	module.exports = { SubscriptionPlateCtaEnum: SubscriptionPlateCtaEnum.export() };
});
