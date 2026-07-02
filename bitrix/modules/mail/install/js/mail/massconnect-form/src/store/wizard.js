import { defineStore } from 'ui.vue3.pinia';
import type {
	BackendPayload,
	CrmOptionsPayload,
	CrmSettingsState,
	CalendarSettingsState,
	MassConnectDataType,
	MassconnectFeatures,
	MassconnectPermissions,
	Employee,
	MailSettingsState,
	MailboxSettingsConfig,
	SettingOption,
} from './type';
import { YES_VALUE, NO_VALUE, SERVICE_CONFIG } from './const';

function normalizeOptions(options: ?Array<{value: string | number, label: string}>): SettingOption[]
{
	if (!Array.isArray(options))
	{
		return [];
	}

	return options.map((option): SettingOption => ({
		value: String(option.value),
		label: option.label || String(option.value),
	}));
}

function resolveSettingValue(options: SettingOption[], currentValue: ?(string | number), defaultValue: ?(string | number)): string
{
	const normalizedCurrentValue = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
	if (options.some((option) => option.value === normalizedCurrentValue))
	{
		return normalizedCurrentValue;
	}

	const normalizedDefaultValue = defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '';
	if (options.some((option) => option.value === normalizedDefaultValue))
	{
		return normalizedDefaultValue;
	}

	return options[0]?.value || '';
}

