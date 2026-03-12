import { defineStore } from 'ui.vue3.pinia';
import { MailSyncPeriod } from '../utils/options/mail-integration-options/enum/period';
import { CrmSyncPeriod } from '../utils/options/crm-integration-options/enum/period';
import { CrmCreateAction } from '../utils/options/crm-integration-options/enum/create-action';
import { CrmSource } from '../utils/options/crm-integration-options/enum/source';
import type {
	BackendPayload,
	CrmOptionsPayload,
	CrmSettingsState,
	CalendarSettingsState,
	MassConnectDataType,
	MassconnectPermissions,
	Employee,
	MailSettingsState,
} from './type';
import { YES_VALUE, NO_VALUE, SERVICE_CONFIG } from './const';

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
		mailSettings: {
			sync: {
				enabled: true,
				periodValue: MailSyncPeriod.WEEK,
			},
		},
		crmSettings: {
			enabled: false,
			sync: {
				enabled: true,
				periodValue: CrmSyncPeriod.WEEK,
			},
			assignKnownClientEmails: true,
			incoming: {
				enabled: true,
				createAction: CrmCreateAction.LEAD,
			},
			outgoing: {
				enabled: true,
				createAction: CrmCreateAction.CONTACT,
			},
			source: CrmSource.EMAIL,
			leadCreationAddresses: '',
			responsibleQueue: [],
		},
		calendarSettings: {
			enabled: true,
			autoAddEvents: true,
		},
		errorState: {
			enabled: false,
			errorCnt: 0,
		},
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
					password: employee.password,
					loginSmtp: employee.login || employee.email,
					passwordSMTP: employee.password,
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

				return { ...mailboxData, crmOptions: { ...crmOptions } };
			});

			return {
				mailboxes,
			};
		},
		enableErrorState(errorCnt: number): void
		{
			this.errorState = {
				enabled: true,
				errorCnt,
			};
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
