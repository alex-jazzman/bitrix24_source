import { YES_VALUE, NO_VALUE } from './const';

export type BaseUser = {
	id: number,
	entityId: string,
	name: string,
	avatar: string,
};

export type Employee = {
	...BaseUser,
	email: string,
	login: string,
	password: string,
};

export type DepartmentEmployee = {
	id: number,
	name: string,
	avatar: string,
};

export type ResponsibleQueueItem = BaseUser;

export type ConnectionSettings = {
	imapServer: ?string,
	imapPort: ?number,
	imapSsl: boolean,
	smtpServer: ?string,
	smtpPort: ?number,
	smtpSsl: boolean,
}

export type MailSettingsState = {
	sync: {
		enabled: boolean,
		periodValue: string,
	},
};

export type CrmSettingsState = {
	enabled: boolean,
	sync: {
		enabled: boolean,
		periodValue: string,
	},
	incoming: {
		enabled: boolean,
		createAction: string,
	},
	outgoing: {
		enabled: boolean,
		createAction: string,
	},
	assignKnownClientEmails: boolean,
	assignUnknownClientEmails: boolean,
	source: string,
	responsibleQueue: ResponsibleQueueItem[],
	leadCreationAddresses: string,
};

export type CalendarSettingsState = {
	enabled: boolean,
	autoAddEvents: boolean,
};

export type CrmOptionsPayload = {
	enabled: boolean,
	config: {
		crm_sync_days?: number,
		crm_public?: boolean,
		crm_new_entity_in?: string,
		crm_new_entity_out?: string,
		crm_lead_source?: string,
		crm_lead_resp?: Array<number>,
		crm_new_lead_for?: string,
	}
};

export type MailboxPayload = {
	userIdToConnect: number,
	email: string,
	login: string,
	password: string,
	loginSmtp: string,
	passwordSMTP: string,
	mailboxName: string,
	senderName: string,
	server: string,
	port: string,
	ssl: YES_VALUE | NO_VALUE,
	useSmtp: YES_VALUE | NO_VALUE,
	serverSmtp: string,
	portSmtp: string,
	sslSmtp: YES_VALUE | NO_VALUE,
	iCalAccess: YES_VALUE | NO_VALUE,
	serviceId: number,
	syncAfterConnection: YES_VALUE | NO_VALUE,
	messageMaxAge: number,
	crmOptions: CrmOptionsPayload,
};

export type BackendPayload = {
	mailboxes: MailboxPayload[],
};

export type MassConnectDataType = {
	connectionSettings: ConnectionSettings,
	mailSettings: MailSettingsState,
	crmSettings: CrmSettingsState,
	calendarSettings: CalendarSettingsState,
	employees: Employee[],
};

export type MassconnectPermissions = {
	allowedLevels: ?number,
	canEditCrmIntegration: ?boolean,
};
