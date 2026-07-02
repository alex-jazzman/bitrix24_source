/**
 * @module mail/mailbox/settings/src/password-card
 */
jn.define('mail/mailbox/settings/src/password-card', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { TextAreaInput, InputDesign, InputMode } = require('ui-system/form/inputs/textarea');

	const PASSWORD_PLACEHOLDER = '************';

	/**
	 * @class PasswordCard
	 */
	class PasswordCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.handlePasswordChange = this.handlePasswordChange.bind(this);
		}

		render()
		{
			return View(
				{
					testId: 'mail-connector-settings-password-card',
				},
				TextAreaInput({
					testId: 'mail-connector-settings-password-input',
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					showTitle: true,
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_PASSWORD_IMAP'),
					showCharacterCount: false,
					height: null,
					secure: true,
					placeholder: PASSWORD_PLACEHOLDER,
					value: this.props.password,
					onChange: this.handlePasswordChange,
				}),
			);
		}

		handlePasswordChange(value)
		{
			this.props.onStateChange({
				password: value,
				passwordChanged: true,
			});
		}
	}

	module.exports = { PasswordCard };
});
