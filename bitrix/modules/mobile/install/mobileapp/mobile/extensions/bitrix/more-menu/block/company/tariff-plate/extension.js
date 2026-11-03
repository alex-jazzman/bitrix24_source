/**
 * @module more-menu/block/company/tariff-plate
 */
jn.define('more-menu/block/company/tariff-plate', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Color, Component, Indent } = require('tokens');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { ChipButton } = require('ui-system/blocks/chips/chip-button');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { makeLibraryImagePath } = require('asset-manager');
	const { isPurchaseAllowed } = require('utils/store');

	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { TariffPlateStateEnum } = require('more-menu/block/company/tariff-plate/src/enum/tariff-plate-state-enum');
	const { resolveCardSet } = require('more-menu/block/company/tariff-plate/src/card-set');
	const { DemoPlate } = require('more-menu/block/company/tariff-plate/demo/plate');
	const {
		SubscriptionPlate,
		SubscriptionState,
	} = require('more-menu/block/company/tariff-plate/subscription/plate');
	const { openTariffPlanTable } = require('tariff-plan-table');

	const TARIFF_IMAGE_SIZE = 44;
	const TARIFF_EXTRA_VERTICAL_PADDING = 2;

	// The backgrounds that carry a picture of their own rather than a plain tone: only those ask for the
	// runs of light along the sides, the rest of the family backgrounds carry their own light.
	const RICH_BACKGROUNDS = new Set(['bg-ent']);
	const SIDE_GLOW_WIDTH = '24%';
	// The light entering the edges of the plate: one run per side, white at the very edge and gone by
	// the end of its width. White in both themes, and at the strength each theme means by a lit edge -
	// no single token carries both, so the pair is picked here: the stroke of an avatar keeps one white
	// for both themes, the stroke of a card keeps the strength of the theme but turns blue in the light
	// one. Nothing is `techOpacity`, transparent white in every theme.
	const getSideGlowLit = () => (AppTheme.id === 'dark'
		? Color.cardStrokeGradient1
		: Color.avatarStrokeGradient1
	);

	/**
	 * Renders the cards of the tariff domain out of the payload of the block (props.tariffPlate), which the
	 * owner that mounted the block hands over. Which of the cards the payload calls for is decided by the
	 * rule of the card set alone; an empty set means there is nothing to draw here.
	 *
	 * @extends {LayoutComponent<TariffPlateProps>}
	 */
	class TariffPlate extends LayoutComponent
	{
		/**
		 * @param {TariffPlateProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			this.handleCardClick = this.handleCardClick.bind(this);
		}

		render()
		{
			const { tariffPlate } = this.props;
			const { tariff, subscription } = tariffPlate ?? {};
			const cards = resolveCardSet(tariffPlate, SubscriptionState, isPurchaseAllowed(tariff?.ctaForced));

			if (!cards.tariff && !cards.demo && !cards.subscription)
			{
				return null;
			}

			const plates = [
				cards.tariff && this.#renderTariffCard(),
				cards.demo && this.#renderDemoCard(tariff),
				cards.subscription && this.#renderSubscriptionCard(subscription),
			].filter(Boolean);

			return View(
				{
					testId: this.getTestId('container'),
					style: {
						flexDirection: 'column',
					},
				},
				// the gap belongs to the column and not to a card: which card comes first depends on the
				// payload, and a top margin of its own would show up above the whole block
				...plates.map((plate, index) => (index === 0 ? plate : TariffPlate.#withGapAbove(plate))),
			);
		}

		/**
		 * @param {object} plate
		 * @return {object}
		 */
		static #withGapAbove(plate)
		{
			return View(
				{
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				plate,
			);
		}

		/**
		 * Unified tariff card for all states.
		 */
		#renderTariffCard()
		{
			const { tariff } = this.props.tariffPlate;
			const { state, name, family, expireText, daysLeft } = tariff;

			const tariffState = TariffPlateStateEnum.fromCode(state);
			const imageName = tariffState.getImage(family);
			const backgroundName = tariffState.getBackground(family);
			const subtitle = tariffState.getSubtitle()?.build({ expireText, daysLeft, tariffName: name }) ?? null;

			return Card(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						overflow: 'hidden',
						// the plate stands taller than a plain card of the design system: the background it
						// carries needs the content off its edges
						paddingTop: Component.cardPaddingT.toNumber() + TARIFF_EXTRA_VERTICAL_PADDING,
						paddingBottom: Component.cardPaddingB.toNumber() + TARIFF_EXTRA_VERTICAL_PADDING,
					},
					corner: CardCorner.L,
					border: true,
					borderColor: getCardBorderColor(),
					testId: this.getTestId('tariff-card'),
				},
				this.#renderBackground(backgroundName),
				...this.#renderSideGlow(backgroundName),
				this.#renderImage(imageName),
				this.#renderContent(tariffState, name, subtitle),
			);
		}

		#renderBackground(backgroundName)
		{
			return Image({
				style: {
					position: 'absolute',
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
				},
				resizeMode: 'cover',
				uri: makeLibraryImagePath(`${backgroundName}.png`, 'more-menu/tariff'),
			});
		}

		/**
		 * The two runs of light along the sides. Each one sits over the background and under everything
		 * else, and takes no taps: the whole plate is one target.
		 *
		 * @param {string} backgroundName
		 * @return {Array<object>}
		 */
		#renderSideGlow(backgroundName)
		{
			if (!RICH_BACKGROUNDS.has(backgroundName))
			{
				return [];
			}

			const rightwards = 90;
			const lit = getSideGlowLit().toHex();
			const gone = Color.techOpacity.toHex();

			return [
				{ left: 0, colors: [lit, gone] },
				{ right: 0, colors: [gone, lit] },
			].map(({ colors, ...side }) => View({
				clickable: false,
				style: {
					position: 'absolute',
					top: 0,
					bottom: 0,
					...side,
					width: SIDE_GLOW_WIDTH,
					backgroundColorGradient: {
						colors,
						positions: [0, 1],
						angle: rightwards,
					},
				},
			}));
		}

		#renderImage(imageName)
		{
			return Image({
				style: {
					width: TARIFF_IMAGE_SIZE,
					height: TARIFF_IMAGE_SIZE,
				},
				testId: this.getTestId('tariff-icon'),
				resizeMode: 'contain',
				uri: makeLibraryImagePath(`${imageName}.png`, 'more-menu/tariff'),
			});
		}

		/**
		 * Card content: the captions and the purchase CTA are elements of one wrapping row, so the
		 * button stands to the right of the captions while the width allows and drops to a line of
		 * its own when it does not.
		 *
		 * @param {TariffPlateStateEnum} tariffState
		 * @param {string} name
		 * @param {{text: string, color: object}|null} subtitle
		 */
		#renderContent(tariffState, name, subtitle)
		{
			const { cta, ctaForced } = this.props.tariffPlate.tariff;
			const showPurchaseCta = cta && isPurchaseAllowed(ctaForced);

			// The heading is the big line of the card, except where the state hands that role to the
			// subtitle: there the two swap their type, the accent and the color along with it. The quiet
			// line of such a card reads as the expiry date of the others - same size, same muted color.
			const isSubtitleLeading = tariffState.isSubtitleLeading();
			const TitleText = isSubtitleLeading ? Text5 : Text2;
			const SubtitleText = isSubtitleLeading ? Text2 : Text5;
			const titleColor = isSubtitleLeading ? Color.base2 : Color.base1;

			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'row',
						flexWrap: 'wrap',
						alignItems: 'center',
						// the left gap parts the texts from the image and is the row's own; on the right the
						// padding of the card is the whole indent, and the button stands as far from that edge
						// as the image does from the other one
						marginLeft: Indent.L.toNumber(),
					},
				},
				View(
					{
						// the captions are a single item of the row, and one that gives no width back: with
						// nothing in the row left to pay for the width that is short, the button wraps under
						// both of them at once instead of squeezing the name beside itself.
						// The gap to the button is theirs and not the button's: a margin of the button
						// would indent it from the captions once it wraps onto a line of its own
						style: {
							flexGrow: 1,
							flexShrink: 0,
							marginRight: Indent.L.toNumber(),
						},
					},
					TitleText({
						testId: this.getTestId('tariff-name'),
						text: tariffState.getTitle(name),
						color: titleColor,
						accent: !isSubtitleLeading,
						numberOfLines: 1,
						ellipsize: 'end',
					}),
					subtitle && SubtitleText({
						style: {
							marginTop: Indent.XS2.toNumber(),
						},
						testId: this.getTestId('tariff-subtitle'),
						text: subtitle.text,
						color: subtitle.color,
						accent: isSubtitleLeading,
					}),
				),
				showPurchaseCta && this.#renderCta(),
			);
		}

		/**
		 * Every state calls with a chip of its own fill, so nothing here depends on the background of the
		 * card any more: a chip carries its own surface and is read over the picture as it is.
		 *
		 * @return {object}
		 */
		#renderCta()
		{
			const { state } = this.props.tariffPlate.tariff;

			const tariffState = TariffPlateStateEnum.fromCode(state);
			const ctaPreset = tariffState.getCta();

			return ChipButton({
				testId: this.getTestId('tariff-cta'),
				text: ctaPreset.getText(),
				onClick: this.handleCardClick,
				...ctaPreset.getViewProps(),
				// no element of the row gives way, the button least of all; the top margin is the gap it
				// keeps once it wraps onto a line of its own
				style: {
					flexShrink: 0,
					marginTop: Indent.M.toNumber(),
				},
			});
		}

		handleCardClick()
		{
			this.props.onCardClick?.();
			const tariffState = TariffPlateStateEnum.fromCode(this.props.tariffPlate.tariff.state);
			openTariffPlanTable({
				parentWidget: this.props.layout,
				tariffFocus: tariffState === TariffPlateStateEnum.ALMOST_EXPIRED ? 'upsell' : null,
			});
		}

		/**
		 * @param {TariffData|DemoTariffData} tariff
		 */
		#renderDemoCard(tariff)
		{
			return new DemoPlate({
				showPurchaseCta: Boolean(tariff.cta),
				isCtaForced: Boolean(tariff.ctaForced),
				layout: this.props.layout,
				// DemoPlate already prefixes its own locators with `demo-`
				testId: this.getTestId(),
			});
		}

		/**
		 * @param {SubscriptionData} subscription
		 */
		#renderSubscriptionCard(subscription)
		{
			return new SubscriptionPlate({
				layout: this.props.layout,
				subscription,
				testId: this.getTestId('subscription'),
			});
		}
	}

	TariffPlate.propTypes = {
		layout: PropTypes.object.isRequired,
		tariffPlate: PropTypes.object,
		testId: PropTypes.string,
		// listened to by the section; nobody else mounting the block hands it over
		onCardClick: PropTypes.func,
	};

	module.exports = {
		TariffPlate,
		// the rule of the card set is public: the parent block mounts single cards of the block on its own
		resolveCardSet,
	};
});
