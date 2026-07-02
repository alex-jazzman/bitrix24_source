/**
 * @module mail/mailbox/settings/src/crm-settings-layout
 */
jn.define('mail/mailbox/settings/src/crm-settings-layout', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { DialogFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { CrmCard } = require('mail/mailbox/settings/src/crm-card');

	const CRM_LAYOUT_STATE_FIELDS = [
		'crmEnabled',
		'canEditCrmIntegration',
		'crmSyncPeriod',
		'crmSyncEnabled',
		'crmSyncOptions',
		'crmAssignKnown',
		'crmIncomingCreate',
		'crmIncomingEntity',
		'crmOutgoingCreate',
		'crmOutgoingEntity',
		'crmVcf',
		'crmEntityOptions',
		'crmSource',
		'crmLeadResp',
		'crmLeadRespUsers',
		'crmNewLeadFor',
		'crmSourceOptions',
		'showAddressesInput',
	];
	const CRM_SAVE_FIELDS = [
		'crmEnabled',
		'crmSyncPeriod',
		'crmSyncEnabled',
		'crmAssignKnown',
		'crmIncomingCreate',
		'crmIncomingEntity',
		'crmOutgoingCreate',
		'crmOutgoingEntity',
		'crmVcf',
		'crmSource',
		'crmLeadResp',
		'crmLeadRespUsers',
		'crmNewLeadFor',
		'showAddressesInput',
	];

	/**
	 * @class CrmSettingsLayout
	 */
	class CrmSettingsLayout extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				footerHeight: 0,
				...this.getStateFromProps(props),
			};

			this.dismissKeyboard = this.dismissKeyboard.bind(this);
			this.save = this.save.bind(this);
			this.handleFooterHeightChange = this.handleFooterHeightChange.bind(this);
		}

		render()
		{
			return View(
				{
					testId: 'mail-connector-settings-crm-layout',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				ScrollView(
					{
						style: {
							flex: 1,
						},
					},
					View(
						{
							style: {
								paddingHorizontal: Indent.XL3.toNumber(),
								paddingTop: Indent.XL.toNumber(),
								paddingBottom: this.state.footerHeight + Indent.XL.toNumber(),
							},
							onClick: this.dismissKeyboard,
							onPan: this.dismissKeyboard,
						},
						this.renderContent(),
					),
				),
				this.renderFooter(),
			);
		}

		renderContent()
		{
			return new CrmCard({
				...this.getCrmCardProps(),
				isNewMailbox: this.props.isNewMailbox,
				onStateChange: this.handleStateChange,
				forceShowSettings: true,
				lockSettingsWhenDisabled: true,
			});
		}

		renderFooter()
		{
			return DialogFooter(
				{
					testId: 'mail-connector-settings-crm-footer',
					keyboardButton: {
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_DONE_BUTTON'),
						design: ButtonDesign.FILLED,
						onClick: this.dismissKeyboard,
					},
					onLayoutFooterHeight: this.handleFooterHeightChange,
				},
				Button({
					testId: 'mail-connector-settings-crm-save-button',
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SAVE_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					stretched: true,
					disabled: !this.canEditCrmIntegration(),
					onClick: this.save,
				}),
			);
		}

		dismissKeyboard()
		{
			Keyboard.dismiss();
		}

		handleFooterHeightChange({ height })
		{
			if (this.state.footerHeight !== height)
			{
				this.setState({ footerHeight: height });
			}
		}

		getStateFromProps(props)
		{
			return CRM_LAYOUT_STATE_FIELDS.reduce((acc, key) => {
				acc[key] = props[key];

				return acc;
			}, {});
		}

		getCrmCardProps()
		{
			return CRM_LAYOUT_STATE_FIELDS.reduce((acc, key) => {
				acc[key] = this.state[key];

				return acc;
			}, {});
		}

		getSavePayload()
		{
			return CRM_SAVE_FIELDS.reduce((acc, key) => {
				acc[key] = this.state[key];

				return acc;
			}, {});
		}

		canEditCrmIntegration()
		{
			return this.state.canEditCrmIntegration !== false;
		}

		save()
		{
			if (!this.canEditCrmIntegration())
			{
				return;
			}

			this.props.onSave?.(this.getSavePayload());
		}

		backToMain()
		{
			this.props.onBack?.(this.getCrmCardProps());
		}

		handleStateChange = (partialState) => {
			this.setState(partialState);
		};
	}

	module.exports = { CrmSettingsLayout };
});
