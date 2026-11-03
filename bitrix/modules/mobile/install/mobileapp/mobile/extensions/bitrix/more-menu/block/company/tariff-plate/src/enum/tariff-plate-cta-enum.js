/**
 * @module more-menu/block/company/tariff-plate/src/enum/tariff-plate-cta-enum
 */
jn.define('more-menu/block/company/tariff-plate/src/enum/tariff-plate-cta-enum', (require, exports, module) => {
	const { ChipButtonMode, ChipButtonSize } = require('ui-system/blocks/chips/chip-button');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Purchase CTA presentation for the tariff plate. A preset carries the props of the single chip
	 * button rendered in the tariff card. Every label wears a fill of its own, so a label never appears
	 * in two colours: buying is green, renewing an expiring plan is blue, upgrading a paid one is
	 * outlined. Urgency stays with the card - its background, its subtitle and its icon.
	 *
	 * @extends {BaseEnum<TariffPlateCtaEnum>}
	 */
	class TariffPlateCtaEnum extends BaseEnum
	{
		static BUY = new TariffPlateCtaEnum('buy', {
			text: Loc.getMessage('M_TARIFF_PLATE_BUY_TARIFF'),
			chip: () => ({
				mode: ChipButtonMode.SOLID,
				size: ChipButtonSize.L,
				rounded: false,
				backgroundColor: Color.accentMainSuccess,
			}),
		});

		// The paid plans call to take more, and there the call is a button as well: as a plain link it was
		// the lightest thing on the screen, lighter than the promos beside it. Its surface is the one of
		// the theme - white in the light one - and the hairline comes with the preset: a plain white fill
		// of our own could not be told from the picture of the card underneath.
		static UPGRADE = new TariffPlateCtaEnum('upgrade', {
			text: Loc.getMessage('M_TARIFF_PLATE_UPGRADE_TARIFF'),
			chip: () => ({
				mode: ChipButtonMode.OUTLINE,
				size: ChipButtonSize.L,
				rounded: false,
			}),
		});

		// A plan whose term runs out is renewed, not bought anew, so the label differs from BUY together
		// with the fill: one label never wears two colours.
		static RENEW = new TariffPlateCtaEnum('renew', {
			text: Loc.getMessage('M_TARIFF_PLATE_RENEW_TARIFF'),
			chip: () => ({
				mode: ChipButtonMode.SOLID,
				size: ChipButtonSize.L,
				rounded: false,
				backgroundColor: Color.accentMainPrimary,
			}),
		});

		getText()
		{
			return this.getValue().text;
		}

		/**
		 * @return {object}
		 */
		getViewProps()
		{
			return this.getValue().chip();
		}
	}

	module.exports = { TariffPlateCtaEnum: TariffPlateCtaEnum.export() };
});
