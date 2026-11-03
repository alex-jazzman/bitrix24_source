/**
 * @module more-menu/block/company/tariff-plate/demo/plate
 */
jn.define('more-menu/block/company/tariff-plate/demo/plate', (require, exports, module) => {
	const { Component, Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { makeLibraryImagePath } = require('asset-manager');
	const { requireLazy } = require('require-lazy');
	const { isPurchaseAllowed } = require('utils/store');

	// box keeps the asset aspect ratio (288x247): in a square box `contain` letterboxes it and the
	// negative bottom margin pushes out empty space instead of the graphic
	const GRAPHIC_WIDTH = 115;
	const GRAPHIC_HEIGHT = 98;
	// The height the graphic hands to the row it stands in. The card is as tall as its tallest child,
	// so a graphic measured in full would make the card grow along with it; this keeps the card the
	// height it had at a 96x82 graphic and lets the drawing itself spill over the edges instead.
	const GRAPHIC_LAYOUT_HEIGHT = 82;
	// split between the two edges, so the graphic grows around its own centre rather than downwards
	const GRAPHIC_SPILL = (GRAPHIC_HEIGHT - GRAPHIC_LAYOUT_HEIGHT) / 2;
	const CHEVRON_SIZE = 24;
	const SUBTITLE_OPACITY = 0.75;

	/**
	 * Promo card offering the demo tariff. Whether it is shown at all is decided by the orchestrator.
	 *
	 * @extends {LayoutComponent<DemoPlateProps>}
	 */
	class DemoPlate extends LayoutComponent
	{
		/**
		 * @param {DemoPlateProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			this.onCardClick = this.#onCardClick.bind(this);
		}

		render()
		{
			return Card(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						// The mockup axis runs from the top left corner to the bottom right one. The native
						// angle starts from the x axis (0 points right), 90 behind the css one, so the 135deg
						// of the mockup becomes 45 here. The stops span the whole card: pinned at 0.8 and 1
						// they squeezed the whole transition into the last fifth and read as a flat fill with
						// a band along the edge.
						backgroundColorGradient: {
							colors: [Color.accentMainPrimaryalt.toHex(), Color.accentMainPrimary.toHex()],
							positions: [0, 1],
							angle: 45,
						},
					},
					corner: CardCorner.L,
					testId: this.getTestId('demo-card'),
					onClick: this.onCardClick,
				},
				View(
					{
						style: {
							flex: 1,
						},
						testId: this.getTestId('demo-texts'),
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
							},
							testId: this.getTestId('demo-title-row'),
						},
						Text2({
							testId: this.getTestId('demo-title'),
							text: Loc.getMessage('M_TARIFF_PLATE_ENABLE_DEMO'),
							color: Color.baseWhiteFixed,
							accent: true,
							style: {
								marginRight: Indent.XS.toNumber(),
							},
						}),
						IconView({
							testId: this.getTestId('demo-chevron'),
							icon: Icon.CHEVRON_TO_THE_RIGHT,
							color: Color.baseWhiteFixed,
							size: CHEVRON_SIZE,
						}),
					),
					Text5({
						style: {
							marginTop: Indent.XS2.toNumber(),
							// the quieter half of the pair: one color, told apart from the title by opacity
							color: Color.baseWhiteFixed.toHex(SUBTITLE_OPACITY),
						},
						testId: this.getTestId('demo-subtitle'),
						text: Loc.getMessage('M_TARIFF_PLATE_DEMO_SUBTITLE'),
					}),
				),
				// the negative bottom margin cancels the card padding below, so the graphic hangs over
				// the bottom edge; horizontally it stays within the padding, flush with the content
				Image({
					style: {
						width: GRAPHIC_WIDTH,
						height: GRAPHIC_HEIGHT,
						marginLeft: Indent.M.toNumber(),
						marginTop: -GRAPHIC_SPILL,
						marginBottom: -(Component.cardPaddingB.toNumber() + GRAPHIC_SPILL),
					},
					testId: this.getTestId('demo-graphic'),
					resizeMode: 'contain',
					uri: makeLibraryImagePath('zephyr-demo.png', 'more-menu/tariff'),
				}),
			);
		}

		/**
		 * Opens the demo tariff drawer (both platforms). Demo is a free trial, not a purchase, so no
		 * store takes the card away; the "Choose plan" call inside the drawer needs the flag of the
		 * server and a purchase that is allowed at all.
		 */
		#onCardClick()
		{
			const { layout, showPurchaseCta, isCtaForced } = this.props;

			void requireLazy('demo-activation/description')
				.then(({ DemoActivationDescription }) => DemoActivationDescription.open(layout, {
					showPurchaseCta: showPurchaseCta && isPurchaseAllowed(isCtaForced),
				}))
			;
		}
	}

	DemoPlate.propTypes = {
		layout: PropTypes.object.isRequired,
		showPurchaseCta: PropTypes.bool.isRequired,
		// left out by a caller with nothing forced: the purchase rule reads that as not forced
		isCtaForced: PropTypes.bool,
		testId: PropTypes.string,
	};

	module.exports = { DemoPlate };
});
