/**
 * @module more-menu/block/company/integrator
 */
jn.define('more-menu/block/company/integrator', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { Avatar, AvatarShape } = require('ui-system/blocks/avatar');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const {
		ChipButton,
		ChipButtonSize,
		ChipButtonMode,
		ChipButtonDesign,
	} = require('ui-system/blocks/chips/chip-button');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { InfoHelper } = require('layout/ui/info-helper');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Haptics } = require('haptics');
	const { Alert } = require('alert');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');
	const { IntegratorContactCard } = require('more-menu/block/company/integrator/src/contact-card');
	const {
		IntegratorState,
		IntegratorMenuItem,
		isConnected,
		getMenuItems,
		hasContactTarget,
	} = require('more-menu/block/company/integrator/src/view-model');

	const PROMO_INFO_HELPER_CODE = 'info_implementation_request';
	const SENDER_PAGE = 'more_menu';

	const ICON_SIZE = 24;
	// the diameter the round graphic of this card and of the specialists tile next to it both keep
	const ICON_BOX_SIZE = 38;
	const AVATAR_SIZE = 38;

	// The card takes the whole height it is given and keeps the call to action at its bottom edge.
	// The company block of the menu leaves no spare height, so both rules are inert there; in the
	// half-width tile of the "My company" section they are what makes the pair of tiles even.
	const FILL_HEIGHT_STYLE = {
		flexGrow: 1,
		justifyContent: 'space-between',
	};

	/**
	 * @typedef {Object} IntegratorInfo
	 * @property {string} state promo | connected
	 * @property {?string} name
	 * @property {?string} logo
	 * @property {?string} company
	 * @property {?string} email
	 * @property {?string} phone
	 * @property {?string} url
	 * @property {?string} cardUrl
	 * @property {boolean} [canManage]
	 * @property {(string|number|null)} [partnerFormId]
	 * @property {(string|number|null)} [feedbackFormId]
	 * @property {(string|number|null)} [refusalFormId]
	 * @property {?string} [deleteAction]
	 */

	/**
	 * @class Integrator
	 */
	class Integrator extends PureComponent
	{
		/**
		 * @param props
		 * @param {IntegratorInfo} props.integrator
		 * @param {LayoutWidget} props.layout the widget the tile opens its screens on top of
		 * @param {string} props.testId
		 * @param {Function} [props.onIntegratorChange] called after the integrator relation is dropped
		 * @param {Function} [props.onCardClick] the tile was tapped, whichever of its states drew it
		 * @param {string} [props.analyticsSection] the screen the tile is drawn in
		 */
		constructor(props)
		{
			super(props);

			this.menuButtonRef = null;

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			return isConnected(this.props.integrator) ? this.#renderConnected() : this.#renderPromo();
		}

		#renderPromo()
		{
			return Card(
				{
					testId: this.getTestId('promo'),
					corner: CardCorner.L,
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
					style: FILL_HEIGHT_STYLE,
				},
				View(
					{
						onClick: this.#handlePromoClick,
					},
					View(
						{
							testId: this.getTestId('promo-icon-box'),
							style: {
								width: ICON_BOX_SIZE,
								height: ICON_BOX_SIZE,
								borderRadius: ICON_BOX_SIZE / 2,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColorGradient: {
									start: Color.accentSoftGreen3.toHex(),
									end: Color.accentSoftGreen1.toHex(),
									angle: 135,
								},
							},
						},
						IconView({
							testId: this.getTestId('promo-icon'),
							size: ICON_SIZE,
							icon: Icon.HANDSHAKE,
							color: Color.accentExtraGrass,
						}),
					),
					Text3({
						testId: this.getTestId('promo-title'),
						text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_PROMO_TITLE'),
						color: Color.base1,
						accent: true,
						style: {
							marginTop: Indent.M.toNumber(),
						},
					}),
					Text5({
						testId: this.getTestId('promo-subtitle'),
						text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_PROMO_SUBTITLE'),
						color: Color.base2,
						style: {
							marginTop: Indent.XS.toNumber(),
						},
					}),
				),
				ChipButton({
					testId: this.getTestId('promo-button'),
					text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_PROMO_BUTTON'),
					icon: Icon.PLUS,
					size: ChipButtonSize.M,
					mode: ChipButtonMode.TINTED,
					design: ChipButtonDesign.PRIMARY,
					rounded: false,
					onClick: this.#handlePromoClick,
					style: {
						alignSelf: 'flex-start',
						marginTop: Indent.XL3.toNumber(),
					},
				}),
			);
		}

		#renderConnected()
		{
			const { name, logo } = this.props.integrator;
			const menuActions = this.#getMenuActions();
			const canContact = hasContactTarget(this.props.integrator);

			return Card(
				{
					testId: this.getTestId('connected'),
					corner: CardCorner.L,
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
					style: FILL_HEIGHT_STYLE,
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
					},
					View(
						{
							style: {
								flexGrow: 1,
								flexShrink: 1,
							},
							onClick: canContact ? this.#handleContactClick : null,
						},
						Avatar({
							testId: this.getTestId('connected-avatar'),
							uri: logo,
							name,
							size: AVATAR_SIZE,
							shape: AvatarShape.CIRCLE,
							withRedux: false,
						}),
						Text5({
							testId: this.getTestId('connected-label'),
							text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONNECTED_OWNED_LABEL'),
							color: Color.base2,
							style: {
								marginTop: Indent.M.toNumber(),
							},
						}),
						Text3({
							testId: this.getTestId('connected-name'),
							text: name,
							color: Color.base1,
							numberOfLines: 2,
							ellipsize: 'end',
							style: {
								marginTop: Indent.XS2.toNumber(),
							},
						}),
					),
					menuActions.length > 0 && this.#renderMenuButton(menuActions),
				),
				canContact && ChipButton({
					testId: this.getTestId('connected-button'),
					text: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_CONNECTED_BUTTON'),
					icon: Icon.MESSAGE,
					size: ChipButtonSize.M,
					mode: ChipButtonMode.TINTED,
					design: ChipButtonDesign.PRIMARY,
					rounded: false,
					onClick: this.#handleContactClick,
					style: {
						alignSelf: 'flex-start',
						marginTop: Indent.XL3.toNumber(),
					},
				}),
			);
		}

		// The button belongs to the corner of the card, so it keeps the top edge of the row rather than the
		// middle of the avatar next to it. The tap area stays the whole icon box.
		#renderMenuButton(menuActions)
		{
			return IconView({
				testId: this.getTestId('connected-menu-button'),
				size: ICON_SIZE,
				icon: Icon.MORE,
				color: Color.base3,
				forwardRef: (ref) => {
					this.menuButtonRef = ref;
				},
				onClick: () => this.#handleMenuClick(menuActions),
				style: {
					marginLeft: Indent.M.toNumber(),
				},
			});
		}

		#handlePromoClick = () => {
			Haptics.impactLight();
			MoreMenuAnalytics.sendIntegratorPromoClickEvent(this.props.analyticsSection);
			this.props.onCardClick?.();
			InfoHelper.openByCode(PROMO_INFO_HELPER_CODE, this.props.layout);
		};

		#handleContactClick = () => {
			Haptics.impactLight();
			MoreMenuAnalytics.sendIntegratorContactClickEvent(this.props.analyticsSection);
			this.props.onCardClick?.();
			this.#openContactCard();
		};

		#handleMenuClick(menuActions)
		{
			Haptics.impactLight();
			MoreMenuAnalytics.sendIntegratorMenuClickEvent(this.props.analyticsSection);

			new PopupMenu(menuActions).show({ target: this.menuButtonRef });
		}

		#getMenuActions()
		{
			const factories = {
				[IntegratorMenuItem.FEEDBACK]: () => ({
					id: IntegratorMenuItem.FEEDBACK,
					title: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_MENU_FEEDBACK'),
					icon: Icon.FEEDBACK,
					onItemSelected: this.#handleFeedbackSelected,
				}),
				[IntegratorMenuItem.REFUSE]: () => ({
					id: IntegratorMenuItem.REFUSE,
					title: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_MENU_REFUSE'),
					icon: Icon.PACKAGE_CANCEL,
					destructive: true,
					sectionCode: IntegratorMenuItem.REFUSE,
					onItemSelected: this.#handleRefuseSelected,
				}),
			};

			return getMenuItems(this.props.integrator).map((code) => factories[code]());
		}

		#handleFeedbackSelected = () => {
			Haptics.impactLight();
			MoreMenuAnalytics.sendIntegratorFeedbackClickEvent(this.props.analyticsSection);
			this.#openFeedbackForm();
		};

		#handleRefuseSelected = () => {
			Haptics.impactLight();
			MoreMenuAnalytics.sendIntegratorRefuseClickEvent(this.props.analyticsSection);
			this.#openRefusalForm();
		};

		#openContactCard()
		{
			IntegratorContactCard.open({
				integrator: this.props.integrator,
				parentWidget: this.props.layout,
			});
		}

		#openFeedbackForm()
		{
			new FeedbackForm({
				formId: this.props.integrator.feedbackFormId,
				senderPage: SENDER_PAGE,
			}).openInBackdrop(null, {
				title: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_FEEDBACK_TITLE'),
			});
		}

		#openRefusalForm()
		{
			new FeedbackForm({
				formId: this.props.integrator.refusalFormId,
				senderPage: SENDER_PAGE,
				onSendSuccess: () => this.#deleteIntegrator(),
			}).openInBackdrop(null, {
				title: Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_REFUSE_FORM_TITLE'),
			});
		}

		#deleteIntegrator()
		{
			const { deleteAction } = this.props.integrator;
			if (!deleteAction)
			{
				return;
			}

			new RunActionExecutor(deleteAction, {})
				.setHandler((response) => {
					if (response?.status === 'success')
					{
						Haptics.notifySuccess();
						MoreMenuAnalytics.sendIntegratorRefuseSuccessEvent(this.props.analyticsSection);
						this.props.onIntegratorChange?.();

						return;
					}

					this.#showDeleteError();
				})
				.call(true);
		}

		#showDeleteError()
		{
			Haptics.notifyFailure();
			Alert.alert(
				Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_REFUSE_ERROR_TITLE'),
				Loc.getMessage('MORE_MENU_COMPANY_INTEGRATOR_REFUSE_ERROR_TEXT'),
			);
		}
	}

	Integrator.propTypes = {
		testId: PropTypes.string,
		integrator: PropTypes.object,
		layout: PropTypes.object.isRequired,
		onIntegratorChange: PropTypes.func,
		// the row of the section listens to the tap; the menu mounting the tile hands no handler over
		onCardClick: PropTypes.func,
		// the screen the tile is drawn in; left out, its own events stay with the menu that owns it
		analyticsSection: PropTypes.string,
	};

	Integrator.defaultProps = {
		testId: 'more-menu-company-integrator',
	};

	module.exports = { Integrator, IntegratorState };
});
