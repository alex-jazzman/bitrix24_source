import { ajax } from 'main.core';

import type { InitialOauthUser } from './types';

const CONTROLLER = 'mail.api.mailboxconnecting';

export type YesNoFlag = 'Y' | 'N';

export type AjaxError = {
	code?: string | number;
	message: string;
	customData?: unknown;
};

export type AjaxResponse<T> = {
	data: T;
	errors: AjaxError[];
	status: 'success' | 'error';
};

type RequestData = Record<string, unknown>;

type OauthUrlType = 'web' | 'mobile';

export type ServiceDescriptor = {
	id: number;
	name: string;
	type: string;
	oauthMode: boolean;
	[extra: string]: unknown;
};

export type MailboxCrmOptionsResponse = {
	enabled: YesNoFlag | boolean;
	config?: {
		crm_sync_days?: number | null;
		crm_new_entity_in?: string;
		crm_new_entity_out?: string;
		crm_lead_source?: string;
		crm_lead_resp?: number[];
		crm_lead_resp_users?: Array<{
			id: number;
			title: string;
			imageUrl: string | null;
		}>;
		crm_new_lead_for?: string;
		crm_public?: YesNoFlag;
		crm_vcf?: YesNoFlag;
	};
	syncDays?: number | null;
	public?: YesNoFlag | boolean;
	newEntityIn?: string;
	newEntityOut?: string;
	leadSource?: string;
	leadResp?: number[];
	newLeadFor?: string[] | string;
};

export type ImapData = {
	email: string;
	login: string;
	serviceId: number;
	server: string;
	port: string;
	ssl: YesNoFlag;
	isOAuth: boolean;
	oauthUid: string | null;
};

export type SmtpData = {
	enabled: YesNoFlag;
	server: string;
	port: string;
	ssl: YesNoFlag;
	login: string;
	useLimit: boolean;
	limit: number | null;
};

export type MailboxServiceData = {
	name: string | null;
	type: string | null;
	link: string | null;
	isOAuth?: boolean;
	oauthSmtpEnabled?: boolean;
	smtpServer?: string;
	smtpLoginAsImap?: boolean;
	smtpPasswordAsImap?: boolean;
};

export type MailboxData = {
	imap: ImapData;
	smtp: SmtpData;
	service: MailboxServiceData;
	mailbox?: {
		link: string;
	};
	denyUpload?: boolean;
	mailboxName: string;
	senderName: string;
	defaultSenderName?: string;
	useSenderName: boolean;
	iCalAccess: YesNoFlag;
	crmOptions: MailboxCrmOptionsResponse;
	shareAccess: string[];
	shareAccessUsers?: Array<{
		id: number;
		title: string;
		imageUrl: string | null;
	}>;
	userId: number;
	periodCheck: number;
	lastMailCheck: {
		date: number | null;
		isSuccess: boolean;
	};
	providerRestriction?: string | null;
	migrationActive?: boolean;
};

export type CrmOptionsPayload = {
	enabled: YesNoFlag;
	config?: {
		crm_sync_days?: number;
		crm_public?: YesNoFlag;
		crm_vcf?: YesNoFlag;
		crm_new_entity_in?: string;
		crm_new_entity_out?: string;
		crm_lead_source?: string;
		crm_lead_resp?: number[];
		crm_new_lead_for?: string;
	};
};

export type ServiceConfigPayload = {
	serviceType: string;
	name: string;
};

export type BaseMailboxPayload = {
	email: string;
	// Absent means the form states nothing about it and the stored value keeps applying. An empty
	// string is a statement: this mailbox has no user principal name.
	userPrincipalName?: string;
	login: string;
	server: string;
	port: string;
	ssl: boolean;
	serviceId: number | null;
	storageOauthUid: string;
	useSmtp: boolean;
	serverSmtp: string;
	portSmtp: string;
	sslSmtp: boolean;
	loginSmtp: string;
	useLimitSmtp: boolean;
	limitSmtp: number | null;
	mailboxName: string;
	senderName: string;
	useSenderName: boolean;
	iCalAccess: boolean;
	crmOptions: CrmOptionsPayload;
	uploadOutgoing: boolean;
	link: string;
	shareAccess: string[];
};

