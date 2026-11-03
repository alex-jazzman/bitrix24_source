/**
 * @module more-menu/block/company/integrator/src/contact-card
 */
jn.define('more-menu/block/company/integrator/src/contact-card', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { inAppUrl } = require('in-app-url');
	const { Haptics } = require('haptics');
	const { BottomSheet } = require('bottom-sheet');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Avatar, AvatarShape } = require('ui-system/blocks/avatar');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Link3, Ellipsize } = require('ui-system/blocks/link');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { createTestIdGenerator } = require('utils/test');
	const {
		IntegratorContactRow,
		getContactRows,
		calcContactHeight,
	} = require('more-menu/block/company/integrator/src/view-model');

	const AVATAR_SIZE = 56;
	const CONTACT_ICON_SIZE = 24;
	const SENDER_PAGE = 'more_menu';

	const ROW_ICONS = Object.freeze({
		[IntegratorContactRow.EMAIL]: Icon.MAIL,
		[IntegratorContactRow.PHONE]: Icon.PHONE_OUT,
		[IntegratorContactRow.SITE]: Icon.EARTH,
		[IntegratorContactRow.DETAILS]: Icon.LINK,
	});

	/**
	 * @class IntegratorContactCard
	 */
	class IntegratorContactCard extends LayoutComponent
	{
		/**
		 * @param {Object} props
		 * @param {IntegratorInfo} props.integrator
		 * @param {LayoutWidget} [props.parentWidget]
		 */
		static open(props = {})
		{
			const { integrator, parentWidget = PageManager } = props;

			new BottomSheet({
				titleParams: {
					text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONTACT_TITLE'),
					// dialog type keeps the sheet title centered; large title mode would align it left
					type: 'dialog',
				},
				component: (layoutWidget) => new IntegratorContactCard({ integrator, layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.setMediumPositionHeight(IntegratorContactCard.#calcHeight(integrator), true)
				.open()
				.catch(console.error);
		}

		static #calcHeight(integrator)
		{
			return calcContactHeight(integrator, {
				indentL: Indent.L.toNumber(),
				indentM: Indent.M.toNumber(),
				indentXL: Indent.XL.toNumber(),
				indentXL2: Indent.XL2.toNumber(),
				avatarSize: AVATAR_SIZE,
				rowIconSize: CONTACT_ICON_SIZE,
				footerButtonHeight: ButtonSize.L.getHeight(),
			});
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'more-menu-company-integrator-contact',
			});
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					backgroundColor: Color.bgSecondary,
					withPaddingHorizontal: true,
					footer: this.#renderFooter(),
				},
				this.#renderHeader(),
				this.#renderRows(),
			);
		}

		#renderHeader()
		{
			const { name, logo, company } = this.props.integrator;

			return View(
				{
					testId: this.getTestId('header'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.L.toNumber(),
					},
				},
				Avatar({
					testId: this.getTestId('header-logo'),
					uri: logo,
					name,
					size: AVATAR_SIZE,
					shape: AvatarShape.CIRCLE,
					withRedux: false,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				View(
					{
						style: {
							flexGrow: 1,
							flexShrink: 1,
						},
					},
					Text2({
						testId: this.getTestId('header-name'),
						text: name,
						color: Color.base1,
						accent: true,
						numberOfLines: 1,
						ellipsize: 'end',
					}),
					Boolean(company) && Text5({
						testId: this.getTestId('header-company'),
						text: company,
						color: Color.base2,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							marginTop: Indent.XS.toNumber(),
						},
					}),
				),
			);
		}

		#renderRows()
		{
			return View(
				{
					style: {
						marginTop: Indent.M.toNumber(),
					},
				},
				...getContactRows(this.props.integrator).map((row) => this.#renderContactRow(row)),
			);
		}

		#renderContactRow({ code, url, openInApp, text })
		{
			return View(
				{
					testId: this.getTestId(`row-${code}`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.M.toNumber(),
					},
				},
				IconView({
					testId: this.getTestId(`row-${code}-icon`),
					icon: ROW_ICONS[code],
					size: CONTACT_ICON_SIZE,
					color: Color.base4,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Link3({
					testId: this.getTestId(`row-${code}-text`),
					text: text ?? Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONTACT_DETAILS'),
					onClick: () => {
						Haptics.impactLight();
						this.#openRowTarget(url, openInApp);
					},
					ellipsize: Ellipsize.END,
					style: {
						flexGrow: 1,
						flexShrink: 1,
					},
				}),
			);
		}

		#openRowTarget(url, openInApp)
		{
			if (openInApp)
			{
				inAppUrl.open(url);

				return;
			}

			Application.openUrl(url);
		}

		#renderFooter()
		{
			const { partnerFormId } = this.props.integrator;

			if (!partnerFormId)
			{
				return null;
			}

			return BoxFooter(
				{},
				Button({
					testId: this.getTestId('request-button'),
					text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONTACT_REQUEST'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					onClick: this.#handleRequestClick,
				}),
			);
		}

		#handleRequestClick = () => {
			Haptics.impactLight();

			const { integrator, layoutWidget } = this.props;

			const openForm = () => {
				new FeedbackForm({
					formId: integrator.partnerFormId,
					senderPage: SENDER_PAGE,
				}).openInBackdrop(null, {
					title: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONTACT_REQUEST'),
				});
			};

			if (layoutWidget)
			{
				layoutWidget.close(openForm);
			}
			else
			{
				openForm();
			}
		};
	}

	module.exports = { IntegratorContactCard };
});
