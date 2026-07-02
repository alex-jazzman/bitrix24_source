/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, ui_vue3, ui_vue3_pinia, main_core, ui_analytics, ui_vue3_components_button, ui_system_input, ui_system_input_vue, ui_notification, ui_entitySelector, ui_iconSet_api_vue, ui_vue3_components_menu, ui_buttons, ui_dialogs_messagebox, ui_vue3_components_avatar, mail_settingSelector, ui_vue3_components_switcher, ui_switcher, ui_vue3_directives_hint) {
	'use strict';

	const YES_VALUE = 'Y';
	const NO_VALUE = 'N';
	const SERVICE_CONFIG = {
		serviceType: 'imap',
		name: 'other'
	};

	function normalizeOptions(options) {
		if (!Array.isArray(options)) {
			return [];
		}
		return options.map(option => ({
			value: String(option.value),
			label: option.label || String(option.value)
		}));
	}
	function resolveSettingValue(options, currentValue, defaultValue) {
		const normalizedCurrentValue = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
		if (options.some(option => option.value === normalizedCurrentValue)) {
			return normalizedCurrentValue;
		}
		const normalizedDefaultValue = defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '';
		if (options.some(option => option.value === normalizedDefaultValue)) {
			return normalizedDefaultValue;
		}
		return options[0]?.value || '';
	}
	const useWizardStore = ui_vue3_pinia.defineStore('wizard', {
		state: () => ({
			connectionSettings: {
				imapServer: '',
				imapPort: null,
				imapSsl: true,
				smtpSettings: {
					enabled: false,
					server: '',
					port: null,
					ssl: true
				}
			},
			employees: [],
			addedEmployees: [],
			mailSyncOptions: [],
			mailSettings: {
				sync: {
					enabled: true,
					periodValue: ''
				}
			},
			crmSyncOptions: [],
			crmEntityOptions: [],
			crmSettings: {
				enabled: false,
				sync: {
					enabled: true,
					periodValue: ''
				},
				assignKnownClientEmails: true,
				incoming: {
					enabled: true,
					createAction: ''
				},
				outgoing: {
					enabled: true,
					createAction: ''
				},
				source: '',
				leadCreationAddresses: '',
				responsibleQueue: []
			},
			crmSourceOptions: [],
			calendarSettings: {
				enabled: true,
				autoAddEvents: true
			},
			errorState: {
				enabled: false,
				errorType: ''
			},
			passwordlessMode: false,
			isPasswordlessConnectAvailable: false,
			isLoginColumnShown: false,
			analyticsSource: '',
			permissions: {
				allowedLevels: null,
				canEditCrmIntegration: false
			}
		}),
		actions: {
			addEmployee(employeeItem) {
				if (this.employees.some(employee => employee.id === employeeItem.id)) {
					return;
				}
				this.employees.push(employeeItem);
			},
			removeEmployeeById(employeeId) {
				this.employees = this.employees.filter(employee => employee.id !== employeeId);
			},
			setEmployees(employees) {
				this.employees = employees;
			},
			clearEmployees() {
				this.employees = [];
			},
			setAddedEmployees(employees) {
				this.addedEmployees = employees;
			},
			setMailSettings(newSettings) {
				this.mailSettings = newSettings;
			},
			setCrmSettings(newSettings) {
				this.crmSettings = newSettings;
			},
			setMailboxSettingsConfig(settingsConfig) {
				const defaults = settingsConfig?.defaults || {};
				const mailSyncOptions = normalizeOptions(settingsConfig?.mailSyncIntervals);
				const crmSyncOptions = normalizeOptions(settingsConfig?.crmSyncIntervals);
				const crmEntityOptions = normalizeOptions(settingsConfig?.crmEntities);
				const crmSourceOptions = normalizeOptions(settingsConfig?.crmSources);
				this.mailSyncOptions = mailSyncOptions;
				this.crmSyncOptions = crmSyncOptions;
				this.crmEntityOptions = crmEntityOptions;
				this.crmSourceOptions = crmSourceOptions;
				this.mailSettings.sync.enabled = defaults.mailSyncEnabled ?? this.mailSettings.sync.enabled;
				this.mailSettings.sync.periodValue = resolveSettingValue(mailSyncOptions, this.mailSettings.sync.periodValue, defaults.messageMaxAge);
				this.crmSettings.enabled = defaults.crmEnabled ?? this.crmSettings.enabled;
				this.crmSettings.sync.enabled = defaults.crmSyncEnabled ?? this.crmSettings.sync.enabled;
				this.crmSettings.sync.periodValue = resolveSettingValue(crmSyncOptions, this.crmSettings.sync.periodValue, defaults.crmSyncPeriod);
				this.crmSettings.assignKnownClientEmails = defaults.crmAssignKnownClientEmails ?? this.crmSettings.assignKnownClientEmails;
				this.crmSettings.incoming.enabled = defaults.crmIncomingCreate ?? this.crmSettings.incoming.enabled;
				this.crmSettings.incoming.createAction = resolveSettingValue(crmEntityOptions, this.crmSettings.incoming.createAction, defaults.crmIncomingEntity);
				this.crmSettings.outgoing.enabled = defaults.crmOutgoingCreate ?? this.crmSettings.outgoing.enabled;
				this.crmSettings.outgoing.createAction = resolveSettingValue(crmEntityOptions, this.crmSettings.outgoing.createAction, defaults.crmOutgoingEntity);
				this.crmSettings.source = resolveSettingValue(crmSourceOptions, this.crmSettings.source, defaults.crmSource || settingsConfig?.defaultCrmSource);
				this.calendarSettings.enabled = defaults.calendarAutoAddEvents ?? this.calendarSettings.enabled;
				this.calendarSettings.autoAddEvents = defaults.calendarAutoAddEvents ?? this.calendarSettings.autoAddEvents;
			},
			setCalendarSettings(newSettings) {
				this.calendarSettings = newSettings;
			},
			prepareCrmOptions() {
				if (!this.crmSettings.enabled) {
					return {
						enabled: NO_VALUE
					};
				}
				const crmOptions = {
					enabled: YES_VALUE,
					config: {}
				};
				if (this.crmSettings.sync.enabled) {
					crmOptions.config.crm_sync_days = parseInt(this.crmSettings.sync.periodValue, 10) || 0;
				}
				if (this.crmSettings.assignKnownClientEmails) {
					crmOptions.config.crm_public = this.crmSettings.assignKnownClientEmails ? YES_VALUE : NO_VALUE;
				}
				if (this.crmSettings.incoming.enabled) {
					crmOptions.config.crm_new_entity_in = this.crmSettings.incoming.createAction;
				}
				if (this.crmSettings.outgoing.enabled) {
					crmOptions.config.crm_new_entity_out = this.crmSettings.outgoing.createAction;
				}
				crmOptions.config.crm_lead_source = this.crmSettings.source;
				if (this.crmSettings.responsibleQueue.length > 0) {
					crmOptions.config.crm_lead_resp = this.crmSettings.responsibleQueue.map(item => item.id);
				}
				if (this.crmSettings.leadCreationAddresses.length > 0) {
					crmOptions.config.crm_new_lead_for = this.crmSettings.leadCreationAddresses;
				}
				return crmOptions;
			},
			prepareDataForBackend() {
				const crmOptions = this.prepareCrmOptions();
				const isPasswordlessModeEnabled = this.passwordlessMode && this.isPasswordlessConnectAvailable;
				const mailboxes = this.employees.map(employee => {
					const smtpServer = this.connectionSettings.smtpSettings.server;
					const smtpPort = this.connectionSettings.smtpSettings.port;
					const isSmtpDataFilled = Boolean(smtpServer && smtpPort);
					const useSmtp = this.connectionSettings.smtpSettings.enabled && isSmtpDataFilled ? YES_VALUE : NO_VALUE;
					const mailboxData = {
						userIdToConnect: employee.id,
						email: employee.email,
						login: employee.login || employee.email,
						loginSmtp: employee.login || employee.email,
						mailboxName: employee.email,
						senderName: employee.name,
						server: this.connectionSettings.imapServer,
						port: this.connectionSettings.imapPort,
						ssl: this.connectionSettings.imapSsl ? YES_VALUE : NO_VALUE,
						useSmtp,
						serverSmtp: this.connectionSettings.smtpSettings.server,
						portSmtp: this.connectionSettings.smtpSettings.port,
						sslSmtp: this.connectionSettings.smtpSettings.ssl ? YES_VALUE : NO_VALUE,
						iCalAccess: this.calendarSettings.enabled && this.calendarSettings.autoAddEvents ? YES_VALUE : NO_VALUE,
						serviceConfig: SERVICE_CONFIG,
						syncAfterConnection: NO_VALUE,
						messageMaxAge: parseInt(this.mailSettings.sync.periodValue, 10)
					};
					if (!isPasswordlessModeEnabled) {
						mailboxData.password = employee.password;
						mailboxData.passwordSMTP = employee.password;
					}
					return {
						...mailboxData,
						crmOptions: {
							...crmOptions
						}
					};
				});
				return {
					mailboxes
				};
			},
			preparePasswordlessPayload() {
				return this.prepareDataForBackend();
			},
			enableErrorState(errorType = '') {
				this.errorState = {
					enabled: true,
					errorType
				};
			},
			disableErrorState() {
				this.errorState = {
					enabled: false,
					errorType: ''
				};
			},
			togglePasswordlessMode() {
				if (!this.isPasswordlessConnectAvailable) {
					this.passwordlessMode = false;
					return;
				}
				this.passwordlessMode = !this.passwordlessMode;
			},
			toggleLoginColumn() {
				this.isLoginColumnShown = !this.isLoginColumnShown;
				if (!this.isLoginColumnShown) {
					this.employees = this.employees.map(employee => {
						return {
							...employee,
							login: ''
						};
					});
				}
			},
			setAnalyticsSource(source) {
				this.analyticsSource = source;
			},
			setSmtpStatus(isAvailable) {
				this.connectionSettings.smtpSettings.enabled = isAvailable;
			},
			setFeatures(features) {
				this.isPasswordlessConnectAvailable = features?.isPasswordlessConnectAvailable ?? false;
				if (!this.isPasswordlessConnectAvailable) {
					this.passwordlessMode = false;
				}
			},
			prepareDataForHistory() {
				return {
					connectionSettings: this.connectionSettings,
					mailSettings: this.mailSettings,
					crmSettings: this.crmSettings,
					calendarSettings: this.calendarSettings,
					employees: this.employees.map(employee => {
						return {
							...employee,
							password: ''
						};
					})
				};
			},
			setPermissions(permissions) {
				this.permissions.allowedLevels = [permissions?.allowedLevels];
				this.permissions.canEditCrmIntegration = permissions?.canEditCrmIntegration;
			}
		}
	});

	// @vue/component
	const WizardProgressBar = {
		props: {
			totalSteps: {
				type: Number,
				required: true
			},
			currentStepIndex: {
				type: Number,
				required: true
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__wizard_progress-bar">
			<div
				v-for="(step, index) in totalSteps"
				:key="index"
				class="mail_massconnect__wizard_progress-bar__item"
				:data-test-id="'mail_massconnect__wizard_progress-bar__item' + index"
				:class="{ 'mail_massconnect__wizard_progress-bar__item--active': index <= currentStepIndex }"
			>
			</div>
		</div>
	`
	};

	const LocalizationMixin = {
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		}
	};

	// @vue/component
	const WizardNavigation = {
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [LocalizationMixin],
		props: {
			isFirstStep: Boolean,
			isLastStep: Boolean,
			isSubmitting: Boolean,
			prevDisabled: Boolean,
			disabledContinueButton: {
				type: Boolean,
				default: false
			}
		},
		emits: ['prev-step', 'next-step', 'submit'],
		data() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__wizard_navigation" data-test-id="mail_massconnect__wizard_navigation">
			<UiButton
				v-if="isLastStep"
				class="mail_massconnect__wizard_navigation_submit-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONNECT_BUTTON_TITLE')"
				:style="AirButtonStyle.FILLED"
				:waiting="isSubmitting"
				@click="$emit('submit')"
			/>
			<UiButton
				v-else
				class="mail_massconnect__wizard_navigation_next-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONTINUTE_BUTTON_TITLE')"
				:style="AirButtonStyle.FILLED"
				:disabled="disabledContinueButton"
				@click="$emit('next-step')"
			/>
			<UiButton
				v-if="!isFirstStep && !prevDisabled"
				class="mail_massconnect__wizard_navigation_prev-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_BACK_BUTTON_TITLE')"
				:style="AirButtonStyle.PLAIN"
				@click="$emit('prev-step')"
			/>
		</div>
	`
	};

	const ERROR_TYPE_IMAP_CONNECTION = 'imap_connection';
	const ERROR_TYPE_AUTH = 'auth';
	const ERROR_TYPE_SMTP_CONNECTION = 'smtp_connection';
	const ALLOWED_CONNECTION_ERROR_TYPES = [ERROR_TYPE_IMAP_CONNECTION, ERROR_TYPE_AUTH, ERROR_TYPE_SMTP_CONNECTION];

	// @vue/component
	const ConnectionData = {
		components: {
			BInput: ui_system_input_vue.BInput
		},
		mixins: [LocalizationMixin],
		props: {
			validationAttempted: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:validity'],
		disableButtonOnInvalid: false,
		data() {
			return {
				InputSize: ui_system_input.InputSize,
				InputDesign: ui_system_input.InputDesign
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['connectionSettings', 'analyticsSource', 'errorState']),
			imapPortModel: {
				get() {
					return this.connectionSettings.imapPort?.toString() ?? '';
				},
				set(value) {
					const port = parseInt(value, 10);
					this.connectionSettings.imapPort = Number.isNaN(port) ? null : port;
				}
			},
			smtpPortModel: {
				get() {
					return this.connectionSettings.smtpSettings.port?.toString() ?? '';
				},
				set(value) {
					const port = parseInt(value, 10);
					this.connectionSettings.smtpSettings.port = Number.isNaN(port) ? null : port;
				}
			},
			isValid() {
				const imapValid = Boolean(this.connectionSettings.imapServer && this.connectionSettings.imapPort);
				if (!this.connectionSettings.smtpSettings.enabled) {
					return imapValid;
				}
				const smtpServer = this.connectionSettings.smtpSettings.server;
				const smtpPort = this.connectionSettings.smtpSettings.port;
				const smtpFilled = Boolean(smtpServer || smtpPort);
				if (!smtpFilled) {
					return imapValid;
				}
				const smtpValid = Boolean(smtpServer && smtpPort);
				return imapValid && smtpValid;
			},
			showErrors() {
				return this.validationAttempted;
			},
			isFixingImapError() {
				return this.errorState?.errorType === ERROR_TYPE_IMAP_CONNECTION;
			},
			isFixingSmtpError() {
				return this.errorState?.errorType === ERROR_TYPE_SMTP_CONNECTION;
			},
			imapServerError() {
				if (this.isFixingImapError) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_CONNECTION_ERROR');
				}
				return this.showErrors && !this.connectionSettings.imapServer ? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_ERROR') : null;
			},
			imapPortError() {
				if (this.isFixingImapError) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_CONNECTION_ERROR');
				}
				return this.showErrors && !this.connectionSettings.imapPort ? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_ERROR') : null;
			},
			smtpServerError() {
				if (!this.connectionSettings.smtpSettings.enabled) {
					return null;
				}
				if (this.isFixingSmtpError) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_CONNECTION_ERROR');
				}
				if (!this.showErrors) {
					return null;
				}
				const smtpServer = this.connectionSettings.smtpSettings.server;
				const smtpPort = this.connectionSettings.smtpSettings.port;
				if (smtpPort && !smtpServer) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_ERROR');
				}
				return null;
			},
			smtpPortError() {
				if (!this.connectionSettings.smtpSettings.enabled) {
					return null;
				}
				if (this.isFixingSmtpError) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_CONNECTION_ERROR');
				}
				if (!this.showErrors) {
					return null;
				}
				const smtpServer = this.connectionSettings.smtpSettings.server;
				const smtpPort = this.connectionSettings.smtpSettings.port;
				if (smtpServer && !smtpPort) {
					return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_ERROR');
				}
				return null;
			},
			imapWatchKey() {
				return `${this.connectionSettings.imapServer ?? ''}|${this.connectionSettings.imapPort ?? ''}`;
			},
			smtpWatchKey() {
				return `${this.connectionSettings.smtpSettings.server ?? ''}|${this.connectionSettings.smtpSettings.port ?? ''}`;
			}
		},
		watch: {
			isValid: {
				handler(isValid) {
					this.$emit('update:validity', isValid);
				},
				immediate: true
			},
			imapWatchKey() {
				if (this.isFixingImapError) {
					this.disableErrorState();
				}
			},
			smtpWatchKey() {
				if (this.isFixingSmtpError) {
					this.disableErrorState();
				}
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useWizardStore, ['disableErrorState']),
			onStepComplete() {
				ui_analytics.sendData({
					tool: 'mail',
					event: 'mailbox_mass_step1',
					category: 'mail_mass_ops',
					c_section: this.analyticsSource
				});
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__connection-data_form" data-test-id="mail_massconnect__connection-data_form">
			<div class="mail_massconnect__section-title_container">
				<span class="mail_massconnect__section-title">
					{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_TITLE_MSGVER_1') }}
				</span>
				<span class="mail_massconnect__section-description">
					{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_DESCRIPTION') }}
				</span>
			</div>

			<div class="mail_massconnect__connection-block">
				<div class="mail_massconnect__input-group" data-test-id="mail_massconnect__connection-data_imap-group">
					<BInput
						class="mail_massconnect__input-group_main"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_PLACEHOLDER')"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.imapServer"
						:error="imapServerError"
					/>
					<BInput
						class="mail_massconnect__input-group_port"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_PLACEHOLDER')"
						type="number"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="imapPortModel"
						:error="imapPortError"
					/>
				</div>
				<div class="mail_massconnect__connection-data_checkbox-group">
					<input
						type="checkbox"
						id="mail_massconnect__imap-ssl"
						class="mail_massconnect__checkbox"
						v-model="connectionSettings.imapSsl"
						data-test-id="mail_massconnect__connection-data_imap-ssl-checkbox"
					/>
					<label for="mail_massconnect__imap-ssl">
						{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_SSL_INPUT_LABEL') }}
					</label>
				</div>
			</div>

			<div 
				v-if="connectionSettings.smtpSettings.enabled"
				class="mail_massconnect__connection-block"
			>
				<div class="mail_massconnect__input-group" data-test-id="mail_massconnect__connection-data_smtp-group">
					<BInput
						class="mail_massconnect__input-group_main"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_PLACEHOLDER')"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.smtpSettings.server"
						:error="smtpServerError"
					/>
					<BInput
						class="mail_massconnect__input-group_port"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_PLACEHOLDER')"
						type="number"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="smtpPortModel"
						:error="smtpPortError"
					/>
				</div>
				<div class="mail_massconnect__connection-data_checkbox-group">
					<input
						type="checkbox"
						id="mail_massconnect__smtp-ssl"
						class="mail_massconnect__checkbox"
						v-model="connectionSettings.smtpSettings.ssl"
						data-test-id="mail_massconnect__connection-data_smtp-ssl-checkbox"
					/>
					<label for="mail_massconnect__smtp-ssl">
						{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_SSL_INPUT_LABEL') }}
					</label>
				</div>
			</div>
		</div>
	`
	};

	const Api = {
		connectMailbox: async (mailbox, massConnectId) => {
			return BX.ajax.runAction('mail.mailboxconnecting.connectMailboxFromMassconnect', {
				data: {
					mailbox,
					massConnectId
				}
			});
		},
		createPasswordlessRequest: async mailbox => {
			return BX.ajax.runAction('mail.mailboxconnecting.createPasswordlessRequest', {
				data: {
					mailbox
				}
			});
		},
		validateConnectionSettings: async settings => {
			return BX.ajax.runAction('mail.mailboxconnecting.validateConnectionSettings', {
				data: {
					mailbox: settings
				}
			});
		},
		saveMailboxConnectionData: async massConnectData => {
			return BX.ajax.runAction('mail.mailboxconnecting.saveMassConnectData', {
				data: {
					massConnectData
				}
			});
		},
		getDepartmentsUsers: async departmentIds => {
			return BX.ajax.runAction('mail.mailboxconnecting.getDepartmentUsers', {
				data: {
					departmentIds
				}
			});
		},
		checkMailboxLimits: async userIds => {
			return BX.ajax.runAction('mail.mailboxconnecting.checkMailboxLimits', {
				data: {
					userIds
				}
			});
		}
	};

	const AVATAR_SIZE = 22;

	// @vue/component
	const EmployeeListTable = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			Avatar: ui_vue3_components_avatar.Avatar
		},
		mixins: [LocalizationMixin],
		props: {
			isLoginColumnShown: {
				type: Boolean,
				default: true
			},
			/** @type {Employee[]} */
			employees: {
				type: Array,
				required: true
			},
			isPasswordColumnHidden: {
				type: Boolean,
				default: false
			},
			readonlyMode: {
				type: Boolean,
				default: false
			},
			showValidationErrors: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				InputDesign: ui_system_input.InputDesign,
				InputSize: ui_system_input.InputSize,
				touchedFields: new Set()
			};
		},
		computed: {
			outline() {
				return ui_iconSet_api_vue.Outline;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useWizardStore, ['removeEmployeeById']),
			getAvatarOptions(employee) {
				return {
					size: AVATAR_SIZE,
					userName: employee.avatar ? employee.name : null,
					userpicPath: employee.avatar || ''
				};
			},
			markTouched(employeeId, field) {
				this.touchedFields.add(`${employeeId}_${field}`);
			},
			shouldShowError(employeeId, field) {
				return this.showValidationErrors || this.touchedFields.has(`${employeeId}_${field}`);
			},
			getEmailError(employee) {
				if (!this.shouldShowError(employee.id, 'email')) {
					return '';
				}
				const email = (employee.email ?? '').trim();
				if (email.length === 0) {
					return this.loc('MAIL_MASSCONNECT_FORM_EMAIL_EMPTY_ERROR');
				}
				if (!main_core.Validation.isEmail(email)) {
					return this.loc('MAIL_MASSCONNECT_FORM_EMAIL_VALIDATION_ERROR');
				}
				return '';
			},
			getPasswordError(employee) {
				if (!this.shouldShowError(employee.id, 'password')) {
					return '';
				}
				const password = (employee.password ?? '').trim();
				if (password.length === 0) {
					return this.loc('MAIL_MASSCONNECT_FORM_PASSWORD_EMPTY_ERROR');
				}
				return '';
			}
		},
		template: `
		<div 
			class="mail_massconnect__employee-list_table"
			:class="{ '--login-hidden': !isLoginColumnShown, '--password-hidden': isPasswordColumnHidden }"
			data-test-id="mail_massconnect__employee-list_table"
		>
			<div class="mail_massconnect__employee-list_table_header">
				<div class="mail_massconnect__employee-list_table_cell --name">
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_NAME_COLUMN_TITLE') }}
				</div>
				<div class="mail_massconnect__employee-list_table_cell --email">
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_TITLE') }}
				</div>
				<div 
					v-if="isLoginColumnShown" 
					class="mail_massconnect__employee-list_table_cell --login"
					data-test-id="mail_massconnect__employee-list_table_login-header"
				>
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_TITLE') }}
				</div>
				<div
					v-if="!readonlyMode && !isPasswordColumnHidden"
					class="mail_massconnect__employee-list_table_cell --password"
					data-test-id="mail_massconnect__employee-list_table_password-header"
				>
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_TITLE') }}
				</div>
			</div>
			<div v-for="(employee, index) in employees"
				:key="employee.id"
				class="mail_massconnect__employee-list_table_row"
				:data-test-id="'mail_massconnect__employee-list_table_row-' + index"
			>
				<div class="mail_massconnect__employee-list_table_cell --name">
					<div class="mail_massconnect__employee-list_table_employee-info">
						<Avatar
							:options="getAvatarOptions(employee)"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_avatar'"
						/>
						<span 
							class="mail_massconnect__employee-list_table_employee-name"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_name'"
						>
							{{ employee.name }}
						</span>
						<div 
							class="mail_massconnect__employee-list_table_delete-btn-container"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_delete-btn-container'"
						>
							<UiButton
								v-if="!readonlyMode"
								:style="AirButtonStyle.OUTLINE"
								:leftIcon="outline.CROSS_M"
								class="mail_massconnect__employee-list_table_delete-employee"
								@click="removeEmployeeById(employee.id)"
							/>
						</div>
					</div>
				</div>
				<div class="mail_massconnect__employee-list_table_cell --email">
					<BInput
						v-model="employee.email"
						:size="InputSize.Lg"
						:design="readonlyMode ? InputDesign.Disabled : InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_PLACEHOLDER')"
						:error="getEmailError(employee)"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
						@blur="markTouched(employee.id, 'email')"
					/>
				</div>
				<div class="mail_massconnect__employee-list_table_cell --login">
					<BInput
						v-model="employee.login"
						:size="InputSize.Lg"
						:design="readonlyMode ? InputDesign.Disabled : InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_PLACEHOLDER')"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_login-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_login-input'"
					/>
				</div>
				<div v-if="!readonlyMode && !isPasswordColumnHidden" class="mail_massconnect__employee-list_table_cell --password">
					<BInput
						v-model="employee.password"
						type="password"
						:size="InputSize.Lg"
						:design="InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_PLACEHOLDER')"
						:error="getPasswordError(employee)"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
						@blur="markTouched(employee.id, 'password')"
					/>
				</div>
			</div>
		</div>
	`
	};

	const LIMIT_BLOCKED_USERS = 3;
	const MAX_USERS_PER_LIMIT_REQUEST = 500;
	const LIMIT_CHECK_NOTIFICATION_ID = 'mail_massconnect__limit_check_progress';

	// @vue/component
	const SelectEmployees = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			EmployeeListTable
		},
		mixins: [LocalizationMixin],
		props: {
			validationAttempted: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:validity'],
		data() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				actionsMenuActive: false,
				showAddedEmployees: false,
				usersBlockedByLimit: []
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['employees', 'errorState', 'addedEmployees', 'isLoginColumnShown', 'passwordlessMode', 'isPasswordlessConnectAvailable', 'analyticsSource', 'permissions']),
			set() {
				return ui_iconSet_api_vue.Set;
			},
			outline() {
				return ui_iconSet_api_vue.Outline;
			},
			isEmployeeListEmpty() {
				return this.employees.length === 0;
			},
			areAllEmployeeFieldsValid() {
				return this.employees.every(employee => {
					const email = (employee.email ?? '').trim();
					if (email.length === 0 || !main_core.Validation.isEmail(email)) {
						return false;
					}
					if (!this.passwordlessMode) {
						const password = (employee.password ?? '').trim();
						if (password.length === 0) {
							return false;
						}
					}
					return true;
				});
			},
			isValid() {
				if (this.isEmployeeListEmpty) {
					return false;
				}
				if (!this.validationAttempted) {
					return true;
				}
				return this.areAllEmployeeFieldsValid;
			},
			menuOptions() {
				const items = [];
				if (this.isPasswordlessConnectAvailable) {
					items.push({
						title: this.passwordlessMode ? this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_PASSWORD_SHOW') : this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_PASSWORD_HIDE'),
						icon: this.passwordlessMode ? this.set.OPENED_EYE : this.set.CROSSED_EYE_2,
						onClick: () => {
							this.togglePasswordlessMode();
						}
					});
				}
				items.push({
					title: this.isLoginColumnShown ? this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_HIDE') : this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_SHOW'),
					icon: this.isLoginColumnShown ? this.set.CROSSED_EYE_2 : this.set.OPENED_EYE,
					onClick: () => {
						this.toggleLoginColumn();
					}
				}, {
					title: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_DELETE_ALL'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: () => {
						this.actionsMenuActive = false;
						this.clearEmployees();
						this.usersBlockedByLimit = [];
						this.employeeDialog.deselectAll();
					}
				});
				return {
					bindElement: this.$refs.actionsMenuActiveRef,
					items
				};
			},
			fixingErrorsHintText() {
				return this.loc('MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_HINT');
			},
			isFixingErrorState() {
				return this.errorState.enabled && this.errorState.errorType === 'auth';
			},
			helpDescLink() {
				// ToDo: make a link when help article is ready
				return null;
			}
		},
		watch: {
			isValid: {
				handler(isValid) {
					this.$emit('update:validity', isValid);
				},
				immediate: true
			}
		},
		created() {
			this.employeeDialog = this.getEmployeeDialog();
		},
		methods: {
			...ui_vue3_pinia.mapActions(useWizardStore, ['setEmployees', 'toggleLoginColumn', 'togglePasswordlessMode', 'addEmployee', 'clearEmployees']),
			onStepComplete() {
				ui_analytics.sendData({
					tool: 'mail',
					event: 'mailbox_mass_step2',
					category: 'mail_mass_ops',
					c_section: this.analyticsSource
				});
			},
			getEmployeeDialog() {
				const applyButton = new ui_buttons.SaveButton({
					useAirDesign: true,
					text: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DIALOG_ADD_BUTTON_TEXT'),
					onclick: async button => {
						button.setWaiting(true);
						await this.handleSaveItems(this.employeeDialog.getSelectedItems());
						button.setWaiting(false);
					}
				});
				const cancelButton = new ui_buttons.CancelButton({
					useAirDesign: true,
					style: ui_vue3_components_button.AirButtonStyle.OUTLINE,
					onclick: () => {
						this.employeeDialog.hide();
					}
				});
				return new ui_entitySelector.Dialog({
					width: 420,
					height: 400,
					multiple: true,
					showAvatars: true,
					enableSearch: true,
					context: 'MAIL_MASSCONNECT_EMPLOYEES',
					entities: [{
						id: 'structure-node',
						options: {
							selectMode: 'usersAndDepartments',
							forSearch: true,
							allowSelectRootDepartment: true,
							restricted: 'view',
							allowedPermissionLevels: this.permissions.allowedLevels
						}
					}],
					events: {
						onDestroy: () => {
							this.employeeDialog = this.getEmployeeDialog();
						}
					},
					footer: [applyButton.render(), cancelButton.render()],
					footerOptions: {
						containerStyles: {
							display: 'flex',
							'justify-content': 'center',
							gap: '12px',
							'background-color': 'var(--ui-color-palette-white-base)'
						}
					}
				});
			},
			openEmployeeSelector() {
				const targetNode = this.$refs.addButton.button.getContainer();
				this.employeeDialog.setTargetNode(targetNode);
				if (!this.employeeDialog.isOpen()) {
					this.employeeDialog.setPreselectedItems(this.employees.map(employee => ['user', employee.id]));
					this.employeeDialog.show();
				}
			},
			createDefaultEmployee(id, name, avatar) {
				return {
					id,
					entityId: 'user',
					name,
					avatar,
					email: '',
					login: '',
					password: ''
				};
			},
			async handleSaveItems(items) {
				const selectedUsers = [];
				const departmentsToCheck = [];
				items.forEach(item => {
					if (item.entityId === 'user') {
						selectedUsers.push(this.createDefaultEmployee(item.getId(), item.getTitle(), item.getAvatar()));
					} else if (item.entityId === 'structure-node') {
						departmentsToCheck.push(item.id);
					}
				});
				let departmentUsers = [];
				try {
					if (departmentsToCheck.length > 0) {
						const rawDepartmentUsers = await Api.getDepartmentsUsers(departmentsToCheck);
						departmentUsers = rawDepartmentUsers.data?.map(user => {
							return this.createDefaultEmployee(user.id, user.name, user.avatar ?? '');
						});
					}
				} catch {
					ui_notification.UI.Notification.Center.notify({
						content: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SELECTOR_ADD_ERROR')
					});
					return;
				}
				const allNewUsers = [...selectedUsers, ...departmentUsers];

				// Deduplicate against already added employees
				const existingIds = new Set(this.employees.map(e => e.id));
				const trulyNewUsers = allNewUsers.filter(u => !existingIds.has(u.id));
				if (trulyNewUsers.length === 0) {
					this.employeeDialog.deselectAll();
					this.employeeDialog.hide();
					return;
				}

				// Check limits for new users before adding them
				const newUserIds = trulyNewUsers.map(u => u.id);
				const userIdsBlockedByLimit = await this.getUserIdsBlockedByLimit(newUserIds);
				const allowedUsers = trulyNewUsers.filter(u => !userIdsBlockedByLimit.has(u.id));
				const usersBlockedByLimit = trulyNewUsers.filter(u => userIdsBlockedByLimit.has(u.id));

				// Add only allowed users to the list
				allowedUsers.forEach(employee => this.addEmployee(employee));
				this.employeeDialog.deselectAll();
				this.employeeDialog.hide();

				// Show popup for users who reached mailbox limit
				if (usersBlockedByLimit.length > 0) {
					this.usersBlockedByLimit = usersBlockedByLimit;
					this.showUsersBlockedByLimitPopup(usersBlockedByLimit);
				}
			},
			buildUserNamesHtml(users) {
				return users.map(user => {
					const userId = Number(user.id);
					return `<a href="/company/personal/user/${userId}/" target="_blank" class="mail_massconnect__limit-popup_link">${main_core.Text.encode(user.name)}</a>`;
				}).join(', ');
			},
			showUsersBlockedByLimitPopup(blockedUsers) {
				let content = '';
				if (blockedUsers.length > LIMIT_BLOCKED_USERS) {
					const namesHtml = this.buildUserNamesHtml(blockedUsers.slice(0, LIMIT_BLOCKED_USERS));
					const extraCnt = blockedUsers.length - LIMIT_BLOCKED_USERS;
					content = this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TEXT_EXTRA', {
						'#NAMES#': namesHtml,
						'#EXTRA_CNT#': String(extraCnt)
					});
				} else {
					const namesHtml = this.buildUserNamesHtml(blockedUsers);
					content = main_core.Loc.getMessagePlural('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TEXT', blockedUsers.length, {
						'#NAMES#': namesHtml
					});
				}
				ui_dialogs_messagebox.MessageBox.show({
					title: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TITLE'),
					useAirDesign: true,
					message: content,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_OPEN_SETTINGS'),
					cancelCaption: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_SKIP'),
					onOk: messageBox => {
						this.openMailboxGridWithFilter();
						messageBox.close();
					}
				});
			},
			async getUserIdsBlockedByLimit(userIds) {
				if (userIds.length === 0) {
					return new Set();
				}
				const totalCount = userIds.length;
				let processedCount = 0;
				this.showLimitCheckProgress(processedCount, totalCount);
				const chunks = this.chunkUserIds(userIds, MAX_USERS_PER_LIMIT_REQUEST);
				try {
					const limitedUserIds = new Set();
					for (const chunk of chunks) {
						// eslint-disable-next-line no-await-in-loop
						const response = await Api.checkMailboxLimits(chunk);
						const limitsData = response?.data?.items ?? [];
						const processedChunkCount = Number(response?.data?.processedCount ?? chunk.length);
						processedCount = Math.min(processedCount + processedChunkCount, totalCount);
						this.showLimitCheckProgress(processedCount, totalCount, processedCount >= totalCount);
						limitsData.forEach(item => {
							if (!item.canConnectNew) {
								limitedUserIds.add(item.userId);
							}
						});
					}
					return limitedUserIds;
				} catch {
					// If limit check fails, allow all users through
					this.hideLimitCheckProgress();
					return new Set();
				}
			},
			showLimitCheckProgress(processedCount, totalCount, isFinal = false) {
				ui_notification.UI.Notification.Center.notify({
					id: LIMIT_CHECK_NOTIFICATION_ID,
					content: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_CHECK_PROGRESS', {
						'#PROCESSED#': String(processedCount),
						'#TOTAL#': String(totalCount)
					}),
					autoHide: isFinal,
					autoHideDelay: isFinal ? 2000 : 0,
					closeButton: true,
					blinkOnUpdate: false
				});
			},
			hideLimitCheckProgress() {
				const balloon = ui_notification.UI.Notification.Center.getBalloonById(LIMIT_CHECK_NOTIFICATION_ID);
				if (balloon) {
					balloon.close();
				}
			},
			chunkUserIds(userIds, chunkSize) {
				const chunks = [];
				for (let i = 0; i < userIds.length; i += chunkSize) {
					chunks.push(userIds.slice(i, i + chunkSize));
				}
				return chunks;
			},
			openMailboxGridWithFilter() {
				const params = new URLSearchParams();
				this.usersBlockedByLimit.forEach((u, index) => {
					params.append(`OWNER[${index}]`, `U${Number(u.id)}`);
				});
				params.set('apply_filter', 'Y');
				const url = `/mail/mailbox-list?${params.toString()}`;
				BX.SidePanel.Instance.open(url, {
					data: {
						resetFilterOnClose: true
					}
				});
			}
		},
		template: `
		<div class="mail_massconnect__select-employees_form">
			<div class="mail_massconnect__employee-list_header">
				<div class="mail_massconnect__section-title_container">
					<span class="mail_massconnect__section-title">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_TITLE') }}
					</span>
					<span v-if="!isFixingErrorState" class="mail_massconnect__section-description">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DESCRIPTION') }}
					</span>
				</div>
				<div
					v-show="!isFixingErrorState"
					class="mail_massconnect__employee-list_header_buttons"
					data-test-id="mail_massconnect__employee-list_header_buttons"
				>
					<UiButton
						ref="addButton"
						:text="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ADD_BUTTON_TITLE')"
						:leftIcon="set.PLUS_IN_CIRCLE"
						:style="AirButtonStyle.TINTED"
						@click="openEmployeeSelector"
					/>
				</div>
			</div>

			<div v-show="!isEmployeeListEmpty" class="mail_massconnect__employee-list_container">
				<div 
					v-if="isFixingErrorState" 
					class="mail_massconnect__fixing-errors-hint_container"
					data-test-id="mail_massconnect__fixing-errors-hint_container"
				>
					<BIcon
						:name="outline.ALERT_ACCENT"
						:size="24"
						color="var(--ui-color-text-alert)"
					/>
					<div class="mail_massconnect__fixing-errors-hint_text">
						{{ fixingErrorsHintText }}
					</div>
					<div v-if="helpDescLink" class="mail_massconnect__fixing-errors-hint_link">
						{{ loc('MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_LINK') }}
					</div>
				</div>
				<div 
					v-else 
					class="mail_massconnect__utility-block_container"
					data-test-id="mail_massconnect__utility-block_container"
				>
					<div
						class="mail_massconnect__employee-list_info_actions"
						@click="actionsMenuActive = true"
						ref="actionsMenuActiveRef"
					>
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_TITLE') }}
					</div>
					<div class="mail_massconnect__employee-list_info_actions-icon">
						<BIcon :name="outline.CHEVRON_DOWN_L"
							@click="actionsMenuActive = true"
							:size="18"
							color="var(--ui-color-palette-gray-50)"
						>
						</BIcon>
					</div>
					<BMenu v-if="actionsMenuActive" :options="menuOptions" @close="actionsMenuActive = false"/>
				</div>
				<EmployeeListTable
					:isLoginColumnShown="isLoginColumnShown"
					:isPasswordColumnHidden="passwordlessMode"
					:employees="employees"
					:showValidationErrors="validationAttempted"
				/>
			</div>
			<div 
				v-if="addedEmployees.length > 0" 
				class="mail_massconnect__employee-list_added-employees_container"
				data-test-id="mail_massconnect__employee-list_added-employees_container"
			>
				<div
					class="mail_massconnect__employee-list_added-employees_show-button"
					data-test-id="mail_massconnect__employee-list_added-employees_show-button"
					@click="showAddedEmployees = !showAddedEmployees"
				>
					<div class="mail_massconnect__employee-list_added-employees_show-button-text">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SHOW_ADDED_TITLE') }}
					</div>
					<div class="mail_massconnect__employee-list_added-employees_show-button-icon">
						<BIcon :name="outline.CHEVRON_DOWN_L"
							@click="actionsMenuActive = true"
							:size="18"
							color="var(--ui-color-palette-gray-50)"
						>
						</BIcon>
					</div>
				</div>
				<EmployeeListTable
					v-if="showAddedEmployees"
					:isLoginColumnShown="isLoginColumnShown"
					:employees="addedEmployees"
					:readonlyMode="true"
				/>
			</div>
		</div>
	`
	};

	const PreparedIndirectPhraseMixin = {
		methods: {
			preparedIndirectPhrase(phraseCode, indirectCode) {
				const phrase = this.$Bitrix.Loc.getMessage(phraseCode);
				const parts = phrase.split(indirectCode);
				return {
					beforeText: parts[0] || null,
					afterText: parts[1] || null
				};
			}
		}
	};

	// @vue/component
	const BitrixSettingSelector = {
		props: {
			modelValue: {
				type: [String, Number],
				required: true
			},
			options: {
				type: Array,
				required: true
			},
			dialogOptions: {
				type: Object,
				required: false,
				default: null
			}
		},
		emits: ['update:modelValue'],
		selectorInstance: null,
		itemOnSelectHandler: null,
		watch: {
			modelValue(newValue) {
				if (this.selectorInstance && newValue !== this.selectorInstance.getSelected()) {
					this.selectorInstance.select(newValue);
				}
			}
		},
		mounted() {
			const settingsMap = new Map();
			this.options.forEach(option => {
				settingsMap.set(option.value, option.label);
			});
			const settingSelectorOptions = {
				settingsMap: Object.fromEntries(settingsMap),
				selectedOptionKey: this.modelValue
			};
			if (this.dialogOptions) {
				settingSelectorOptions.dialogOptions = this.dialogOptions;
			}
			this.selectorInstance = new mail_settingSelector.SettingSelector(settingSelectorOptions);
			this.itemOnSelectHandler = event => {
				const {
					item: selectedItem
				} = event.getData();
				this.$emit('update:modelValue', selectedItem.getId());
			};
			if (this.selectorInstance.settingDialog) {
				this.selectorInstance.settingDialog.subscribe('Item:onSelect', this.itemOnSelectHandler);
			}
			this.selectorInstance.renderTo(this.$el);
		},
		beforeUnmount() {
			if (this.selectorInstance.settingDialog) {
				this.selectorInstance.settingDialog.unsubscribe('Item:onSelect', this.itemOnSelectHandler);
			}
			if (this.selectorInstance && this.selectorInstance.settingDialog) {
				this.selectorInstance.settingDialog.destroy();
			}
		},
		template: '<div></div>'
	};

	// @vue/component
	const MailIntegration = {
		name: 'mail-integration',
		components: {
			BitrixSettingSelector
		},
		mixins: [LocalizationMixin, PreparedIndirectPhraseMixin],
		props: {
			/** @type MailIntegrationSettingsType */
			modelValue: {
				type: Object,
				required: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['mailSyncOptions']),
			localModelValue: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			syncLabel() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_MAIL_SYNC_LABEL', '#PERIOD#');
			},
			syncPeriodOptions() {
				return this.mailSyncOptions;
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__integration-block">
			<div class="mail_massconnect__integration-block_header">
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --mail"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_MAIL_TITLE') }}
					</span>
				</div>
			</div>
			<div class="mail_massconnect__integration-block_content-wrapper">
				<div class="mail_massconnect__integration-block_content">
					<div class="mail_massconnect__checkbox-group">
						<input
							type="checkbox"
							id="mail_massconnect__mail-sync"
							v-model="localModelValue.sync.enabled"
							data-test-id="mail_massconnect__mail-sync_checkbox"
						/>
						<div 
							class="mail_massconnect__indirect-label" 
							data-test-id="mail_massconnect__mail-sync_label"
						>
							<label for="mail_massconnect__mail-sync">
								<span class="mail_massconnect__label-text_before">
									{{ syncLabel.beforeText }}
								</span>
							</label>
							<BitrixSettingSelector
								v-model="localModelValue.sync.periodValue"
								:options="syncPeriodOptions"
							/>
							<label for="mail_massconnect__mail-sync">
								<span class="mail_massconnect__label-text_after">
									{{ syncLabel.afterText }}
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserSelector = {
		props: {
			modelValue: {
				type: Array,
				default: () => []
			}
		},
		emits: ['update:modelValue'],
		selectorInstance: null,
		targetNode: null,
		watch: {
			modelValue(newValue) {
				if (!this.selectorInstance) {
					return;
				}
				const newItemsSet = new Set(newValue.map(item => `${item.entityId}:${item.id}`));
				const currentTags = this.selectorInstance.getTags();
				const currentTagsSet = new Set(currentTags.map(tag => `${tag.getEntityId()}:${tag.getId()}`));
				currentTags.forEach(tag => {
					const tagId = `${tag.getEntityId()}:${tag.getId()}`;
					if (!newItemsSet.has(tagId)) {
						this.selectorInstance.removeTag(tag);
					}
				});
				newValue.forEach(item => {
					const itemId = `${item.entityId}:${item.id}`;
					if (!currentTagsSet.has(itemId)) {
						this.selectorInstance.addTag({
							id: item.id,
							entityId: item.entityId,
							title: item.name
						});
					}
				});
			}
		},
		mounted() {
			this.selectorInstance = new ui_entitySelector.TagSelector({
				dialogOptions: {
					width: 425,
					height: 320,
					multiple: true,
					context: 'MAIL_CRM_QUEUE',
					preselectedItems: this.modelValue.map(item => [item.entityId, item.id]),
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'departmentsOnly'
						}
					}]
				},
				events: {
					onAfterTagAdd: this.onUpdate,
					onAfterTagRemove: this.onUpdate
				}
			});
			this.selectorInstance.renderTo(this.$el);
		},
		beforeUnmount() {
			const dialog = this.selectorInstance.getDialog();
			if (dialog) {
				dialog.destroy();
			}
		},
		methods: {
			onUpdate() {
				const selectedItems = this.selectorInstance.getTags().map(tag => ({
					id: tag.getId(),
					entityId: tag.getEntityId(),
					name: tag.getTitle()
				}));
				this.$emit('update:modelValue', selectedItems);
			}
		},
		template: '<div></div>'
	};

	const CRM_LEAD_SOURCE_DIALOG_OPTIONS = Object.freeze({
		width: 300,
		height: 300,
		enableSearch: true
	});

	// @vue/component
	const CrmIntegration = {
		name: 'crm-integration',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			BitrixSettingSelector,
			UserSelector
		},
		mixins: [LocalizationMixin, PreparedIndirectPhraseMixin],
		props: {
			/** @type CrmIntegrationSettingsType */
			modelValue: {
				type: Object,
				required: true
			},
			canEditCrmIntegration: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				showAddressTextarea: false,
				crmLeadSourceDialogOptions: CRM_LEAD_SOURCE_DIALOG_OPTIONS
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['crmSourceOptions', 'crmSyncOptions', 'crmEntityOptions']),
			localModelValue: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			syncLabel() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_LABEL', '#PERIOD#');
			},
			incomingLabel() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_LABEL', '#INCOMING#');
			},
			outgoingLabel() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_LABEL', '#OUTGOING#');
			},
			leadSourceIncomingLabel() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_LABEL', '#INCOMING_CURRENT#');
			},
			syncPeriodOptions() {
				return this.crmSyncOptions;
			},
			createActionOptions() {
				return this.crmEntityOptions;
			},
			sourceOptions() {
				return this.crmSourceOptions;
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			noAccessHintParams() {
				return {
					text: this.loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_NO_ACCESS_HINT'),
					popupOptions: {
						className: 'mail_massconnect__integration_crm_hint',
						darkMode: false,
						offsetTop: 2,
						background: 'var(--ui-color-bg-content-inapp)',
						padding: 6,
						angle: true,
						targetContainer: document.body,
						offsetLeft: 20
					}
				};
			}
		},
		methods: {
			handleSwitcherClick() {
				if (this.canEditCrmIntegration) {
					this.localModelValue.enabled = !this.localModelValue.enabled;
				}
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__integration-block" :class="{ '--disabled': !localModelValue.enabled }">
			<div 
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_crmr-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --crm"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_TITLE') }}
					</span>
				</div>
				<div class="mail_massconnect__integration-block_switcher-container" >
					<Switcher
						:isChecked="localModelValue.enabled"
						:isDisabled="!canEditCrmIntegration"
						:options="switcherOptions"
						v-hint="!canEditCrmIntegration ? noAccessHintParams : undefined"
						@click="handleSwitcherClick"
					/>
				</div>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled" class="mail_massconnect__integration-block_content-wrapper">
					<div class="mail_massconnect__integration-block_content">
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__crm-sync"
								v-model="localModelValue.sync.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_crm-sync_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_crm-sync_label"
							>
								<label for="mail_massconnect__crm-sync">
									<span class="mail_massconnect__label-text_before">
										{{ syncLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.sync.periodValue"
									:options="syncPeriodOptions"
								/>
								<label for="mail_massconnect__crm-sync">
									<span class="mail_massconnect__label-text_after">
										{{ syncLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_HINT') }}
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__assign-known"
								v-model="localModelValue.assignKnownClientEmails"
								data-test-id="mail_massconnect__settings_crm-integration_assign-known_checkbox"
							/>
							<label for="mail_massconnect__assign-known">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_ASSIGN_KNOWN_LABEL') }}
								</span>
							</label>
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__incoming-new"
								v-model="localModelValue.incoming.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_incoming-new_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_incoming-new_label"
							>
								<label for="mail_massconnect__incoming-new">
									<span class="mail_massconnect__label-text_before">
										{{ incomingLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.incoming.createAction"
									:options="createActionOptions"
								/>
								<label for="mail_massconnect__incoming-new">
									<span class="mail_massconnect__label-text_after">
										{{ incomingLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_HINT') }}
						</div>
						<div class="mail_massconnect__checkbox-group">
							<input
								type="checkbox"
								id="mail_massconnect__outgoing-new"
								v-model="localModelValue.outgoing.enabled"
								data-test-id="mail_massconnect__settings_crm-integration_outgoing-new_checkbox"
							/>
							<div 
								class="mail_massconnect__indirect-label"
								data-test-id="mail_massconnect__settings_crm-integration_outgoing-new_label"
							>
								<label for="mail_massconnect__outgoing-new">
									<span class="mail_massconnect__label-text_before">
										{{ outgoingLabel.beforeText }}
									</span>
								</label>
								<BitrixSettingSelector
									v-model="localModelValue.outgoing.createAction"
									:options="createActionOptions"
								/>
								<label for="mail_massconnect__outgoing-new">
									<span class="mail_massconnect__label-text_after">
										{{ outgoingLabel.afterText }}
									</span>
								</label>
							</div>
						</div>
						<div class="mail_massconnect__integration-hint">
							{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_HINT') }}
						</div>

						<div 
							class="mail_massconnect__group-inline"
							data-test-id="mail_massconnect__settings_source_group"
						>
							<span class="mail_massconnect__group-inline_label">
								<span class="mail_massconnect__label-text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_LABEL') }}
								</span>
							</span>
							<BitrixSettingSelector
								v-model="localModelValue.source"
								:options="sourceOptions"
								:dialog-options="crmLeadSourceDialogOptions"
							/>
						</div>

						<span class="mail_massconnect__group-inline_label">
							<span class="mail_massconnect__label-text_before">
								{{ leadSourceIncomingLabel.beforeText }}
							</span>
							<a
								href="#"
								class="mail_massconnect__set-textarea-show"
								@click.prevent="showAddressTextarea = !showAddressTextarea"
								data-test-id="mail_massconnect__settings_show-address-textarea_link"
							>
								<span class="mail_massconnect__set-textarea-show_text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_BUTTON_LABEL') }}
								</span>
								<div
									class="ui-icon-set --chevron-down"
									style="--ui-icon-set__icon-size: 16px; --ui-icon-set__icon-color: #6a737f;"
								>
								</div>
							</a>
							<span class="mail_massconnect__label-text_after">
								{{ leadSourceIncomingLabel.afterText }}
							</span>
						</span>
						<textarea
							v-if="showAddressTextarea"
							v-model="localModelValue.leadCreationAddresses"
							class="mail_massconnect__control-textarea"
							:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_PLACEHOLDER')"
							data-test-id="mail_massconnect__settings_address-textarea"
						>
						</textarea>
					</div>
					<div class="mail_massconnect__integration-block_content">
						<div 
							class="mail_massconnect__user-selector-group"
							data-test-id="mail_massconnect__settings_crm-user-queue_group"
						>
							<span class="mail_massconnect__group-inline_label">
								<span class="mail_massconnect__label_user-selector_text">
									{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_QUEUE_LABEL') }}
								</span>
							</span>
							<UserSelector
								v-model="localModelValue.responsibleQueue"
								class="mail_massconnect__control-user-selector"
							/>
						</div>
					</div>
				</div>
			</transition>
		</div>
	`
	};

	// @vue/component
	const CalendarIntegration = {
		name: 'calendar-integration',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher
		},
		mixins: [LocalizationMixin],
		props: {
			/** @type CalendarIntegrationSettingsType */
			modelValue: {
				type: Object,
				required: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			localModelValue: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__integration-block" :class="{ '--disabled': !localModelValue.enabled }">
			<div 
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_calendar-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --calendar"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CALENDAR_TITLE') }}
					</span>
				</div>
				<Switcher
					:isChecked="localModelValue.enabled"
					:options="switcherOptions"
					@click="localModelValue.enabled = !localModelValue.enabled"
				/>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled" class="mail_massconnect__integration-block_content">
					<div class="mail_massconnect__checkbox-group">
						<input
							type="checkbox"
							id="mail_massconnect__auto-add-events"
							v-model="localModelValue.autoAddEvents"
							data-test-id="mail_massconnect__settings_calendar-integration_auto-add-events-checkbox"
						/>
						<label for="mail_massconnect__auto-add-events">
							{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CALENDAR_AUTO_ADD') }}
						</label>
					</div>
				</div>
			</transition>
		</div>
	`
	};

	const MailboxSettings = {
		components: {
			MailIntegration,
			CrmIntegration,
			CalendarIntegration,
			Switcher: ui_vue3_components_switcher.Switcher
		},
		mixins: [LocalizationMixin],
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['mailSettings', 'crmSettings', 'calendarSettings', 'analyticsSource', 'permissions']),
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(useWizardStore, ['setMailSettings', 'setCrmSettings', 'setCalendarSettings']),
			onStepComplete() {
				const calendarState = this.calendarSettings.enabled ? 'true' : 'false';
				const crmState = this.crmSettings.enabled ? 'true' : 'false';
				ui_analytics.sendData({
					tool: 'mail',
					event: 'mailbox_mass_step3',
					category: 'mail_mass_ops',
					c_section: this.analyticsSource,
					p1: `integrationCalendar_${calendarState}`,
					p2: `integrationCRM_${crmState}`
				});
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__mailbox-settings_form">
			<div class="mail_massconnect__section-title_container">
				<span class="mail_massconnect__section-title">
					{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_TITLE') }}
				</span>
				<span class="mail_massconnect__section-description">
					{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_DESCRIPTION') }}
				</span>
			</div>

			<MailIntegration
				:model-value="mailSettings"
				@update:model-value="setMailSettings($event)"
			/>

			<CrmIntegration
				:model-value="crmSettings"
				:can-edit-crm-integration="permissions.canEditCrmIntegration"
				@update:model-value="setCrmSettings($event)"
			/>

			<CalendarIntegration
				:model-value="calendarSettings"
				@update:model-value="setCalendarSettings($event)"
			/>
		</div>
	`
	};

	const EventName = {
		MAILBOX_APPEND_SUCCESS: 'mail-massconnect-mailboxes-append-success',
		PASSWORDLESS_REQUESTS_SENT: 'mail-massconnect-passwordless-requests-sent'
	};

	// @vue/component
	const ConnectionStatus = {
		name: 'connection-status',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [LocalizationMixin],
		props: {
			/** @type MailboxPayload[] */
			mailboxes: {
				type: Array,
				required: true
			},
			/** @type MassConnectDataType */
			massConnectData: {
				type: Object,
				required: true
			}
		},
		emits: ['fix-errors'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				totalMailboxes: 0,
				processedCount: 0,
				successfulCount: 0,
				errorCount: 0,
				errorDetails: [],
				isCancelled: false,
				isFinished: false,
				detectedErrorType: ''
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['analyticsSource', 'calendarSettings', 'crmSettings', 'passwordlessMode', 'connectionSettings']),
			outline() {
				return ui_iconSet_api_vue.Outline;
			},
			hasErrors() {
				return this.isFinished && this.errorCount > 0;
			},
			isSuccess() {
				return this.isFinished && this.errorCount === 0;
			},
			isImapConnectionError() {
				return this.detectedErrorType === ERROR_TYPE_IMAP_CONNECTION;
			},
			isSmtpConnectionError() {
				return this.detectedErrorType === ERROR_TYPE_SMTP_CONNECTION;
			},
			isGlobalConnectionError() {
				return this.isImapConnectionError || this.isSmtpConnectionError;
			},
			isFixableError() {
				return ALLOWED_CONNECTION_ERROR_TYPES.includes(this.detectedErrorType);
			},
			successMessage() {
				const langKey = this.passwordlessMode ? 'MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_REQUESTS_SENT' : 'MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_ALL_CONNECTED';
				return this.loc(langKey);
			},
			successButtonText() {
				const langKey = this.passwordlessMode ? 'MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_BUTTON_TITLE' : 'MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE';
				return this.loc(langKey);
			},
			successButtonStyle() {
				return this.passwordlessMode ? ui_vue3_components_button.AirButtonStyle.PLAIN : ui_vue3_components_button.AirButtonStyle.FILLED;
			},
			successButtonSize() {
				return this.passwordlessMode ? ui_vue3_components_button.ButtonSize.EXTRA_LARGE : ui_vue3_components_button.ButtonSize.MEDIUM;
			},
			statusParts() {
				const langKey = this.passwordlessMode ? 'MAIL_MASSCONNECT_FORM_CONNECTION_STATUS_PASSWORDLESS' : 'MAIL_MASSCONNECT_FORM_CONNECTION_STATUS';
				const rawString = this.loc(langKey);
				const pattern = /(#REMAINING_CNT#|#TOTAL_CNT#)/g;
				const parts = rawString.split(pattern).filter(Boolean);
				return parts.map((part, index) => {
					if (part === '#REMAINING_CNT#') {
						return {
							type: 'counter',
							key: `remaining-${index}`,
							value: this.totalMailboxes - this.processedCount
						};
					}
					if (part === '#TOTAL_CNT#') {
						return {
							type: 'static',
							key: `total-${index}`,
							value: this.totalMailboxes
						};
					}
					return {
						type: 'text',
						key: `text-${index}`,
						value: part
					};
				});
			},
			errorStatusParts() {
				if (this.errorCount === 0) {
					return [];
				}
				const rawString = main_core.Loc.getMessagePlural('MAIL_MASSCONNECT_FORM_CONNECTION_STATUS_FAILURE_CONNECTION', this.errorCount);
				const pattern = /(#ERROR_CNT#)/g;
				const parts = rawString.split(pattern).filter(Boolean);
				return parts.map((part, index) => {
					if (part === '#ERROR_CNT#') {
						return {
							type: 'counter',
							key: `error-${index}`,
							value: this.errorCount
						};
					}
					return {
						type: 'text',
						key: `text-${index}`,
						value: part
					};
				});
			},
			errorTitle() {
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_TITLE');
			},
			errorDescription() {
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_DESCRIPTION');
			},
			fixButtonText() {
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FIX_BUTTON_TITLE');
			},
			hasErrorDetails() {
				return this.errorDetails.some(item => {
					return main_core.Type.isStringFilled(item.message) || main_core.Type.isPlainObject(item.customData);
				});
			}
		},
		created() {
			main_core.Dom.hide(document.querySelector('.ui-side-panel-toolbar'));
			this.totalMailboxes = this.mailboxes.length;
			this.startProcessing();
		},
		methods: {
			getErrorDetailsHintParams() {
				return {
					interactivity: true,
					popupOptions: {
						id: `mail_massconnect__connection-status_error-details_hint-${main_core.Text.getRandom()}`,
						className: 'mail_massconnect__connection-status_error-details_hint',
						darkMode: false,
						offsetTop: 2,
						background: 'var(--ui-color-bg-content-inapp)',
						angle: true,
						targetContainer: document.body,
						offsetLeft: 42,
						cacheable: false,
						content: this.createHintContent()
					}
				};
			},
			createHintContent() {
				const title = this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_ERROR_DETAILS_HINT_TITLE');
				const errorNodes = this.errorDetails.filter(item => main_core.Type.isStringFilled(item.message)).map(item => main_core.Tag.render`
					<div class="mail_massconnect-hint-item">
						${main_core.Text.encode(item.message)}
					</div>
				`);
				return main_core.Tag.render`
				<div class="mail_massconnect__connection-status_error-details_hint_content">
					<div class="mail_massconnect__connection-status_error-details_hint_content_title">
						${title}
					</div>
					<div class="mail_massconnect__connection-status_error-details_hint_content_list">
						${errorNodes}
					</div>
				</div>
			`;
			},
			async startProcessing() {
				if (this.passwordlessMode) {
					this.startPasswordlessProcessing();
					return;
				}
				let massConnectId = null;
				try {
					const result = await Api.saveMailboxConnectionData(this.massConnectData);
					massConnectId = result?.data?.id;
					if (!massConnectId) {
						throw new Error('Failed to save mailbox connection data');
					}
				} catch (error) {
					const errorMessages = this.getErrorMessages(error);
					const message = errorMessages.join(' ');
					this.errorDetails = this.mailboxes.map(mailbox => this.buildErrorDetail({
						message
					}, mailbox));
					this.errorCount = this.mailboxes.length;
					this.isFinished = true;
					return;
				}
				this.processMailboxes(this.mailboxes, massConnectId);
			},
			async processMailboxes(mailboxes, massConnectId) {
				for (const mailbox of mailboxes) {
					if (this.isCancelled) {
						continue;
					}
					try {
						// eslint-disable-next-line no-await-in-loop
						await Api.connectMailbox(mailbox, massConnectId);
						this.handleMailboxSuccess();
					} catch (error) {
						this.handleMailboxError(error, mailbox);
					} finally {
						this.processedCount++;
					}
				}
				this.isFinished = true;
				const calendarState = this.calendarSettings.enabled ? 'true' : 'false';
				const crmState = this.crmSettings.enabled ? 'true' : 'false';
				ui_analytics.sendData({
					tool: 'mail',
					event: 'mailbox_mass_complete',
					category: 'mail_mass_ops',
					c_section: this.analyticsSource,
					p1: `integrationCalendar_${calendarState}`,
					p2: `integrationCRM_${crmState}`
				});
				if (this.successfulCount > 0 && !this.isCancelled) {
					BX.SidePanel.Instance.postMessage(window, EventName.MAILBOX_APPEND_SUCCESS);
				}
			},
			async startPasswordlessProcessing() {
				try {
					await Api.validateConnectionSettings(this.buildValidationSettings());
				} catch (error) {
					const errorDetails = this.collectErrorDetails(error);
					this.updateDetectedErrorType(errorDetails);
					this.errorDetails = this.mailboxes.map(mailbox => this.buildErrorDetail(error?.errors?.[0] ?? error, mailbox));
					this.errorCount = this.mailboxes.length;
					this.processedCount = this.mailboxes.length;
					this.isFinished = true;
					return;
				}
				this.processPasswordlessRequests(this.mailboxes);
			},
			async processPasswordlessRequests(mailboxes) {
				for (const mailbox of mailboxes) {
					if (this.isCancelled) {
						continue;
					}
					try {
						// eslint-disable-next-line no-await-in-loop
						await Api.createPasswordlessRequest(mailbox);
						this.handleMailboxSuccess();
					} catch (error) {
						this.handleMailboxError(error, mailbox);
					} finally {
						this.processedCount++;
					}
				}
				this.isFinished = true;
				if (this.successfulCount > 0 && !this.isCancelled) {
					BX.SidePanel.Instance.postMessage(window, EventName.PASSWORDLESS_REQUESTS_SENT);
				}
			},
			buildValidationSettings() {
				const settings = {
					server: this.connectionSettings.imapServer,
					port: this.connectionSettings.imapPort,
					ssl: this.connectionSettings.imapSsl
				};
				if (this.connectionSettings.smtpSettings.enabled) {
					settings.serverSmtp = this.connectionSettings.smtpSettings.server;
					settings.portSmtp = this.connectionSettings.smtpSettings.port;
					settings.sslSmtp = this.connectionSettings.smtpSettings.ssl;
				}
				return settings;
			},
			handleMailboxSuccess() {
				this.successfulCount++;
			},
			handleMailboxError(error, mailbox) {
				this.errorCount++;
				const errorDetails = this.collectErrorDetails(error, mailbox);
				errorDetails.forEach(item => this.errorDetails.push(item));
				this.updateDetectedErrorType(errorDetails);

				// Connection error is global — cancel remaining attempts
				if (this.isGlobalConnectionError) {
					this.isCancelled = true;
				}
			},
			updateDetectedErrorType(errorDetails) {
				const detectedErrorType = this.detectErrorTypeFromDetails(errorDetails);
				if (detectedErrorType && (detectedErrorType === ERROR_TYPE_IMAP_CONNECTION || detectedErrorType === ERROR_TYPE_SMTP_CONNECTION || !this.detectedErrorType)) {
					this.detectedErrorType = detectedErrorType;
				}
			},
			determineErrorType(errorType) {
				switch (errorType) {
					case 'auth':
						return ERROR_TYPE_AUTH;
					case 'imap_connection':
						return ERROR_TYPE_IMAP_CONNECTION;
					case 'smtp_connection':
						return ERROR_TYPE_SMTP_CONNECTION;
					default:
						return '';
				}
			},
			getErrorMessages(error) {
				if (main_core.Type.isArray(error?.errors)) {
					return error.errors.map(item => item?.message).filter(message => main_core.Type.isStringFilled(message));
				}
				if (main_core.Type.isStringFilled(error?.message)) {
					return [error.message];
				}
				return [];
			},
			buildErrorDetail(rawError, mailbox) {
				const message = main_core.Type.isString(rawError?.message) ? rawError.message : '';
				const rawCode = rawError?.code;
				const code = main_core.Type.isNumber(rawCode) || main_core.Type.isStringFilled(rawCode) ? rawCode : 0;
				let customData = main_core.Type.isPlainObject(rawError?.customData) ? {
					...rawError.customData
				} : null;
				if (mailbox && (!customData || !customData.userIdToConnect)) {
					customData = {
						...customData,
						userIdToConnect: mailbox.userIdToConnect
					};
				}
				if (customData && Object.keys(customData).length === 0) {
					customData = null;
				}
				return {
					code,
					message,
					customData: customData ?? undefined
				};
			},
			collectErrorDetails(error, mailbox) {
				if (main_core.Type.isArray(error?.errors) && error.errors.length > 0) {
					return error.errors.map(item => this.buildErrorDetail(item, mailbox));
				}
				return [this.buildErrorDetail(error, mailbox)];
			},
			detectErrorTypeFromDetails(details) {
				const detectedTypes = new Set(details.map(item => this.determineErrorType(item.customData?.type)).filter(Boolean));
				if (detectedTypes.has(ERROR_TYPE_IMAP_CONNECTION)) {
					return ERROR_TYPE_IMAP_CONNECTION;
				}
				if (detectedTypes.has(ERROR_TYPE_SMTP_CONNECTION)) {
					return ERROR_TYPE_SMTP_CONNECTION;
				}
				if (detectedTypes.has(ERROR_TYPE_AUTH)) {
					return ERROR_TYPE_AUTH;
				}
				return '';
			},
			handleCancel() {
				this.isCancelled = true;
				this.isFinished = true;
				ui_notification.UI.Notification.Center.notify({
					id: 'mail_massconnect_connection_cancelled',
					content: this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCELLED_MESSAGE')
				});
			},
			handleFixErrors() {
				main_core.Dom.show(document.querySelector('.ui-side-panel-toolbar'));
				this.$emit('fix-errors', this.errorDetails, this.successfulCount, this.detectedErrorType);
			},
			closeWizard() {
				const slider = BX.SidePanel.Instance.getTopSlider();
				if (slider) {
					slider.close();
				}
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__connection-status-view">
			<div
				v-if="!isFinished"
				class="mail_massconnect__connection-status-view_content --processing"
				data-test-id="mail_massconnect__connection-status-view_processing"
			>
				<div class="mail_massconnect__connection-status_processing-upper">
					<div class="mail_massconnect__connection-status-view_icon --processing"></div>
					<div class="mail_massconnect__connection-status-view_text">
						<template v-for="part in statusParts" :key="part.key">

							<span v-if="part.type === 'text'">{{ part.value }}</span>

							<span
								v-else-if="part.type === 'counter'"
								class="mail_massconnect__connection-status-view_text_counter"
							>
								<Transition name="mail_massconnect__connection-status-view_text_counter_counter-slide-up">
									<span
										:key="part.key + '-' + part.value"
										class="mail_massconnect__connection-status-view_text_counter_value"
									>
										{{ part.value }}
									</span>
								</Transition>
							</span>

							<span
								v-else
								class="mail_massconnect__connection-status-view_text_counter"
							>
								{{ part.value }}
							</span>

						</template>
					</div>
					<div
						v-if="errorCount > 0"
						class="mail_massconnect__connection-status-view_error-text"
					>
						<BIcon
							:name="outline.ALERT_ACCENT"
							:size="24"
							color="var(--ui-color-text-alert)"
						/>
						<span class="mail_massconnect__connection-status-view_error-text_wrapper">
							<template v-for="part in errorStatusParts" :key="part.key">
								<span v-if="part.type === 'text'">{{ part.value }}</span>

								<span
									v-else-if="part.type === 'counter'"
									class="mail_massconnect__connection-status-view_error-text_counter"
								>
									<Transition name="mail_massconnect__connection-status-view_text_counter_counter-slide-up">
										<span
											:key="part.key + '-' + part.value"
											class="mail_massconnect__connection-status-view_text_counter_value"
										>
											{{ part.value }}
										</span>
									</Transition>
								</span>
							</template>
						</span>
					</div>
				</div>
				<UiButton
					:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCEL_BUTTON_TITLE')"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="handleCancel"
					class="mail_massconnect__connection-status_cancel-button"
				/>
			</div>

			<div
				v-if="isSuccess"
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_success"
			>
				<div class="mail_massconnect__connection-status-view_icon --success"></div>
				<div class="mail_massconnect__connection-status-view_text">
					{{ successMessage }}
				</div>
				<UiButton
					:text="successButtonText"
					:style="successButtonStyle"
					:size="successButtonSize"
					@click="closeWizard"
				/>
			</div>

			<div
				v-if="hasErrors"
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_has-errors"
			>
				<div class="mail_massconnect__connection-status-view_icon --failure"></div>
				<div class="mail_massconnect__connection-status_failure-text-container">
					<div class="mail_massconnect__connection-status_failure-text-title">
						{{ errorTitle }}
					</div>
					<div class="mail_massconnect__connection-status_failure-text-description">
						{{ errorDescription }}
						<span
							v-if="hasErrorDetails"
							class="mail_massconnect__connection-status_details-link"
							v-hint="getErrorDetailsHintParams"
						>{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DETAILS_LINK') }}</span>
					</div>
				</div>
				<div
					class="mail_massconnect__connection-status-view_buttons"
					data-test-id="mail_massconnect__connection-status-view_has-errors_buttons"
				>
					<UiButton
						v-if="isFixableError"
						:text="fixButtonText"
						:style="AirButtonStyle.FILLED"
						:rightCounterValue="isGlobalConnectionError ? null : errorCount"
						size="ui-btn-lg"
						class="mail_massconnect__connection-status-view_has-errors_buttons_fix-button"
						@click="handleFixErrors"
					/>
					<UiButton
						:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE')"
						:style="AirButtonStyle.PLAIN"
						class="mail_massconnect__connection-status-view_has-errors_buttons_close-button"
						size="ui-btn-lg"
						@click="closeWizard"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const WizardHint = {
		name: 'WizardHint',
		mixins: [LocalizationMixin, PreparedIndirectPhraseMixin],
		computed: {
			hintDescriptionText() {
				return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_DESCRIPTION', '#HELP_LINK#');
			}
		},
		methods: {
			goToBPHelp(event) {
				if (top.BX && top.BX.Helper) {
					if (event) {
						event.preventDefault();
					}
					top.BX.Helper.show('redirect=detail&code=26953018');
				}
			}
		},
		template: `
		<div class="mail_massconnect__wizard_card">
			<div class="mail_massconnect__wizard_card_hint">
				<div class="mail_massconnect__section-title_container">
					<span class="mail_massconnect__section-description">
						<span>{{ hintDescriptionText.beforeText }}</span>
						<span class="mail_massconnect__section-description_hint-link" @click="goToBPHelp">
							{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_HELP_LINK') }}
						</span>
						<span>{{ hintDescriptionText.afterText }}</span>
					</span>
				</div>
			</div>
		</div>
	`
	};

	/**
	 * @typedef {import('vue').Component & {title: string}} WizardStepComponent
	 */

	// @vue/component
	var WizardContainer = {
		components: {
			WizardProgressBar,
			WizardNavigation,
			ConnectionStatus,
			WizardHint
		},
		mixins: [LocalizationMixin],
		data() {
			return {
				currentStepIndex: 0,
				successfulCount: 0,
				isSubmitting: false,
				isCurrentStepValid: false,
				validationAttempted: false,
				mailboxesToConnect: [],
				massConnectData: {},
				steps: [ui_vue3.markRaw(ConnectionData), ui_vue3.markRaw(SelectEmployees), ui_vue3.markRaw(MailboxSettings)]
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useWizardStore, ['analyticsSource']),
			isContinueButtonDisabled() {
				const shouldDisable = this.activeStepComponent.disableButtonOnInvalid ?? true;
				return shouldDisable && !this.isCurrentStepValid;
			},
			totalSteps() {
				return this.steps.length;
			},
			activeStepComponent() {
				return this.steps[this.currentStepIndex];
			},
			isFirstStep() {
				return this.currentStepIndex === 0;
			},
			isLastStep() {
				return this.currentStepIndex === this.totalSteps - 1;
			},
			isSecondStep() {
				return this.currentStepIndex === 1;
			}
		},
		watch: {
			currentStepIndex() {
				this.validationAttempted = false;
			}
		},
		mounted() {
			ui_analytics.sendData({
				tool: 'mail',
				event: 'mailbox_mass_open',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource
			});
		},
		methods: {
			nextStep() {
				this.validationAttempted = true;
				this.$nextTick(() => {
					if (this.isCurrentStepValid && !this.isLastStep) {
						this.handleStepCompletion();
						this.currentStepIndex++;
					}
				});
			},
			prevStep() {
				if (!this.isFirstStep) {
					this.currentStepIndex--;
				}
			},
			async submitWizard() {
				this.handleStepCompletion();
				const wizardStore = useWizardStore();
				const prepareData = wizardStore.prepareDataForBackend();
				this.mailboxesToConnect = prepareData.mailboxes;
				this.massConnectData = wizardStore.prepareDataForHistory();
				if (this.mailboxesToConnect.length === 0) {
					return;
				}
				this.isSubmitting = true;
			},
			handleStepCompletion() {
				if (this.$refs.activeComponent && main_core.Type.isFunction(this.$refs.activeComponent.onStepComplete)) {
					this.$refs.activeComponent.onStepComplete();
				}
			},
			handleFixErrors(errorsFromBackend, successfulCount, errorType) {
				this.successfulCount = successfulCount;
				const wizardStore = useWizardStore();
				if (!ALLOWED_CONNECTION_ERROR_TYPES.includes(errorType)) {
					return;
				}
				switch (errorType) {
					case ERROR_TYPE_IMAP_CONNECTION:
						this.handleImapConnectionError(wizardStore);
						break;
					case ERROR_TYPE_SMTP_CONNECTION:
						this.handleSmtpConnectionError(wizardStore);
						break;
					case ERROR_TYPE_AUTH:
						this.handleAuthError(wizardStore, errorsFromBackend);
						break;
				}
			},
			handleImapConnectionError(wizardStore) {
				wizardStore.enableErrorState(ERROR_TYPE_IMAP_CONNECTION);
				this.isSubmitting = false;
				this.currentStepIndex = 0;
			},
			handleSmtpConnectionError(wizardStore) {
				wizardStore.enableErrorState(ERROR_TYPE_SMTP_CONNECTION);
				this.isSubmitting = false;
				this.currentStepIndex = 0;
			},
			handleAuthError(wizardStore, errorsFromBackend) {
				wizardStore.enableErrorState(ERROR_TYPE_AUTH);
				const userIdsWithErrors = new Set(errorsFromBackend.map(error => error.customData?.userIdToConnect).filter(Boolean));
				const employeesWithErrors = [];
				const successfulEmployees = [];
				for (const employee of wizardStore.employees) {
					const cleanedEmployee = {
						...employee,
						password: ''
					};
					if (userIdsWithErrors.has(employee.id)) {
						employeesWithErrors.push(cleanedEmployee);
					} else {
						successfulEmployees.push(cleanedEmployee);
					}
				}
				const addedEmployees = [...wizardStore.addedEmployees, ...successfulEmployees];
				wizardStore.setAddedEmployees(addedEmployees);
				wizardStore.setEmployees(employeesWithErrors);
				this.isSubmitting = false;
				this.currentStepIndex = 1;
			}
		},
		// language=Vue
		template: `
		<div class="mail_massconnect__wizard_container">
			<template v-if="!isSubmitting">
				<WizardProgressBar
					:total-steps="totalSteps"
					:current-step-index="currentStepIndex"
				/>

				<WizardHint v-if="isFirstStep"/>

				<div class="mail_massconnect__wizard_card">
					<div class="mail_massconnect__wizard_card_content">
						<component
							ref="activeComponent"
							:is="activeStepComponent"
							:validationAttempted="validationAttempted"
							@update:validity="isCurrentStepValid = $event"
						/>
					</div>
				</div>

				<WizardNavigation
					:isFirstStep="isFirstStep"
					:isLastStep="isLastStep"
					:isSubmitting="isSubmitting"
					:prevDisabled="isSecondStep && successfulCount > 0"
					:disabledContinueButton="isContinueButtonDisabled"
					@prev-step="prevStep"
					@next-step="nextStep"
					@submit="submitWizard"
				/>
			</template>

			<template v-else>
				<div class="mail_massconnect__wizard_connection_status_container">
					<div class="mail_massconnect__wizard_connection_status_content">
						<ConnectionStatus
							:mailboxes="mailboxesToConnect"
							:massConnectData="massConnectData"
							@fix-errors="handleFixErrors"
						/>
					</div>
				</div>
			</template>
		</div>
	`
	};

	class MassconnectForm {
		#application;
		settingsConfig = null;
		source = null;
		isSmtpAvailable = false;
		features = {
			isPasswordlessConnectAvailable: false
		};
		permissions = {
			allowedLevels: null,
			canEditCrmIntegration: null
		};
		constructor(options = {}) {
			this.rootNode = document.querySelector(`#${options.appContainerId}`);
			this.settingsConfig = options?.settingsConfig ?? null;
			this.source = options?.source;
			this.isSmtpAvailable = options.isSmtpAvailable ?? false;
			this.features = options?.features ?? this.features;
			if (options?.permissions) {
				this.permissions = options.permissions;
			}
		}
		start() {
			const pinia = ui_vue3_pinia.createPinia();
			this.#application = ui_vue3.BitrixVue.createApp({
				components: {
					WizardContainer
				},
				// language=Vue
				template: '<WizardContainer />'
			});
			this.#application.use(pinia);
			const wizardStore = useWizardStore();
			wizardStore.setAnalyticsSource(this.source);
			wizardStore.setSmtpStatus(this.isSmtpAvailable);
			wizardStore.setFeatures(this.features);
			wizardStore.setPermissions(this.permissions);
			if (this.settingsConfig) {
				wizardStore.setMailboxSettingsConfig(this.settingsConfig);
			}
			this.#application.mount(this.rootNode);
		}
	}

	exports.MassconnectForm = MassconnectForm;

})(this.BX.Mail.Massconnect = this.BX.Mail.Massconnect || {}, BX.Vue3, BX.Vue3.Pinia, BX, BX.UI.Analytics, BX.Vue3.Components, BX.UI.System.Input, BX.UI.System.Input.Vue, BX, BX.UI.EntitySelector, BX.UI.IconSet, BX.UI.Vue3.Components, BX.UI, BX.UI.Dialogs, BX.UI.Vue3.Components, BX.Mail, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives);
//# sourceMappingURL=massconnect-form.bundle.js.map
