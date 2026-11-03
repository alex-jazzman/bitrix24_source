/**
 * @module more-menu/block/company/purchases
 */
jn.define('more-menu/block/company/purchases', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Haptics } = require('haptics');

	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text5 } = require('ui-system/typography/text');

	const { openQRAuth } = require('qrauth/utils');
	const { PerfPoint } = require('debug/prism');

	const { withCurrentDomain } = require('utils/url');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');

	const PURCHASES_PATH = '/settings/order/';

	const ICON_SIZE = 24;
	const ICON_BOX_SIZE = 36;
	const CHEVRON_SIZE = 24;

	/**
	 * @class PurchasesSection
	 */
	class PurchasesSection extends PureComponent
	{
		/**
		 * @param props
		 * @param {object} props.layout
		 * @param {string} props.testId
		 * @param {function} [props.onCardClick] the card was tapped
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			return Card(
				{
					testId: this.getTestId('card'),
					// mock-up value: the cards of the section are split between L and XL corners
					corner: CardCorner.L,
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
					onClick: () => this.#openPurchases(),
				},
				View(
					{
						style: {
							flexDirection: 'row',
							// mock-up value: the rows of the section are split between center and flex-start
							alignItems: 'flex-start',
						},
					},
					this.#renderIcon(),
					View(
						{
							style: {
								flex: 1,
							},
						},
						Text2({
							testId: this.getTestId('title'),
							text: Loc.getMessage('MORE_MENU_COMPANY_PURCHASES_TITLE'),
							color: Color.base1,
							accent: true,
						}),
						Text5({
							testId: this.getTestId('subtitle'),
							text: Loc.getMessage('MORE_MENU_COMPANY_PURCHASES_SUBTITLE'),
							color: Color.base2,
							style: {
								marginTop: Indent.XS2.toNumber(),
							},
						}),
					),
					this.#renderChevron(),
				),
			);
		}

		#renderIcon()
		{
			return View(
				{
					testId: this.getTestId('icon-box'),
					style: {
						width: ICON_BOX_SIZE,
						height: ICON_BOX_SIZE,
						borderRadius: ICON_BOX_SIZE / 2,
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: Indent.M.toNumber(),
						// mock-up colors: every card of the section carries its own accent
						backgroundColorGradient: {
							angle: 135,
							start: Color.accentSoftOrange3.toHex(),
							end: Color.accentSoftOrange1.toHex(),
						},
					},
				},
				IconView({
					testId: this.getTestId('icon'),
					icon: Icon.INVOICE,
					// the orange the design system itself pairs with a soft orange background, and the only
					// one filled in every palette - `accentExtraOrange` is white in the older two, which
					// an app that has not been restarted after a switch of the theme still runs on
					color: Color.accentMainWarning,
					size: ICON_SIZE,
				}),
			);
		}

		#renderChevron()
		{
			return IconView({
				testId: this.getTestId('chevron'),
				icon: Icon.CHEVRON_TO_THE_RIGHT,
				color: Color.base4,
				size: CHEVRON_SIZE,
				style: {
					marginLeft: Indent.XS.toNumber(),
					// the row is aligned to its top, so the chevron is nudged onto the line of the title
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		#openPurchases()
		{
			this.props.onCardClick?.();

			Haptics.impactLight();

			// covers the lazy load of the qrauth extension, which the section does not bundle
			const point = new PerfPoint('Purchases Open', 'qr screen').start();

			// the web section stays out of the app: the QR screen logs the user in on the desktop
			openQRAuth({
				layout: this.props.layout,
				redirectUrl: withCurrentDomain(PURCHASES_PATH),
				showHint: true,
				hintText: Loc.getMessage('MORE_MENU_COMPANY_PURCHASES_QR_HINT'),
				// analyticsSection is omitted on purpose: it names the section of the qr screen of its own
				// owner, and the section the card is drawn in is the knowledge of that owner and not of it
			})
				.finally(() => point.end())
				.catch(console.error)
			;
		}
	}

	PurchasesSection.propTypes = {
		layout: PropTypes.object.isRequired,
		testId: PropTypes.string.isRequired,
		// the section listens to the tap; nobody else mounting the card hands the handler over
		onCardClick: PropTypes.func,
	};

	module.exports = { PurchasesSection };
});
