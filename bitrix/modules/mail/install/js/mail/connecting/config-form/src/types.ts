import type { NormalizedOption, RawSettingsConfig } from 'mail.connecting.settings-config';

export type Mode = 'create' | 'edit';

export type GeneralErrorItem = {
	message: string;
	customData: unknown | null;
	expanded: boolean;
	// Address reported as already connected on the portal; empty for every other error.
	occupiedEmail: string;
};

export type FormErrors = {
	email?: string;
	password?: string;
	login?: string;
	server?: string;
	port?: string;
	link?: string;
	smtpServer?: string;
	smtpPort?: string;
	smtpPassword?: string;
	smtpLimit?: string;
	generalItems: GeneralErrorItem[];
};

export type ValidationErrors = Omit<FormErrors, 'generalItems'>;

export type OauthUser = {
	email: string;
	firstName: string;
	lastName: string;
	fullName: string;
	picture: string;
};

export type InitialOauthUser = {
	email?: string;
	first_name?: string;
	last_name?: string;
	full_name?: string;
	image?: string;
	userPrincipalName?: string;
	emailIsIntended?: boolean;
};

export type OauthEmailCheckStatus = 'idle' | 'checking' | 'success' | 'error';

export type LastMailCheck = {
	date: number | null;
	isSuccess: boolean;
};

export type SettingsOptions = {
	mailSync: NormalizedOption[];
	crmSync: NormalizedOption[];
	crmEntity: NormalizedOption[];
	crmSource: NormalizedOption[];
};

export type FieldSyncFlags = {
	loginManual: boolean;
	nameManual: boolean;
	smtpLoginManual: boolean;
	smtpPasswordManual: boolean;
};

export type ConnectionState = {
	email: string;
	server: string;
	port: number | null;
	ssl: boolean;
	login: string;
	password: string;
	isOAuth: boolean;
	oauthUid: string | null;
	oauthUser: OauthUser | null;
	// Null while the profile of the OAuth account is unresolved: the form knows no value and must
	// not state one. A string, empty included, is what the provider or the user said.
	userPrincipalName: string | null;
	oauthEmailNeedsConfirmation: boolean;
	oauthEmailCheckStatus: OauthEmailCheckStatus;
};

export type SmtpState = {
	enabled: boolean;
	server: string;
	port: number | null;
	ssl: boolean;
	login: string;
	password: string;
	useLimit: boolean;
	limit: number | null;
	uploadOutgoing: boolean;
};

export type MailboxState = {
	name: string;
	link: string;
	senderName: string;
	useSenderName: boolean;
	messageMaxAge: number;
};

export type ResponsibleQueueItem = {
	id: string | number;
	entityId: string;
	name: string;
};

export type CrmSettingsState = {
	enabled: boolean;
	sync: {
		enabled: boolean;
		periodValue: string;
	};
	assignKnownClientEmails: boolean;
	vcf: boolean;
	incoming: {
		enabled: boolean;
		createAction: string;
	};
	outgoing: {
		enabled: boolean;
		createAction: string;
	};
	source: string;
	leadCreationAddresses: string;
	responsibleQueue: ResponsibleQueueItem[];
};

export type CalendarSettingsState = {
	enabled: boolean;
	autoAddEvents: boolean;
};

export type AccessState = {
	sharedWith: string[];
	ownerId: number | null;
};

export type ServiceSmtpSettings = {
	server: string;
	port: string | number;
	login: boolean;
	password: boolean;
};

export type ServiceEncryption = 'Y' | 'N' | 'S';

export type ServiceState = {
	id?: number | null;
	name?: string | null;
	type?: string | null;
	link?: string | null;
	icon?: string | null;
	server?: string | null;
	port?: string | number | null;
	encryption?: ServiceEncryption | null;
	upload_outgoing?: boolean | number | null;
	oauth?: boolean;
	oauth_smtp_enabled?: boolean;
	smtp?: ServiceSmtpSettings;
};

export type InitialDataPaths = {
	messageList: string;
	home: string;
	configDirs: string;
};

export type PermissionsInput = {
	canEditCrm: boolean;
	canEditAccess: boolean;
	canChangeOwner: boolean;
	canViewMailboxList: boolean;
	isSmtpAvailable: boolean;
	isCrmAvailable: boolean;
	isCalendarAvailable: boolean;
	syncOldLimit: number;
	sharedMailboxLimit: number | null;
	sharedMailboxLimitReached?: boolean;
	sharedMailboxesCount?: number | null;
};

export type PermissionsState = Omit<PermissionsInput, 'sharedMailboxLimitReached' | 'sharedMailboxesCount'> & {
	sharedMailboxLimitReached: boolean;
	sharedMailboxesCount: number | null;
};

export type ConnectionRequestPayload = {
	requestId: number;
	requesterId: number;
};

export type InitialData = {
	mode?: Mode;
	mailboxId?: number | null;
	connectionRequestId?: number | null;
	connectionRequest?: ConnectionRequestPayload | null;
	service?: ServiceState | null;
	settingsConfig?: RawSettingsConfig | null;
	paths?: Partial<InitialDataPaths>;
	permissions?: Partial<PermissionsInput>;
};

export type FormState = {
	mode: Mode;
	mailboxId: number | null;
	connectionRequestId: number | null;
	lastMailCheck: LastMailCheck | null;
	providerRestriction: string | null;
	settingsConfig: RawSettingsConfig;
	settingsOptions: SettingsOptions;
	connection: ConnectionState;
	smtp: SmtpState;
	mailbox: MailboxState;
	crmSettings: CrmSettingsState;
	calendarSettings: CalendarSettingsState;
	access: AccessState;
	service: ServiceState | null;
	paths: InitialDataPaths;
	changedDirs: boolean;
	migrationActive: boolean;
	permissions: PermissionsState;
	loading: boolean;
	isDataReady: boolean;
	errors: FormErrors;
	fieldSyncFlags: FieldSyncFlags;
};

export type MailSyncModel = {
	sync: {
		enabled: boolean;
		periodValue: string;
	};
};

export type MailboxConfigFormOptions = {
	containerId?: string;
	initialData?: InitialData;
};

export type OauthCompletionUser = InitialOauthUser;
