/**
 * @module mail/mailbox/connector/steps/imap
 */

jn.define('mail/mailbox/connector/steps/imap', (require, exports, module) => {
	const { Haptics } = require('haptics');
	const { WizardStep } = require('layout/ui/wizard/step');
	const { Loc } = require('loc');
	const { ProgressBarNumber } = require('crm/salescenter/progress-bar-number');
	const { EmailInput } = require('ui-system/form/inputs/email');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { NumberInput } = require('ui-system/form/inputs/number');
	const { stringify } = require('utils/string');
	const { NotifyManager } = require('notify-manager');
	const { Switcher } = require('ui-system/blocks/switcher');
	const { throttle } = require('utils/function');
	const { isValidEmail } = require('utils/email');
	const { useCallback } = require('utils/function');
	const { clone, isEmpty } = require('utils/object');
	const isIOS = Application.getPlatform() === 'ios';
	const AppTheme = require('apptheme');
	const { Color } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
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
		getEmptyFieldsData()
		{
			return {
				login: {
					value: '',
				},
				email: {
					value: '',
				},
				password: {
					value: '',
				},
				imapPort: {
					value: '',
				},
				smtpPort: {
					value: '',
				},
				server: {
					value: '',
				},
				ssl: {
					value: true,
				},
				sslSmtp: {
					value: true,
				},
				addressSmtp: {
					value: '',
				},
			};
		}

		constructor(props)
		{
			super(props);

			this.fieldRefs = {};

			this.constants = {
				fields: {
					email: {
						ref: (ref) => this.fieldRefs.email = ref,
					},
					imapAddress: {
						ref: (ref) => this.fieldRefs.imapAddress = ref,
					},
					smtpAddress: {
						ref: (ref) => this.fieldRefs.smtpAddress = ref,
					},
					imapPort: {
						ref: (ref) => this.fieldRefs.imapPort = ref,
					},
					smtpPort: {
						ref: (ref) => this.fieldRefs.smtpPort = ref,
					},
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

		onChangeField(key, data, convertToString = true)
		{
			const fields = clone(this.state.fields);

			if (convertToString)
			{
				data = stringify(data);
			}

			fields[key].value = data;

			if (key === 'email')
			{
				fields.login.value = data;
			}

			this.setState({ fields });
		}

		render()
		{
			const checkedSslImap = this.state.fields.ssl.value;
			let secureConnectionAction = this.onChangeField.bind(this, 'ssl', !checkedSslImap, false);
			secureConnectionAction = throttle(secureConnectionAction, 500, this);

			const checkedSslSmtp = this.state.fields.sslSmtp.value;
			let secureConnectionSmtpAction = this.onChangeField.bind(this, 'sslSmtp', !checkedSslSmtp, false);
			secureConnectionSmtpAction = throttle(secureConnectionSmtpAction, 500, this);

			return View(
				{},
				View(
					{
						style: {
							backgroundColor: Color.bgPrimary.toHex(),
							paddingBottom: 12,
							paddingLeft: 18,
							paddingRight: 18,
						},
					},
					EmailInput({
						style: {
							marginBottom: 6,
						},
						label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_LOGIN_TITLE'),
						size: InputSize.L,
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						showTitle: false,
						validation: true,
						testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-email',
						ref: this.constants.fields.email.ref,
						showLeftIcon: false,
						showRequired: false,
						required: true,
						value: this.state.fields.email.value,
						onChange: useCallback((data) => this.onChangeField('email', data), ['email']),
						onValid: isValidEmail,
					}),
					StringInput({
						style: {
							marginBottom: 6,
						},
						label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_SMTP_LOGIN_TITLE_1'),
						size: InputSize.L,
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						showTitle: false,
						validation: true,
						testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-login',
						ref: this.constants.fields.login.ref,
						showLeftIcon: false,
						showRequired: false,
						required: true,
						value: this.state.fields.login.value,
						onChange: useCallback((data) => this.onChangeField('login', data), ['login']),
						onValid: isEmpty,
					}),
					StringInput({
						size: InputSize.L,
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-password',
						ref: this.constants.fields.password.ref,
						showRequired: false,
						required: true,
						showTitle: false,
						validation: true,
						value: this.state.fields.password.value,
						onChange: useCallback((data) => this.onChangeField('password', data), ['password']),
						label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_SMTP_PASSWORD_TITLE_1'),
						placeholder: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_SMTP_PASSWORD_PLACEHOLDER_1'),
						onValid: isEmpty,
						isPassword: true,
					}),
				),
				View(
					{
						style: {
							paddingLeft: 18,
							paddingRight: 18,
							paddingTop: 12,
							paddingBottom: 6,
							backgroundColor: AppTheme.colors.bgContentSecondary,
						},
					},
					View(
						{
							style: {
								borderRadius: 12,
								backgroundColor: Color.bgPrimary.toHex(),
								paddingLeft: 14,
								paddingRight: 14,
								paddingBottom: 18,
								paddingTop: 14,
							},
						},
						StringInput({
							style: {
								marginBottom: 6,
							},
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-imap-address',
							ref: this.constants.fields.imapAddress.ref,
							showRequired: false,
							required: true,
							showTitle: false,
							validation: true,
							value: this.state.fields.server.value,
							onChange: useCallback((data) => this.onChangeField('server', data), ['server']),
							label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_LOGIN_ADDRESS_TITLE'),
							placeholder: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_LOGIN_ADDRESS_PLACEHOLDER'),
							onValid: isEmpty,
						}),
						NumberInput({
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-imap-port',
							ref: this.constants.fields.imapPort.ref,
							showRequired: false,
							required: true,
							showTitle: false,
							validation: true,
							value: this.state.fields.imapPort.value,
							onChange: useCallback((data) => this.onChangeField('imapPort', data), ['imapPort']),
							label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_PORT_TITLE'),
							placeholder: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_PORT_PLACEHOLDER'),
							onValid: isEmpty,
						}),
						View(
							{
								onClick: secureConnectionAction,
								style: {
									display: 'flex',
									flexDirection: 'row',
									alignItems: 'center',
									height: 30,
								},
							},
							Switcher({
								testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-imap-ssl-switcher',
								checked: checkedSslImap,
								style: {
									marginRight: 8,
								},
							}),
							Text({
								style: {
									paddingBottom: 6,
									color: AppTheme.colors.base2,
									fontSize: 15,
									fontWeight: '400',
								},
								text: Loc.getMessage('MAILBOX_CONNECTOR_USE_SECURE_CONNECTION_1'),
							}),
						),
					),
				),
				View(
					{
						style: {
							paddingLeft: 18,
							paddingRight: 18,
							paddingTop: 6,
							paddingBottom: 12,
							backgroundColor: AppTheme.colors.bgContentSecondary,
						},
					},
					View(
						{
							style: {
								borderRadius: 12,
								backgroundColor: Color.bgPrimary.toHex(),
								paddingLeft: 14,
								paddingRight: 14,
								paddingBottom: 18,
								paddingTop: 14,
							},
						},
						StringInput({
							style: {
								marginBottom: 6,
							},
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-smtp-address',
							ref: this.constants.fields.smtpAddress.ref,
							showRequired: false,
							required: true,
							showTitle: false,
							validation: true,
							value: this.state.fields.addressSmtp.value,
							onChange: useCallback((data) => this.onChangeField('addressSmtp', data), ['addressSmtp']),
							label: Loc.getMessage('MAILBOX_CONNECTOR_SMTP_ADDRESS_TITLE'),
							placeholder: Loc.getMessage('MAILBOX_CONNECTOR_SMTP_ADDRESS_PLACEHOLDER'),
							onValid: isEmpty,
						}),
						NumberInput({
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-smtp-port',
							ref: this.constants.fields.smtpPort.ref,
							showRequired: false,
							required: true,
							showTitle: false,
							validation: true,
							value: this.state.fields.smtpPort.value,
							onChange: useCallback((data) => this.onChangeField('smtpPort', data), ['smtpPort']),
							label: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_PORT_TITLE'),
							placeholder: Loc.getMessage('MAILBOX_CONNECTOR_SMTP_PORT_PLACEHOLDER'),
							onValid: isEmpty,
						}),
						View(
							{
								onClick: secureConnectionSmtpAction,
								style: {
									display: 'flex',
									flexDirection: 'row',
									alignItems: 'center',
									height: 30,
								},
							},
							Switcher({
								testId: 'connecting-mailboxes-connecting-mailbox-imap-smtp-smtp-ssl-switcher',
								checked: checkedSslSmtp,
								style: {
									marginRight: 8,
								},
							}),
							Text({
								style: {
									paddingBottom: 6,
									color: AppTheme.colors.base2,
									fontSize: 15,
									fontWeight: '400',
								},
								text: Loc.getMessage('MAILBOX_CONNECTOR_USE_SECURE_CONNECTION_1'),
							}),
						),
					),
				),
			);
		}

		getInvalidField()
		{
			const {
				login,
				password,
				email,
				server,
				imapPort,
				addressSmtp,
				smtpPort,
			} = this.state.fields;

			if (!isValidEmail(email.value))
			{
				const emailField = this.fieldRefs.email;

				if (emailField)
				{
					return emailField;
				}
			}

			if (isEmpty(login.value))
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

			if (isEmpty(server.value))
			{
				const serverField = this.fieldRefs.imapAddress;

				if (serverField)
				{
					return serverField;
				}
			}

			if (isEmpty(imapPort.value))
			{
				const imapPortField = this.fieldRefs.imapPort;

				if (imapPortField)
				{
					return imapPortField;
				}
			}

			if (isEmpty(addressSmtp.value))
			{
				const smtpAddressField = this.fieldRefs.smtpAddress;

				if (smtpAddressField)
				{
					return smtpAddressField;
				}
			}

			if (isEmpty(smtpPort.value))
			{
				const smtpPortField = this.fieldRefs.smtpPort;

				if (smtpPortField)
				{
					return smtpPortField;
				}
			}

			return null;
		}
	}

	/**
	 * @class Imap
	 */
	class Imap extends WizardStep
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
			const response = {
				finish: false,
				next: false,
			};

			if (!this.checkMailboxCanConnected())
			{
				return response;
			}

			const {
				login,
				email,
				password,
				server,
				addressSmtp,
				imapPort,
				smtpPort,
				ssl,
				sslSmtp,
			} = this.fieldsLayout.state.fields;

			if (login !== '' && email !== '' && password !== '' && imapPort !== '' && smtpPort !== '' && server !== '' && addressSmtp !== '')
			{
				NotifyManager.showLoadingIndicator();
				await this.props.parent.connectMailbox({
					useSmtp: 1,
					login: email.value,
					password: password.value,
					server: server.value,
					port: Number(imapPort.value),
					ssl: ssl.value,
					serverSmtp: addressSmtp.value,
					portSmtp: Number(smtpPort.value),
					sslSmtp: sslSmtp.value,
					loginSmtp: login.value,
					passwordSMTP: password.value,
					loginWithoutDomain: login.value,
				}).then(
					({ data }) => {
						this.props.parent.onConnectMailbox(data.id, data.email);
					},
				).catch(({ errors }) => {
					this.props.parent.sendErrorAnalytics();
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
					text: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_TITLE_1'),
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

		resizableByKeyboard()
		{
			return true;
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
							marginTop: 4,
							flex: 1,
						},
					},
					ScrollView(
						{
							style: {
								backgroundColor: AppTheme.colors.bgContentSecondary,
								flex: 1,
							},
						},
						View(
							{},
							this.fieldsLayout,
						),
					),
					View(
						{
							style: {
								paddingBottom: isIOS ? 23 : 0,
								backgroundColor: AppTheme.colors.bgContentSecondary,
								paddingRight: 18,
								paddingLeft: 18,
							},
						},
						Button({
							testId: 'connecting-mailboxes-connecting-mailbox-button-confirm',
							text: Loc.getMessage('MAILBOX_CONNECTOR_IMAP_SMTP_BUTTON'),
							size: ButtonSize.XL,
							design: ButtonDesign.FILLED,
							disabled: false,
							stretched: true,
							onClick: this.fieldsLayout.nextStepAction,
						}),
					),
				),
			);
		}
	}

	module.exports = { Imap };
});
