/**
 * @module mail/mailbox/settings/src/crm-summary-card
 */
jn.define('mail/mailbox/settings/src/crm-summary-card', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4, Text5 } = require('ui-system/typography/text');

	const CRM_ICON_SIZE = 40;
	const CHEVRON_SIZE = 20;
	const CRM_ICON_URI = makeLibraryImagePath('crm-exact.png', 'mailbox-settings', 'mail');

	/**
	 * @class CrmSummaryCard
	 */
	class CrmSummaryCard extends PureComponent
	{
		render()
		{
			return View(
				{
					testId: 'mail-connector-settings-crm-summary-card',
					style: { width: '100%' },
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
						onClick: this.props.onClick,
					},
					View(
						{
							style: {
								width: CRM_ICON_SIZE,
								height: CRM_ICON_SIZE,
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						Image({
							style: {
								width: CRM_ICON_SIZE,
								height: CRM_ICON_SIZE,
								resizeMode: 'contain',
							},
							uri: CRM_ICON_URI,
						}),
					),
					View(
						{
							style: {
								flex: 1,
								flexShrink: 1,
								marginLeft: Indent.M.toNumber(),
								marginRight: Indent.S.toNumber(),
							},
						},
						Text4({
							testId: 'mail-connector-settings-crm-summary-title',
							text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_TITLE'),
							color: Color.base2,
						}),
						View(
							{
								style: {
									marginTop: Indent.XS2.toNumber(),
								},
							},
							Text5({
								testId: 'mail-connector-settings-crm-summary-status',
								text: this.getStatusText(),
								color: this.getStatusColor(),
							}),
						),
					),
					IconView({
						testId: 'mail-connector-settings-crm-summary-chevron',
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						color: Color.base5,
						size: CHEVRON_SIZE,
					}),
				),
			);
		}

		getStatusText()
		{
			return this.props.crmEnabled
				? Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_STATUS_ENABLED')
				: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_STATUS_DISABLED')
			;
		}

		getStatusColor()
		{
			return this.props.crmEnabled ? Color.accentMainPrimary : Color.base4;
		}
	}

	module.exports = { CrmSummaryCard };
});