export type CreateMailboxPayload = BaseMailboxPayload & {
	password: string;
	passwordSMTP: string;
	syncAfterConnection: boolean;
	messageMaxAge: number;
	serviceConfig: ServiceConfigPayload;
};

type ConnectionPayloadKey =
	| 'email'
	| 'userPrincipalName'
	| 'login'
	| 'server'
	| 'port'
	| 'ssl'
	| 'serviceId'
	| 'storageOauthUid'
	| 'useSmtp'
	| 'serverSmtp'
	| 'portSmtp'
	| 'sslSmtp'
	| 'loginSmtp';

export type UpdateMailboxPayload = Omit<BaseMailboxPayload, ConnectionPayloadKey>
	& Partial<Pick<BaseMailboxPayload, ConnectionPayloadKey>>
	& {
	password?: string;
	passwordSMTP?: string;
	userIdToConnect?: number;
};

export type ConnectMailboxResult = {
	id: number;
	senderName?: string | null;
	email?: string | null;
	[extra: string]: unknown;
};

export type ConnectByConnectionRequestResult = ConnectMailboxResult & {
	connectionRequestCompleted: boolean;
	pendingCount: number | null;
};

function runAction<T>(action: string, data: RequestData = {}): Promise<AjaxResponse<T>>
{
	return ajax.runAction(`${CONTROLLER}.${action}`, { data }) as Promise<AjaxResponse<T>>;
}

export const Api = {
	getServices(): Promise<AjaxResponse<ServiceDescriptor[]>>
	{
		return runAction<ServiceDescriptor[]>('getServices');
	},

	getMailbox(mailboxId: number): Promise<AjaxResponse<MailboxData>>
	{
		return runAction<MailboxData>('getMailbox', { mailboxId });
	},

	// Goes to the OAuth provider, so it is a request of its own: the payload of the settings screen
	// must not wait for it.
	getOauthUser(mailboxId: number): Promise<AjaxResponse<InitialOauthUser | null>>
	{
		return runAction<InitialOauthUser | null>('getOauthUser', { mailboxId });
	},

	getOauthUrl(serviceName: string, type: OauthUrlType = 'web'): Promise<AjaxResponse<string>>
	{
		return runAction<string>('getUrlOauth', { serviceName, type });
	},

	connectMailbox(data: CreateMailboxPayload): Promise<AjaxResponse<ConnectMailboxResult>>
	{
		return runAction<ConnectMailboxResult>('connectMailbox', data);
	},

	connectMailboxByConnectionRequest(
		connectionRequestId: number,
		data: CreateMailboxPayload,
	): Promise<AjaxResponse<ConnectByConnectionRequestResult>>
	{
		return runAction<ConnectByConnectionRequestResult>(
			'connectMailboxByConnectionRequest',
			{ connectionRequestId, ...data },
		);
	},

	updateMailbox(mailboxId: number, data: UpdateMailboxPayload): Promise<AjaxResponse<ConnectMailboxResult>>
	{
		return runAction<ConnectMailboxResult>('updateMailbox', { mailboxId, ...data });
	},

	deleteMailbox(mailboxId: number): Promise<AjaxResponse<Record<string, unknown>>>
	{
		return runAction<Record<string, unknown>>('deleteMailbox', { mailboxId });
	},

	checkEmailAvailability(
		params: { serviceId: number; email: string; oauthUid: string },
	): Promise<AjaxResponse<boolean>>
	{
		return runAction<boolean>('checkEmailAvailability', params);
	},

	syncMailbox(id: number): Promise<AjaxResponse<Record<string, unknown>>>
	{
		return runAction<Record<string, unknown>>('syncMailbox', { id });
	},
};
