/**
 * @module more-menu/block/company/tariff-plate/subscription/floating-banner
 */
jn.define('more-menu/block/company/tariff-plate/subscription/floating-banner', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc/ai');
	const { requireLazy } = require('require-lazy');
	const { showErrorToast } = require('toast');
	const { FloatingPromo, getFloatingPromoReserve } = require('layout/ui/floating-promo');
	const { getAppFontScale, NORMAL_APP_FONT_SCALE } = require('more-menu/block/company/app-font-scale');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const DESCRIPTION_EXTENSION = 'more-menu/block/company/tariff-plate/subscription/description';

	const COLLAPSED_SIZE = 78;
	const EXPANDED_GRAPHIC_SIZE = 52;

	// Worked out of the layout of the card below rather than measured, so the layer states its frame from
	// the very first frame: every change of that layout has this number counted by hand anew. At the normal
	// scale that count came out under the floor of the layer - the collapsed button plus its minimal gap -
	// and is raised to it: below the floor the number never reaches the layout at all.
	const EXPANDED_HEIGHT = getAppFontScale() === NORMAL_APP_FONT_SCALE ? 82 : 86;

	const FLOATING_PROMO_PARAMS = {
		expandedHeight: EXPANDED_HEIGHT,
		collapsedHeight: COLLAPSED_SIZE,
		collapsedWidth: COLLAPSED_SIZE,
	};

	// The banner keeps one look in both themes, and a picture is what makes that possible: the tokens of
	// the gpt gradient are muted in the dark theme by design, and the family carries no fixed variant to
	// ask for instead. The image is stored outside the pair of the theme folders and is taken with the
	// theme switched off, so there is only one file and one look.
	const BACKGROUND_IMAGE = 'bg-bitrix-gpt.png';
	const BACKGROUND_LIBRARY = 'more-menu/tariff';
	// The graphic follows the background rather than the theme: the surface under it is now one bright
	// picture in both themes, and the dark variant of the graphic is drawn for a dark surface. Naming
	// the light folder in the library and switching the theme off keeps one file for both themes
	// without a copy of it outside the pair.
	const GRAPHIC_IMAGE = 'gpt-market.png';
	const GRAPHIC_LIBRARY = 'more-menu/tariff/light';
	const WITH_THEME = false;

	/**
	 * @extends {PureComponent<SubscriptionFloatingBannerProps>}
	 */
	class SubscriptionFloatingBannerComponent extends PureComponent
	{
		/**
		 * @param {SubscriptionFloatingBannerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			// the whole opening while it is on its way, see #openSubscription
			this.openRequest = null;
		}

		render()
		{
			const { testId, onCollapseStarted } = this.props;

			return FloatingPromo({
				testId,
				onCollapseStarted,
				...FLOATING_PROMO_PARAMS,
				expanded: ({ collapse }) => this.#renderExpanded(collapse),
				collapsed: () => this.#renderCollapsed(),
			});
		}

		/**
		 * @param {function(): void} collapse
		 */
		#renderExpanded(collapse)
		{
			// Collapsing is a reaction to a successful action, and the transition is one way: a card
			// collapsed on a flow that never opened would trade the promo for nothing.
			const openAndCollapse = async () => {
				if (await this.#openSubscription())
				{
					collapse();
				}
			};

			return Card(
				{
					testId: this.getTestId('expanded'),
					corner: CardCorner.XL,
					hideCross: false,
					crossColor: Color.baseWhiteFixed,
					onClose: collapse,
					onClick: openAndCollapse,
					style: {
						// fills the stated height of the floating layer instead of keeping its own
						flex: 1,
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: null,
						backgroundImage: makeLibraryImagePath(
							BACKGROUND_IMAGE,
							BACKGROUND_LIBRARY,
							undefined,
							WITH_THEME,
						),
						// the picture is wider than it is tall, and the card is wider still: cover keeps it
						// filling the whole surface and trims what does not fit
						backgroundResizeMode: 'cover',
					},
				},
				// Sized in place, unlike the collapsed graphic: the card row hands the rest of its width
				// to the text.
				this.#renderGraphic(this.getTestId('expanded-graphic'), {
					width: EXPANDED_GRAPHIC_SIZE,
					height: EXPANDED_GRAPHIC_SIZE,
				}),
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'column',
							marginLeft: Indent.M.toNumber(),
							// keeps the text clear of the cross the card draws over its top right corner
							marginRight: Indent.XL.toNumber(),
						},
					},
					Text3({
						testId: this.getTestId('expanded-title'),
						text: Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_FLOATING_TITLE'),
						color: Color.baseWhiteFixed,
						accent: true,
						numberOfLines: 2,
						ellipsize: 'end',
					}),
					Text5({
						testId: this.getTestId('expanded-subtitle'),
						text: Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_FLOATING_SUBTITLE'),
						color: Color.baseWhiteFixed,
						style: {
							marginTop: Indent.XS2.toNumber(),
						},
						numberOfLines: 1,
						ellipsize: 'end',
					}),
				),
			);
		}

		#renderCollapsed()
		{
			return View(
				{
					testId: this.getTestId('collapsed'),
					onClick: () => {
						void this.#openSubscription();
					},
					style: {
						// the size comes from the floating layer: the graphic has to follow the growth animation
						flex: 1,
						alignSelf: 'stretch',
					},
				},
				this.#renderGraphic(this.getTestId('collapsed-graphic'), {
					flex: 1,
					alignSelf: 'stretch',
				}),
			);
		}

		/**
		 * @param {string} testId
		 * @param {ElementStyle} style
		 */
		#renderGraphic(testId, style)
		{
			return Image({
				testId,
				uri: makeLibraryImagePath(GRAPHIC_IMAGE, GRAPHIC_LIBRARY, undefined, WITH_THEME),
				resizeMode: 'contain',
				style,
			});
		}

		/**
		 * Single entry point of the subscription flow: both states call it.
		 *
		 * One opening at a time, the whole of it and not only its import: the two states share the entry
		 * point, and a hurried double tap would otherwise walk past the import twice and raise two bottom
		 * sheets. The finished request is let go, so the next tap opens the flow anew.
		 * @returns {Promise<boolean>} whether the flow has been opened
		 */
		#openSubscription()
		{
			if (!this.openRequest)
			{
				this.openRequest = this.#requestSubscription().finally(() => {
					this.openRequest = null;
				});
			}

			return this.openRequest;
		}

		/**
		 * The flow behind the banner is brought in on the tap and not before: showing the promo would
		 * otherwise cost the whole screen of the subscription - its bottom sheet, forms and success state -
		 * to everyone who merely opens the menu.
		 *
		 * @deps more-menu/block/company/tariff-plate/subscription/description
		 * @returns {Promise<boolean>} whether the flow has been opened
		 */
		async #requestSubscription()
		{
			const { layout, subscription } = this.props;
			const { SubscriptionDescription } = await requireLazy(DESCRIPTION_EXTENSION, false) || {};

			if (!SubscriptionDescription)
			{
				showErrorToast(
					{ message: Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_FLOATING_OPEN_ERROR') },
					layout,
				);

				return false;
			}

			SubscriptionDescription.open(layout, { subscription });

			return true;
		}
	}

	SubscriptionFloatingBannerComponent.propTypes = {
		testId: PropTypes.string.isRequired,
		layout: PropTypes.object.isRequired,
		subscription: PropTypes.object.isRequired,
		onCollapseStarted: PropTypes.func,
	};

	module.exports = {
		/**
		 * @param {SubscriptionFloatingBannerProps} props
		 * @returns {SubscriptionFloatingBannerComponent}
		 */
		SubscriptionFloatingBanner: (props) => new SubscriptionFloatingBannerComponent(props),
		/**
		 * The room the banner takes of the content of the screen, of the very numbers the layer is given
		 * above: the screen holds a stub of it in the tail of its cards.
		 * @type {FloatingPromoReserve}
		 */
		SubscriptionFloatingBannerReserve: getFloatingPromoReserve(FLOATING_PROMO_PARAMS),
	};
});
