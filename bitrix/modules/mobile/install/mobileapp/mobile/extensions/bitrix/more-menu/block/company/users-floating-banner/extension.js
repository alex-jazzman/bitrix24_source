/**
 * @module more-menu/block/company/users-floating-banner
 */
jn.define('more-menu/block/company/users-floating-banner', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Loc } = require('loc');
	const { showErrorToast } = require('toast');
	const { Color, Indent } = require('tokens');
	const { Tourist } = require('tourist');
	const { requireLazy } = require('require-lazy');

	const { FloatingPromo, getFloatingPromoReserve } = require('layout/ui/floating-promo');
	const { getAppFontScale, NORMAL_APP_FONT_SCALE } = require('more-menu/block/company/app-font-scale');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text3, Text5 } = require('ui-system/typography/text');

	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const {
		CollapsedInviteButton,
		COLLAPSED_BUTTON_SIZE,
	} = require('more-menu/block/company/users-floating-banner/src/collapsed-button');

	const ANALYTICS_SECTION = 'ava_menu';
	const ICON_SIZE = 28;
	const DESCRIPTION_OPACITY = 0.8;
	const SHOWN_EVENT = 'mobile_users_floating_banner_shown';

	// Worked out of the layout of the card below rather than measured, so the layer states its frame from
	// the very first frame: every change of that layout has this number counted by hand anew.
	const EXPANDED_HEIGHT = getAppFontScale() === NORMAL_APP_FONT_SCALE ? 82 : 92;

	const FLOATING_PROMO_PARAMS = {
		expandedHeight: EXPANDED_HEIGHT,
		collapsedHeight: COLLAPSED_BUTTON_SIZE,
		collapsedWidth: COLLAPSED_BUTTON_SIZE,
		// the tab panel of the menu lies under the banner and has paid for the bottom safe area already
		safeArea: false,
	};

	/**
	 * @extends {PureComponent<UsersFloatingBannerProps>}
	 */
	class UsersFloatingBannerComponent extends PureComponent
	{
		/**
		 * @param {UsersFloatingBannerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			this.openInvite = this.openInvite.bind(this);
			// the whole opening while it is on its way, see openInvite
			this.openRequest = null;
		}

		componentDidMount()
		{
			if (Tourist.firstTime(SHOWN_EVENT))
			{
				Tourist.remember(SHOWN_EVENT);
			}
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
		 * @returns {object}
		 */
		#renderExpanded(collapse)
		{
			return Card(
				{
					testId: this.getTestId('expanded'),
					design: CardDesign.ACCENT,
					corner: CardCorner.XL,
					hideCross: false,
					crossColor: Color.baseWhiteFixed,
					style: {
						// fills the stated height of the floating layer instead of keeping its own
						flex: 1,
						// That height is counted for a description of two lines, and the card is a column: a
						// description of one line would leave the row against the top edge, over an empty band.
						justifyContent: 'center',
						// One saturated fill rather than a gradient, a step deeper than the primary accent the
						// invite banner of the messenger carries. `CardDesign.ACCENT` paints the soft blue of a
						// light card underneath, and this is what the banner shows instead.
						backgroundColor: Color.accentMainLink.toHex(),
					},
					onClick: () => {
						void this.#openInviteAndCollapse(collapse);
					},
					onClose: collapse,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					// the banner stands on a saturated fill now, so its icon and captions are the light
					// pair rather than the accent one they were over a white card
					IconView({
						testId: this.getTestId('expanded-icon'),
						icon: Icon.ADD_PERSON,
						size: ICON_SIZE,
						color: Color.baseWhiteFixed,
					}),
					View(
						{
							style: {
								flex: 1,
								marginLeft: Indent.M.toNumber(),
								// keeps the text clear of the cross the card draws over its top right corner
								marginRight: Indent.XL.toNumber(),
							},
						},
						Text3({
							testId: this.getTestId('expanded-title'),
							text: Loc.getMessage('MORE_MENU_COMPANY_USERS_FLOATING_BANNER_TITLE'),
							color: Color.baseWhiteFixed,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
						Text5({
							testId: this.getTestId('expanded-description'),
							text: Loc.getMessage('MORE_MENU_COMPANY_USERS_FLOATING_BANNER_DESCRIPTION'),
							style: {
								marginTop: Indent.XS2.toNumber(),
								// the quieter half of the pair: one color from the theme, told apart by opacity
								color: Color.baseWhiteFixed.toHex(DESCRIPTION_OPACITY),
							},
							numberOfLines: 2,
							ellipsize: 'end',
						}),
					),
				),
			);
		}

		/**
		 * @returns {object}
		 */
		#renderCollapsed()
		{
			return CollapsedInviteButton({
				testId: this.getTestId('collapsed'),
				onClick: this.openInvite,
			});
		}

		/**
		 * Single entry point of the invite flow: both states call it.
		 *
		 * One opening at a time, the whole of it and not only its import: the two states share the entry
		 * point, and a hurried double tap would otherwise walk past the import twice and raise two widgets.
		 * The finished request is let go, so the next tap opens the flow anew.
		 * @returns {Promise<boolean>} whether the invite widget has been opened
		 */
		openInvite()
		{
			if (!this.openRequest)
			{
				this.openRequest = this.#requestInvite().finally(() => {
					this.openRequest = null;
				});
			}

			return this.openRequest;
		}

		/**
		 * @returns {Promise<boolean>} whether the invite widget has been opened
		 */
		async #requestInvite()
		{
			const { layout } = this.props;
			const { openIntranetInviteWidget } = await requireLazy('intranet:invite-opener-new') || {};

			if (!openIntranetInviteWidget)
			{
				console.error('Invite opener not found');
				showErrorToast(
					{ message: Loc.getMessage('MORE_MENU_COMPANY_USERS_FLOATING_BANNER_INVITE_ERROR') },
					layout,
				);

				return false;
			}

			openIntranetInviteWidget({
				analytics: new AnalyticsEvent().setSection(ANALYTICS_SECTION),
				parentLayout: layout,
			});

			return true;
		}

		/**
		 * Collapsing is a reaction to a successful action, and the transition is one way: a card collapsed
		 * on a failed open would trade the promo for nothing, with no way back to the expanded state.
		 *
		 * @param {function(): void} collapse
		 * @returns {Promise<void>}
		 */
		async #openInviteAndCollapse(collapse)
		{
			if (await this.openInvite())
			{
				collapse();
			}
		}
	}

	UsersFloatingBannerComponent.propTypes = {
		testId: PropTypes.string.isRequired,
		layout: PropTypes.object.isRequired,
		onCollapseStarted: PropTypes.func,
	};

	module.exports = {
		/**
		 * @param {UsersFloatingBannerProps} props
		 * @returns {UsersFloatingBannerComponent}
		 */
		UsersFloatingBanner: (props) => new UsersFloatingBannerComponent(props),
		/**
		 * The room the banner takes of the content of the screen, of the very numbers the layer is given
		 * above: the screen holds a stub of it in the tail of its list.
		 * @type {FloatingPromoReserve}
		 */
		UsersFloatingBannerReserve: getFloatingPromoReserve(FLOATING_PROMO_PARAMS),
	};
});
