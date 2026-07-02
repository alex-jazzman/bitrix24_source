/**
 * @module mail/mailbox/settings/src/outgoing-card
 */
jn.define('mail/mailbox/settings/src/outgoing-card', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Indent } = require('tokens');
	const {
		StringInput,
		InputDesign: StringInputDesign,
		InputMode: StringInputMode,
		InputSize: StringInputSize,
	} = require('ui-system/form/inputs/string');
	const {
		NumberInput,
		InputDesign: NumberInputDesign,
		InputMode: NumberInputMode,
		InputSize: NumberInputSize,
	} = require('ui-system/form/inputs/number');
	const { renderToggleRow } = require('mail/mailbox/settings/src/settings-ui');

	/**
	 * @class OutgoingCard
	 */
	class OutgoingCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.handleUseSenderNameToggle = this.handleUseSenderNameToggle.bind(this);
			this.handleSenderNameChange = this.handleSenderNameChange.bind(this);
			this.handleSmtpUseLimitToggle = this.handleSmtpUseLimitToggle.bind(this);
			this.handleSmtpLimitChange = this.handleSmtpLimitChange.bind(this);
		}

		render()
		{
			return View(
				{
					testId: 'mail-connector-settings-outgoing-card',
				},
				renderToggleRow({
					testId: 'mail-connector-settings-use-sender-name',
					checked: this.props.useSenderName,
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_OUTGOING_USE_SENDER_NAME'),
					onToggle: this.handleUseSenderNameToggle,
				}),
				this.props.useSenderName
					? View(
						{
							style: { marginTop: Indent.XL.toNumber() },
						},
						StringInput({
							testId: 'mail-connector-settings-sender-name-input',
							size: StringInputSize.L,
							design: StringInputDesign.GREY,
							mode: StringInputMode.STROKE,
							label: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SENDER_TITLE'),
							value: this.props.senderName,
							onChange: this.handleSenderNameChange,
						}),
					)
					: null,
				View(
					{
						style: { marginTop: Indent.XL.toNumber() },
					},
					renderToggleRow({
						testId: 'mail-connector-settings-outgoing-use-limit',
						checked: this.props.smtpUseLimit,
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_OUTGOING_USE_LIMIT'),
						onToggle: this.handleSmtpUseLimitToggle,
					}),
				),
				this.props.smtpUseLimit
					? View(
						{
							style: { marginTop: Indent.XL.toNumber() },
						},
						NumberInput({
							testId: 'mail-connector-settings-outgoing-limit-input',
							size: NumberInputSize.L,
							design: NumberInputDesign.GREY,
							mode: NumberInputMode.STROKE,
							label: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_OUTGOING_LIMIT_LABEL'),
							value: Number(this.props.smtpLimit) || 0,
							onChange: this.handleSmtpLimitChange,
						}),
					)
					: null,
			);
		}

		handleUseSenderNameToggle(checked)
		{
			this.props.onStateChange({ useSenderName: checked });
		}

		handleSenderNameChange(value)
		{
			this.props.onStateChange({ senderName: value });
		}

		handleSmtpUseLimitToggle(checked)
		{
			this.props.onStateChange({ smtpUseLimit: checked });
		}

		handleSmtpLimitChange(value)
		{
			this.props.onStateChange({ smtpLimit: Number(value) || 0 });
		}
	}

	module.exports = { OutgoingCard };
});