export const useWizardStore = defineStore('wizard', {
	state: () => ({
		connectionSettings: {
			imapServer: '',
			imapPort: null,
			imapSsl: true,
			smtpSettings: {
				enabled: false,
				server: '',
				port: null,
				ssl: true,
			},
		},
		employees: [],
		addedEmployees: [],
		mailSyncOptions: [],
		mailSettings: {
			sync: {
				enabled: true,
				periodValue: '',
			},
		},
		crmSyncOptions: [],
		crmEntityOptions: [],
		crmSettings: {
			enabled: false,
			sync: {
				enabled: true,
				periodValue: '',
			},
			assignKnownClientEmails: true,
			incoming: {
				enabled: true,
				createAction: '',
			},
			outgoing: {
				enabled: true,
				createAction: '',
			},
			source: '',
			leadCreationAddresses: '',
			responsibleQueue: [],
		},
		crmSourceOptions: [],
		calendarSettings: {
			enabled: true,
			autoAddEvents: true,
		},
		errorState: {
			enabled: false,
			errorType: '',
		},
		passwordlessMode: false,
		isPasswordlessConnectAvailable: false,
		isLoginColumnShown: false,
		analyticsSource: '',
		permissions: {
			allowedLevels: null,
			canEditCrmIntegration: false,
		},
	}),
	actions: {
		addEmployee(employeeItem: Employee): void
		{
			if (this.employees.some((employee) => employee.id === employeeItem.id))
			{
				return;
			}

			this.employees.push(employeeItem);
		},
		removeEmployeeById(employeeId: number): void
		{
			this.employees = this.employees.filter((employee) => employee.id !== employeeId);
		},
		setEmployees(employees: Employee[]): void
		{
			this.employees = employees;
		},
		clearEmployees(): void
		{
			this.employees = [];
		},
		setAddedEmployees(employees: Employee[]): void
		{
			this.addedEmployees = employees;
		},
		setMailSettings(newSettings: MailSettingsState): void
		{
			this.mailSettings = newSettings;
		},
		setCrmSettings(newSettings: CrmSettingsState): void
		{
			this.crmSettings = newSettings;
		},
		setMailboxSettingsConfig(settingsConfig: MailboxSettingsConfig): void
		{
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
			this.mailSettings.sync.periodValue = resolveSettingValue(
				mailSyncOptions,
				this.mailSettings.sync.periodValue,
				defaults.messageMaxAge,
			);

			this.crmSettings.enabled = defaults.crmEnabled ?? this.crmSettings.enabled;
			this.crmSettings.sync.enabled = defaults.crmSyncEnabled ?? this.crmSettings.sync.enabled;
			this.crmSettings.sync.periodValue = resolveSettingValue(
				crmSyncOptions,
				this.crmSettings.sync.periodValue,
				defaults.crmSyncPeriod,
			);
			this.crmSettings.assignKnownClientEmails = defaults.crmAssignKnownClientEmails
				?? this.crmSettings.assignKnownClientEmails;
			this.crmSettings.incoming.enabled = defaults.crmIncomingCreate ?? this.crmSettings.incoming.enabled;
			this.crmSettings.incoming.createAction = resolveSettingValue(
				crmEntityOptions,
				this.crmSettings.incoming.createAction,
				defaults.crmIncomingEntity,
			);
			this.crmSettings.outgoing.enabled = defaults.crmOutgoingCreate ?? this.crmSettings.outgoing.enabled;
			this.crmSettings.outgoing.createAction = resolveSettingValue(
				crmEntityOptions,
				this.crmSettings.outgoing.createAction,
				defaults.crmOutgoingEntity,
			);
			this.crmSettings.source = resolveSettingValue(
				crmSourceOptions,
				this.crmSettings.source,
				defaults.crmSource || settingsConfig?.defaultCrmSource,
			);
			this.calendarSettings.enabled = defaults.calendarAutoAddEvents ?? this.calendarSettings.enabled;
			this.calendarSettings.autoAddEvents = defaults.calendarAutoAddEvents
				?? this.calendarSettings.autoAddEvents;
		},
		setCalendarSettings(newSettings: CalendarSettingsState): void
		{
			this.calendarSettings = newSettings;
		},
		prepareCrmOptions(): CrmOptionsPayload
		{
			if (!this.crmSettings.enabled)
			{
				return { enabled: NO_VALUE };
			}

			const crmOptions: CrmOptionsPayload = { enabled: YES_VALUE, config: {} };

			if (this.crmSettings.sync.enabled)
			{
				crmOptions.config.crm_sync_days = parseInt(this.crmSettings.sync.periodValue, 10) || 0;
			}

			if (this.crmSettings.assignKnownClientEmails)
			{
				crmOptions.config.crm_public = this.crmSettings.assignKnownClientEmails ? YES_VALUE : NO_VALUE;
			}

			if (this.crmSettings.incoming.enabled)
			{
				crmOptions.config.crm_new_entity_in = this.crmSettings.incoming.createAction;
			}

			if (this.crmSettings.outgoing.enabled)
			{
				crmOptions.config.crm_new_entity_out = this.crmSettings.outgoing.createAction;
			}

			crmOptions.config.crm_lead_source = this.crmSettings.source;

			if (this.crmSettings.responsibleQueue.length > 0)
			{
				crmOptions.config.crm_lead_resp = this.crmSettings.responsibleQueue.map((item) => item.id);
			}

			if (this.crmSettings.leadCreationAddresses.length > 0)
			{
				crmOptions.config.crm_new_lead_for = this.crmSettings.leadCreationAddresses;
			}

			return crmOptions;
		},
		prepareDataForBackend(): BackendPayload
		{
			const crmOptions = this.prepareCrmOptions();
			const isPasswordlessModeEnabled = this.passwordlessMode && this.isPasswordlessConnectAvailable;

			const mailboxes = this.employees.map((employee) => {
				const smtpServer = this.connectionSettings.smtpSettings.server;
				const smtpPort = this.connectionSettings.smtpSettings.port;
				const isSmtpDataFilled = Boolean(smtpServer && smtpPort);
				const useSmtp = this.connectionSettings.smtpSettings.enabled && isSmtpDataFilled
					? YES_VALUE
					: NO_VALUE;

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

					iCalAccess: this.calendarSettings.enabled && this.calendarSettings.autoAddEvents
						? YES_VALUE
						: NO_VALUE,

					serviceConfig: SERVICE_CONFIG,
					syncAfterConnection: NO_VALUE,
					messageMaxAge: parseInt(this.mailSettings.sync.periodValue, 10),
				};

				if (!isPasswordlessModeEnabled)
				{
					mailboxData.password = employee.password;
					mailboxData.passwordSMTP = employee.password;
				}

				return { ...mailboxData, crmOptions: { ...crmOptions } };
			});

			return {
				mailboxes,
			};
		},
		preparePasswordlessPayload(): BackendPayload
		{
			return this.prepareDataForBackend();
		},
		enableErrorState(errorType: string = ''): void
		{
			this.errorState = {
				enabled: true,
				errorType,
			};
		},
		disableErrorState(): void
		{
			this.errorState = {
				enabled: false,
				errorType: '',
			};
		},
		togglePasswordlessMode(): void
		{
			if (!this.isPasswordlessConnectAvailable)
			{
				this.passwordlessMode = false;

				return;
			}

			this.passwordlessMode = !this.passwordlessMode;
		},
		toggleLoginColumn(): void
		{
			this.isLoginColumnShown = !this.isLoginColumnShown;

			if (!this.isLoginColumnShown)
			{
				this.employees = this.employees.map((employee) => {
					return {
						...employee,
						login: '',
					};
				});
			}
		},
		setAnalyticsSource(source: string): void
		{
			this.analyticsSource = source;
		},
		setSmtpStatus(isAvailable: boolean): void
		{
			this.connectionSettings.smtpSettings.enabled = isAvailable;
		},
		setFeatures(features: MassconnectFeatures): void
		{
			this.isPasswordlessConnectAvailable = features?.isPasswordlessConnectAvailable ?? false;

			if (!this.isPasswordlessConnectAvailable)
			{
				this.passwordlessMode = false;
			}
		},
		prepareDataForHistory(): MassConnectDataType
		{
			return {
				connectionSettings: this.connectionSettings,
				mailSettings: this.mailSettings,
				crmSettings: this.crmSettings,
				calendarSettings: this.calendarSettings,
				employees: this.employees.map((employee) => {
					return { ...employee, password: '' };
				}),
			};
		},
		setPermissions(permissions: MassconnectPermissions): void
		{
			this.permissions.allowedLevels = [permissions?.allowedLevels];
			this.permissions.canEditCrmIntegration = permissions?.canEditCrmIntegration;
		},
	},
});
