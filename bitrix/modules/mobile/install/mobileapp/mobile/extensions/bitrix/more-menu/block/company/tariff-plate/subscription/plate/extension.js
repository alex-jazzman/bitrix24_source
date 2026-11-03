/**
 * @module more-menu/block/company/tariff-plate/subscription/plate
 */
jn.define('more-menu/block/company/tariff-plate/subscription/plate', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc/ai');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { ChipButton } = require('ui-system/blocks/chips/chip-button');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { isPurchaseAllowed } = require('utils/store');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { openTariffPlanTable } = require('tariff-plan-table');
	const {
		SubscriptionPlateStateEnum,
	} = require('more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-state-enum');

	// box keeps the asset aspect ratio (242x176), so `contain` fills it instead of letterboxing: the
	// width follows the height rather than being named on its own, and the pair stays honest whenever
	// the height changes
	const GRAPHIC_ASPECT_RATIO = 242 / 176;
	const GRAPHIC_HEIGHT = 48;
	const GRAPHIC_WIDTH = Math.round(GRAPHIC_HEIGHT * GRAPHIC_ASPECT_RATIO);
	// The asset carries 17 transparent pixels of its 242 on either side, and at this height they scale
	// into five points of emptiness before the drawing starts. The tariff icons of the cards above sit
	// on the same vertical but are drawn almost edge to edge, so the untouched box reads as a graphic
	// nudged to the right. The margin gives those five points back and puts both on one line.
	const GRAPHIC_TRANSPARENT_INSET = Math.round((17 / 176) * GRAPHIC_HEIGHT);

	// Where the column of the text begins: the drawing starts at the very edge of the content box (the box
	// of the graphic is pulled left by its own transparent inset) and the gap follows it. The line of the
	// state stands under that column rather than in it, so that the date keeps the width of the whole card
	// and its year stays on the line.
	const TEXT_COLUMN_OFFSET = GRAPHIC_WIDTH - GRAPHIC_TRANSPARENT_INSET + Indent.L.toNumber();

	/**
	 * @extends {LayoutComponent<SubscriptionPlateProps>}
	 */
	class SubscriptionPlate extends LayoutComponent
	{
		/**
		 * @param {SubscriptionPlateProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
		}

		render()
		{
			const { subscription } = this.props;

			const state = SubscriptionPlateStateEnum.fromCode(subscription?.state);
			const imageUri = state.getImageUri();
			const subtitle = state.getSubtitle({ expireText: subscription?.expireText });
			const cta = state.getCta();
			const shouldShowCta = cta
				&& subscription?.cta
				&& subscription?.canBuy
				&& isPurchaseAllowed(subscription?.ctaForced);

			return Card(
				{
					testId: this.getTestId('subscription-card'),
					border: true,
					borderColor: getCardBorderColor(),
					style: {
						flexDirection: 'column',
					},
					corner: CardCorner.L,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					imageUri && Image({
						testId: this.getTestId('subscription-graphic'),
						style: {
							width: GRAPHIC_WIDTH,
							height: GRAPHIC_HEIGHT,
							marginLeft: -GRAPHIC_TRANSPARENT_INSET,
						},
						resizeMode: 'contain',
						uri: imageUri,
					}),
					View(
						{
							style: {
								flex: 1,
								flexDirection: 'column',
								marginLeft: Indent.L.toNumber(),
							},
						},
						Text3({
							testId: this.getTestId('subscription-title-brand'),
							text: Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_BRAND'),
							colorGradient: {
								colors: [
									Color.textBitrixGptGradient6.toHex(),
									Color.textBitrixGptGradient5.toHex(),
									Color.textBitrixGptGradient4.toHex(),
									Color.textBitrixGptGradient3.toHex(),
									Color.textBitrixGptGradient2.toHex(),
									Color.textBitrixGptGradient1.toHex(),
								],
								angle: 267,
							},
							numberOfLines: 1,
						}),
						Text3({
							testId: this.getTestId('subscription-title-market'),
							text: `+ ${Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_MARKET')}`,
							color: Color.base1,
							numberOfLines: 1,
						}),
					),
					shouldShowCta && ChipButton({
						style: {
							marginLeft: Indent.L.toNumber(),
						},
						testId: this.getTestId('subscription-cta'),
						...cta.getChipProps(),
						text: cta.getText(),
						// the subscription is sold as part of a plan, so its call leads to the same table
						// the tariff card opens
						onClick: () => openTariffPlanTable({ parentWidget: this.props.layout }),
					}),
				),
				// The line of the state stands under the row, lined up with the name of the product: on the
				// line of the name itself it crowded the name out, and drawn as a badge over the graphic it
				// covered a third of the drawing.
				subtitle && Text5({
					testId: this.getTestId('subscription-subtitle'),
					text: subtitle.text,
					color: subtitle.color,
					numberOfLines: 1,
					style: {
						marginTop: Indent.XS.toNumber(),
						marginLeft: TEXT_COLUMN_OFFSET,
					},
				}),
			);
		}
	}

	SubscriptionPlate.propTypes = {
		layout: PropTypes.object.isRequired,
		subscription: PropTypes.object,
		testId: PropTypes.string,
	};

	module.exports = {
		SubscriptionPlate,
		SubscriptionState: SubscriptionPlateStateEnum,
	};
});
