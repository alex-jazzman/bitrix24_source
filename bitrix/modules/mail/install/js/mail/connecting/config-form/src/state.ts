import { inject, reactive, type InjectionKey } from 'ui.vue3';
import { mapSettingsConfigToState } from 'mail.connecting.settings-config';
import type { MappedSettingsConfig, RawSettingsConfig } from 'mail.connecting.settings-config';

import type { FormState, InitialData, PermissionsState, ServiceState } from './types';

export const formStateKey: InjectionKey<FormState> = Symbol('mailbox-config-form-state');

export function useFormState(): FormState
{
	const state = inject(formStateKey, null);
	if (state === null)
	{
		throw new Error('Mailbox config form state was not provided.');
	}

	return state;
}

function normalizeService(service: ServiceState | null | undefined): ServiceState | null
{
	if (!service)
	{
		return null;
	}

	return {
		...service,
		smtp: service.smtp
			? {
				server: String(service.smtp.server ?? ''),
				port: service.smtp.port ?? '',
				login: Boolean(service.smtp.login),
				password: Boolean(service.smtp.password),
			}
			: undefined,
	};
}

function createPermissions(initialData: InitialData, mapped: MappedSettingsConfig): PermissionsState
{
	const rawPermissions = initialData.permissions;
	const sharedMailboxLimit = rawPermissions?.sharedMailboxLimit ?? null;

	return {
		canEditCrm: rawPermissions?.canEditCrm ?? false,
		canEditAccess: rawPermissions?.canEditAccess ?? false,
		canChangeOwner: rawPermissions?.canChangeOwner ?? false,
		isSmtpAvailable: rawPermissions?.isSmtpAvailable ?? false,
		isCrmAvailable: rawPermissions?.isCrmAvailable ?? mapped.crmAvailable,
		isCalendarAvailable: rawPermissions?.isCalendarAvailable ?? false,
		syncOldLimit: rawPermissions?.syncOldLimit ?? 90,
		sharedMailboxLimit,
		sharedMailboxLimitReached: rawPermissions?.sharedMailboxLimitReached ?? false,
		sharedMailboxesCount: rawPermissions?.sharedMailboxesCount ?? null,
	};
}

export function createFormState(initialData: InitialData = {}): FormState
{
	const rawConfig: RawSettingsConfig = initialData.settingsConfig ?? {};
	const mapped: MappedSettingsConfig = mapSettingsConfigToState(rawConfig);
	const service = normalizeService(initialData.service);

	const connectionRequest = initialData.connectionRequest ?? null;
	const connectionRequestId = initialData.connectionRequestId
		?? (connectionRequest ? Number(connectionRequest.requestId) || null : null);
	const requesterId = connectionRequest ? Number(connectionRequest.requesterId) || null : null;

	return reactive<FormState>({
		mode: initialData.mode ?? 'create',
		mailboxId: initialData.mailboxId ?? null,
		connectionRequestId,
		lastMailCheck: null,

		settingsConfig: rawConfig,
		settingsOptions: {
			mailSync: mapped.mailSyncOptions,
			crmSync: mapped.crmSyncOptions,
			crmEntity: mapped.crmEntityOptions,
			crmSource: mapped.crmSourceOptions,
		},

		connection: {
			email: '',
			server: service?.server ?? '',
			port: service?.port !== undefined && service?.port !== null ? Number(service.port) || null : null,
			ssl: service?.encryption !== 'N',
			login: '',
			password: '',
			isOAuth: Boolean(service?.oauth),
			oauthUid: null,
			oauthUser: null,
			userPrincipalName: '',
			oauthEmailNeedsConfirmation: false,
			oauthEmailCheckStatus: 'idle',
		},

		smtp: {
			enabled: true,
			server: service?.smtp?.server ?? '',
			port: service?.smtp?.port !== undefined && service?.smtp?.port !== null
				? Number(service.smtp.port) || 587
				: 587,
			ssl: true,
			login: '',
			password: '',
			useLimit: false,
			limit: 250,
			uploadOutgoing: Boolean(service?.upload_outgoing),
		},

		mailbox: {
			name: '',
			link: service?.link ?? '',
			senderName: '',
			useSenderName: false,
			messageMaxAge: Number(mapped.messageMaxAge) || 7,
		},

		crmSettings: {
			enabled: mapped.crmEnabled,
			sync: {
				enabled: mapped.crmSyncEnabled,
				periodValue: mapped.crmSyncPeriod,
			},
			assignKnownClientEmails: mapped.crmAssignKnownClientEmails,
			vcf: mapped.crmVcf,
			incoming: {
				enabled: mapped.crmIncomingCreate,
				createAction: mapped.crmIncomingEntity,
			},
			outgoing: {
				enabled: mapped.crmOutgoingCreate,
				createAction: mapped.crmOutgoingEntity,
			},
			source: mapped.crmSource,
			leadCreationAddresses: '',
			responsibleQueue: [],
		},

		calendarSettings: {
			enabled: false,
			autoAddEvents: mapped.calendarAutoAddEvents,
		},

		access: {
			sharedWith: requesterId ? [`U${requesterId}`] : [],
			ownerId: requesterId,
		},

		service,

		paths: {
			messageList: initialData.paths?.messageList ?? '',
			home: initialData.paths?.home ?? '',
			configDirs: initialData.paths?.configDirs ?? '/mail/config/dirs',
		},

		changedDirs: false,

		permissions: createPermissions(initialData, mapped),

		loading: false,
		isDataReady: initialData.mode !== 'edit',
		errors: {
			generalItems: [],
		},
		fieldSyncFlags: {
			loginManual: false,
			nameManual: false,
			smtpLoginManual: false,
			smtpPasswordManual: false,
		},
	});
}
