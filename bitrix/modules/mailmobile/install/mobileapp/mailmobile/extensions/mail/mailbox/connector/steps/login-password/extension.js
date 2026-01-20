/**
 * @module mail/mailbox/connector/steps/login-password
 */

jn.define('mail/mailbox/connector/steps/login-password', (require, exports, module) => {
	const { Haptics } = require('haptics');
	const { WizardStep } = require('layout/ui/wizard/step');
	const { Loc } = require('loc');
	const { ProgressBarNumber } = require('crm/salescenter/progress-bar-number');
	const { useCallback } = require('utils/function');
	const { clone, isEmpty } = require('utils/object');
	const { stringify } = require('utils/string');
	const { NotifyManager } = require('notify-manager');
	const { getServiceInfo } = require('mail/mailbox/connector/steps/services-list');
	const AppTheme = require('apptheme');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { EmailInput } = require('ui-system/form/inputs/email');
	const { PureComponent } = require('layout/pure-component');
	const { Color } = require('tokens');
	const { isValidEmail } = require('utils/email');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');

	/**
	 * @class FieldsLayout
	 */
	class FieldsLayout extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.fieldRefs = {};
			this.constants = {
				fields: {
					login: {
						ref: (ref) => this.fieldRefs.login = ref,
					},
					password: {
						ref: (ref) => this.fieldRefs.password = ref,
					},
				},
			};

			this.state = {
				fields: this.getEmptyFieldsData(),
			};

			this.nextStepAction = props.nextStepAction;
		}

		getEmptyFieldsData()
		{
			return {
				login: {
					value: '',
				},
				password: {
					value: '',
				},
			};
		}

		onChangeField(key, data)
		{
			const fields = clone(this.state.fields);
			fields[key].value = stringify(data);
			this.setState({ fields });
		}

		getInvalidField()
		{
			const {
				login,
				password,
			} = this.state.fields;

			if (!isValidEmail(login.value))
			{
				const loginField = this.fieldRefs.login;

				if (loginField)
				{
					return loginField;
				}
			}

			if (isEmpty(password.value))
			{
				const passwordField = this.fieldRefs.password;

				if (passwordField)
				{
					return passwordField;
				}
			}

			return null;
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
					}
				},
				EmailInput({
					label: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_LOGIN_TITLE_1'),
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					showTitle: false,
					validation: true,
					testId: 'connecting-mailboxes-connecting-mailbox-login-password-email',
					ref: this.constants.fields.login.ref,
					showLeftIcon: false,
					showRequired: false,
					required: true,
					value: this.state.fields.login.value,
					onChange: useCallback((data) => this.onChangeField('login', data), ['login']),
					onValid: isValidEmail,
					placeholder: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_LOGIN_PLACEHOLDER_1'),
				}),
				View(
					{
						style: {
							height: 20,
						},
					},
				),
				StringInput({
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					testId: 'connecting-mailboxes-connecting-mailbox-login-password-password',
					ref: this.constants.fields.password.ref,
					showRequired: false,
					required: true,
					showTitle: false,
					validation: true,
					value: this.state.fields.password.value,
					onChange: useCallback((data) => this.onChangeField('password', data), ['password']),
					label: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_PASSWORD_TITLE_1'),
					placeholder: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_PASSWORD_PLACEHOLDER_1'),
					onValid: isEmpty,
					isPassword: true,
				}),
				View(
					{
						style: {
							/*
								We cannot set 'flex: 1' to press the button to the bottom of the screen,
								since on IOS the keyboard will cover the button, and focus from
								a field can only be switched to another field:
								therefore, the button will always be hidden under the keyboard.
							 */
							height: 40,
						},
					},
				),
				Button({
					testId: 'connecting-mailboxes-connecting-mailbox-button-confirm',
					text: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					disabled: false,
					stretched: true,
					onClick: this.nextStepAction,
				}),
			);
		}
	}

	/**
	 * @class LoginPassword
	 */
	class LoginPassword extends WizardStep
	{
		getBackgroundColor()
		{
			return Color.bgPrimary.toHex();
		}

		checkMailboxCanConnected()
		{
			let canConnected = true;

			const invalidField = this.fieldsLayout.getInvalidField();

			if (invalidField)
			{
				invalidField?.focus();
				Haptics.notifyWarning();
				canConnected = false;
			}

			return canConnected;
		}

		constructor(props)
		{
			super();
			this.props = props;
		}

		async onMoveToNextStep()
		{
			const response = { finish: false, next: false };

			if (!this.checkMailboxCanConnected())
			{
				return response;
			}

			const {
				login,
				password,
			} = this.fieldsLayout.state.fields;

			if (login.value !== '' && password.value !== '')
			{
				NotifyManager.showLoadingIndicator();
				await this.props.parent.connectMailbox({
					login: login.value,
					password: password.value,
				}).then(
					({ data }) => {
						this.props.parent.onConnectMailbox(data.id, data.email);
					},
				).catch(({ errors }) => {
					NotifyManager.showErrors(errors);
				});
			}

			return response;
		}

		getProgressBarSettings()
		{
			return {
				...super.getProgressBarSettings(),
				isEnabled: true,
				title: {
					text: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_TITLE_3'),
				},
				number: 2,
				count: 2,
			};
		}

		getTitle()
		{
			return Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_HEADER_TITLE');
		}

		renderNumberBlock()
		{
			return new ProgressBarNumber({
				number: '2',
			});
		}

		titleBlock()
		{
			const serviceKey = this.props.parent.getMailServiceKey();

			if (!serviceKey)
			{
				return null;
			}

			return View(
				{
					style: {
						marginBottom: 20,
						flexDirection: 'row',
					},
				},
				View(
					{
						style: {
							marginRight: 10,
							width: 32,
							height: 32,
						},
					},
					Image({
						svg: {
							content: getServiceInfo(serviceKey).svgContent,
						},
						style: {
							width: 32,
							height: 32,
						},
					}),
				),
				Text({
					style: {
						textAlign: 'center',
						color: AppTheme.colors.base2,
						fontSize: 18,
						fontWeight: '400',
					},
					text: Loc.getMessage('MAILBOX_CONNECTOR_LOGIN_PASSWORD_TITLE_4'),
				}),
			);
		}

		createLayout(props)
		{
			this.fieldsLayout = new FieldsLayout({
				nextStepAction: this.props.parent.nextStep.bind(this.props.parent),
			});

			return View(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							flex: 1,
							margin: 16,
							paddingLeft: 15,
							paddingRight: 15,
							paddingBottom: 37,
							paddingTop: 27,
						},
					},
					this.titleBlock(),
					View(
						{
							style: {
								flex: 1,
								paddingLeft: 5,
							},
						},
						this.fieldsLayout,
					),
				),
			);
		}
	}

	module.exports = { LoginPassword };
});
