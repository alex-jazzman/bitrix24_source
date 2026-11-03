/**
 * @module more-menu/block/company/support
 */
jn.define('more-menu/block/company/support', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { Indent, Color } = require('tokens');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { PropTypes } = require('utils/validation');
	const { Card, CardCorner, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text3 } = require('ui-system/typography/text');
	const { getCardBorderColor } = require('more-menu/block/company/card-border');

	const MENU_ICON_SIZE = 26;
	const HUB_ICON_SIZE = 28;

	// A screen raised inside the native container has no navigation stack of its own, and a chat opened
	// from there lands under the chrome of the container with no way back the user would find. So such a
	// screen asks for support instead of opening it, and the request is served by a context that does own
	// a stack: the menu while the section is closed before the panel, the section itself once it stays.
	const SUPPORT_REQUEST_EVENT = 'MoreMenu::Support::requested';

	/**
	 * Where support opens from, whoever asked for it: the card of the section and the screen that stands
	 * in its place share one behaviour instead of two copies of it. The caller hands the values over -
	 * with none of them the tap still goes to the helpdesk, just with no address of its own.
	 *
	 * @param options
	 * @param {boolean} [options.canUseSupport] support of the portal answers, not the helpdesk
	 * @param {?string} [options.helpdeskUrl] address of the helpdesk article
	 * @param {?number} [options.supportBotId] bot the internal route of support opens the chat with
	 * @param {string} [options.analyticsSection] section the event of the helpdesk is reported from
	 */
	function openSupport({ canUseSupport, helpdeskUrl, supportBotId, analyticsSection } = {})
	{
		if (canUseSupport)
		{
			// No widget travels with the options. The messenger clones what it receives, and a native
			// layout object does not survive the clone: `new source.constructor()` throws on
			// JSApiLayoutConstructor and the chat never opens.
			inAppUrl.open('/support/', {
				title: Loc.getMessage('MORE_MENU_COMPANY_SUPPORT'),
				botId: supportBotId,
			});
		}
		else
		{
			helpdesk.openHelp(helpdeskUrl);

			new MoreMenuAnalytics({
				tool: 'intranet',
				category: 'support',
				event: 'open_helpdesk',
				c_section: analyticsSection,
			}).send();
		}
	}

	/**
	 * Hands the request over instead of serving it. Only values of the server travel: the event crosses
	 * the boundary of the execution context, and a native object does not survive that crossing.
	 *
	 * @param options the very same values `openSupport` takes
	 * @param {boolean} [options.canUseSupport]
	 * @param {?string} [options.helpdeskUrl]
	 * @param {?number} [options.supportBotId]
	 * @param {string} [options.analyticsSection]
	 */
	function requestSupport({ canUseSupport, helpdeskUrl, supportBotId, analyticsSection } = {})
	{
		BX.postComponentEvent(SUPPORT_REQUEST_EVENT, [{
			canUseSupport,
			helpdeskUrl,
			supportBotId,
			analyticsSection,
		}]);
	}

	/**
	 * Taken by a context that owns a navigation stack. The values come with the request, so the listener
	 * needs none of its own and stays right whoever asked.
	 *
	 * @return {function(): void} call to stop listening
	 */
	function subscribeToSupportRequests()
	{
		const handler = (options) => openSupport(options);

		BX.addCustomEvent(SUPPORT_REQUEST_EVENT, handler);

		return () => BX.removeCustomEvent(SUPPORT_REQUEST_EVENT, handler);
	}

	/**
	 * The card looks the same whatever it knows: its icon and its phrase are static, and the two
	 * destinations of the payload are what the tap opens. Both of them are handed over by the owner that
	 * mounted the card.
	 *
	 * @extends {LayoutComponent<SupportButtonProps>}
	 */
	class SupportButton extends LayoutComponent
	{
		render()
		{
			return this.props.hubDesign ? this.#renderHubCard() : this.#renderMenuCard();
		}

		#renderMenuCard()
		{
			const { testId } = this.props;

			return View(
				{
					testId: `${testId}-wrapper`,
					style: {
						flexGrow: 2,
					},
				},
				Card(
					{
						testId,
						onClick: this.#openSupport,
						corner: CardCorner.XL,
						style: {
							backgroundColor: Color.bgContentSecondaryInvert.toHex(),
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
							},
						},
						IconView({
							testId: `${testId}-icon`,
							size: MENU_ICON_SIZE,
							icon: Icon.CHATS,
							color: Color.accentMainPrimary,
							style: {
								marginRight: Indent.XS.toNumber(),
							},
						}),
						Text3({
							testId: `${testId}-text`,
							color: Color.base1,
							text: Loc.getMessage('MORE_MENU_COMPANY_SUPPORT'),
						}),
					),
				),
			);
		}

		#renderHubCard()
		{
			const { testId } = this.props;

			return Card(
				{
					testId,
					onClick: this.#openSupport,
					corner: CardCorner.L,
					design: CardDesign.PRIMARY,
					border: true,
					borderColor: getCardBorderColor(),
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					IconView({
						testId: `${testId}-icon`,
						size: HUB_ICON_SIZE,
						icon: Icon.CHATS,
						color: Color.accentMainPrimary,
						style: {
							marginRight: Indent.S.toNumber(),
						},
					}),
					Text2({
						testId: `${testId}-text`,
						color: Color.base1,
						text: Loc.getMessage('MORE_MENU_COMPANY_SUPPORT'),
						accent: true,
					}),
				),
			);
		}

		#openSupport = () => {
			this.props.onCardClick?.();

			const { canUseSupport, helpdeskUrl, supportBotId, analyticsSection } = this.props;

			openSupport({ canUseSupport, helpdeskUrl, supportBotId, analyticsSection });
		};
	}

	SupportButton.propTypes = {
		testId: PropTypes.string,
		supportBotId: PropTypes.number,
		canUseSupport: PropTypes.bool,
		helpdeskUrl: PropTypes.string,
		hubDesign: PropTypes.bool,
		// listened to by the section; nobody else mounting the card hands it over
		onCardClick: PropTypes.func,
		// the screen the card is drawn in; left out, its own events stay with the menu that owns it
		analyticsSection: PropTypes.string,
	};

	SupportButton.defaultProps = {
		testId: 'more-menu-company-support-button',
		supportBotId: null,
		hubDesign: false,
	};

	module.exports = { SupportButton, openSupport, requestSupport, subscribeToSupportRequests };
});
