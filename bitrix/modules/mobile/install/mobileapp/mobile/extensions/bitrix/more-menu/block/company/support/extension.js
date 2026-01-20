/**
 * @module more-menu/block/company/support
 */
jn.define('more-menu/block/company/support', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { Indent, Color } = require('tokens');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { PropTypes } = require('utils/validation');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text3 } = require('ui-system/typography/text');

	/**
	 * @class SupportButton
	 */
	class SupportButton extends LayoutComponent
	{
		render()
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
						onClick: this.openSupport,
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
							size: 26,
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

		openSupport = () => {
			const { canUseSupport, helpdeskUrl, supportBotId } = this.props;

			if (canUseSupport)
			{
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
					c_section: 'ava_menu',
				}).send();
			}
		};
	}

	SupportButton.propTypes = {
		testId: PropTypes.string,
		supportBotId: PropTypes.number,
		canUseSupport: PropTypes.bool.isRequired,
		helpdeskUrl: PropTypes.string.isRequired,
	};

	SupportButton.defaultProps = {
		testId: 'more-menu-company-support-button',
		supportBotId: null,
	};

	module.exports = { SupportButton };
});
