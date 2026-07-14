/* eslint-disable */
type MailboxConfigFormOptions = {
	containerId?: string;
	initialData?: InitialData;
};

type InitialData = {
	mode?: Mode;
	mailboxId?: number | null;
	connectionRequestId?: number | null;
	connectionRequest?: ConnectionRequestPayload | null;
	service?: ServiceState | null;
	settingsConfig?: RawSettingsConfig | null;
	paths?: Partial<InitialDataPaths>;
	permissions?: Partial<PermissionsInput>;
};

type Mode = 'create' | 'edit';

type ConnectionRequestPayload = {
	requestId: number;
	requesterId: number;
};

type ServiceState = {
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

type InitialDataPaths = {
	messageList: string;
	home: string;
	configDirs: string;
};

type PermissionsInput = {
	canEditCrm: boolean;
	canEditAccess: boolean;
	canChangeOwner: boolean;
	isSmtpAvailable: boolean;
	isCrmAvailable: boolean;
	isCalendarAvailable: boolean;
	syncOldLimit: number;
	sharedMailboxLimit: number | null;
	sharedMailboxLimitReached?: boolean;
	sharedMailboxesCount?: number | null;
};

type ServiceEncryption = 'Y' | 'N' | 'S';

type ServiceSmtpSettings = {
	server: string;
	port: string | number;
	login: boolean;
	password: boolean;
};

declare namespace BX.Mail.Connecting.ConfigForm {
	class MailboxConfigForm {
		containerId: string;
		initialData: InitialData;
		constructor(options?: MailboxConfigFormOptions);
		start(): void;
		destroy(): void;
	}
}
