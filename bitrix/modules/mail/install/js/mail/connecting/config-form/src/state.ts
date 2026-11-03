import { Type } from 'main.core';
import { inject, reactive, type InjectionKey } from 'ui.vue3';
import { mapSettingsConfigToState } from 'mail.connecting.settings-config';
import type { MappedSettingsConfig, RawSettingsConfig } from 'mail.connecting.settings-config';

import type { MailboxData } from './api';
import type {
	AvatarChange,
	FormState,
	GeneralSettingsPatch,
	GeneralSettingsSnapshot,
	InitialData,
	MailboxAvatarData,
	MailboxAvatarSaveSnapshot,
	MailboxAvatarSelection,
	MailboxAvatarState,
	PermissionsState,
	ServiceState,
} from './types';

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
		canViewMailboxList: rawPermissions?.canViewMailboxList ?? false,
		isSmtpAvailable: rawPermissions?.isSmtpAvailable ?? false,
		isCrmAvailable: rawPermissions?.isCrmAvailable ?? mapped.crmAvailable,
		isCalendarAvailable: rawPermissions?.isCalendarAvailable ?? false,
		isAvatarAvailable: rawPermissions?.isAvatarAvailable ?? false,
		syncOldLimit: rawPermissions?.syncOldLimit ?? 90,
		sharedMailboxLimit,
		sharedMailboxLimitReached: rawPermissions?.sharedMailboxLimitReached ?? false,
		sharedMailboxesCount: rawPermissions?.sharedMailboxesCount ?? null,
	};
}

export function setSourceGeneration(state: FormState, data: Pick<MailboxData, 'sourceGenerationId'>): void
{
	const generationId = data.sourceGenerationId;
	const hasSourceGenerationId = Object.prototype.hasOwnProperty.call(data, 'sourceGenerationId')
		&& (Type.isNull(generationId) || (Type.isInteger(generationId) && generationId >= 0))
	;
	Object.assign(state, {
		hasSourceGenerationId,
		sourceGenerationId: hasSourceGenerationId ? generationId ?? null : null,
	});
}

export function getSourceGenerationPrecondition(state: FormState): { expectedSourceGenerationId?: number | null }
{
	return state.hasSourceGenerationId ? { expectedSourceGenerationId: state.sourceGenerationId } : {};
}

export function createMailboxAvatarState(mailboxId: number | null = null): MailboxAvatarState
{
	return {
		mailboxId,
		confirmed: null,
		intent: null,
		selection: null,
		loading: false,
		saving: false,
		needsRefresh: false,
		rejectedUploadId: null,
		preservedUploadId: null,
		error: '',
		imageErrorUrl: '',
		requestId: 0,
		resetKey: 0,
	};
}

export function beginMailboxAvatarRead(state: FormState): number
{
	const requestId = state.avatar.requestId + 1;
	if (state.avatar.mailboxId !== state.mailboxId)
	{
		Object.assign(state, { avatar: createMailboxAvatarState(state.mailboxId) });
	}

	Object.assign(state.avatar, { requestId, loading: true, error: '' });

	return requestId;
}

export function invalidateMailboxAvatarRead(state: FormState): void
{
	Object.assign(state.avatar, { requestId: state.avatar.requestId + 1, loading: false });
}

export function acceptMailboxAvatarRead(state: FormState, requestId: number, data: MailboxAvatarData): boolean
{
	if (state.avatar.requestId !== requestId || data.mailboxId !== state.mailboxId
		|| state.avatar.mailboxId !== state.mailboxId)
	{
		return false;
	}

	Object.assign(state.avatar, {
		confirmed: { ...data },
		loading: false,
		needsRefresh: false,
		error: '',
		imageErrorUrl: '',
	});

	return true;
}

export function rejectMailboxAvatarRead(state: FormState, requestId: number, message: string): void
{
	if (state.avatar.requestId === requestId && state.avatar.mailboxId === state.mailboxId)
	{
		Object.assign(state.avatar, { loading: false, error: message });
	}
}

export function canEditMailboxAvatar(state: FormState): boolean
{
	return state.mode === 'edit'
		&& !state.avatar.needsRefresh
		&& state.avatar.mailboxId === state.mailboxId
		&& state.avatar.confirmed?.supported === true
		&& state.avatar.confirmed.canEdit === true
	;
}

export function setMailboxAvatarSelection(state: FormState, selection: MailboxAvatarSelection): void
{
	const confirmed = state.avatar.confirmed;
	if (!confirmed || !canEditMailboxAvatar(state) || state.avatar.saving
		|| selection.id === state.avatar.rejectedUploadId
		|| (state.loading && (!state.avatar.selection || state.avatar.selection.id !== selection.id)))
	{
		return;
	}

	const expectedRevision = state.avatar.intent?.expectedRevision ?? confirmed.revision;
	Object.assign(state.avatar, {
		selection: { ...selection },
		rejectedUploadId: null,
		intent: {
			operation: 'replace',
			expectedRevision,
			uploadToken: selection.status === 'complete' ? selection.uploadToken : null,
		},
		imageErrorUrl: '',
	});
}

export function resetMailboxAvatarIntent(state: FormState): void
{
	Object.assign(state.avatar, {
		intent: null,
		selection: null,
		rejectedUploadId: null,
		imageErrorUrl: '',
		resetKey: state.avatar.resetKey + 1,
	});
}

export function deleteMailboxAvatar(state: FormState): void
{
	const confirmed = state.avatar.confirmed;
	if (!confirmed?.hasAvatar || !canEditMailboxAvatar(state)
		|| state.loading || state.avatar.loading || state.avatar.error)
	{
		return;
	}

	const expectedRevision = state.avatar.intent?.expectedRevision ?? confirmed.revision;
	resetMailboxAvatarIntent(state);
	Object.assign(state.avatar, { intent: { operation: 'delete', expectedRevision } });
}

export function isMailboxAvatarSaveBlocked(state: FormState): boolean
{
	// A save that carries no avatar change stays available whatever shape the avatar is in.
	if (!state.avatar.intent)
	{
		return false;
	}

	return !canEditMailboxAvatar(state)
		|| state.avatar.loading
		|| Boolean(state.avatar.error)
		|| (state.avatar.intent.operation === 'replace'
			&& (state.avatar.selection?.status !== 'complete' || !state.avatar.intent.uploadToken))
	;
}

export function createMailboxAvatarSaveSnapshot(state: FormState): MailboxAvatarSaveSnapshot | null
{
	const intent = state.avatar.intent;
	if (!intent || !state.mailboxId)
	{
		return null;
	}

	if (isMailboxAvatarSaveBlocked(state))
	{
		throw new Error('Mailbox avatar is not ready to save.');
	}

	const change: AvatarChange = intent.operation === 'delete'
		? { operation: 'delete', expectedRevision: intent.expectedRevision }
		: {
			operation: 'replace',
			expectedRevision: intent.expectedRevision,
			uploadToken: String(intent.uploadToken),
		}
	;

	return {
		mailboxId: state.mailboxId,
		requestId: state.avatar.requestId,
		resetKey: state.avatar.resetKey,
		selectionId: state.avatar.selection?.id ?? null,
		change,
	};
}

export function isMailboxAvatarSaveCurrent(state: FormState, snapshot: MailboxAvatarSaveSnapshot): boolean
{
	return state.mailboxId === snapshot.mailboxId
		&& state.avatar.mailboxId === snapshot.mailboxId
		&& state.avatar.requestId === snapshot.requestId
	;
}

function matchesMailboxAvatarIntent(state: FormState, snapshot: MailboxAvatarSaveSnapshot): boolean
{
	const intent = state.avatar.intent;
	const change = snapshot.change;

	return state.avatar.resetKey === snapshot.resetKey
		&& (state.avatar.selection?.id ?? null) === snapshot.selectionId
		&& intent?.operation === change.operation
		&& intent.expectedRevision === change.expectedRevision
		&& (change.operation === 'delete'
			|| (intent.operation === 'replace' && intent.uploadToken === change.uploadToken))
	;
}

export function acceptMailboxAvatarSave(
	state: FormState,
	snapshot: MailboxAvatarSaveSnapshot,
	data: MailboxAvatarData | undefined,
): boolean
{
	if (!isMailboxAvatarSaveCurrent(state, snapshot) || !data || data.mailboxId !== snapshot.mailboxId
		|| !Type.isInteger(data.revision) || data.revision <= snapshot.change.expectedRevision)
	{
		return false;
	}

	if (matchesMailboxAvatarIntent(state, snapshot))
	{
		resetMailboxAvatarIntent(state);
	}

	invalidateMailboxAvatarRead(state);
	Object.assign(state.avatar, { confirmed: { ...data }, needsRefresh: false, error: '', imageErrorUrl: '' });

	return true;
}

export function requireMailboxAvatarRefresh(state: FormState): void
{
	resetMailboxAvatarIntent(state);
	invalidateMailboxAvatarRead(state);
	Object.assign(state.avatar, { needsRefresh: true });
}

export function rejectMailboxAvatarUpload(
	state: FormState,
	snapshot: MailboxAvatarSaveSnapshot,
	message: string,
): void
{
	if (!isMailboxAvatarSaveCurrent(state, snapshot) || !matchesMailboxAvatarIntent(state, snapshot)
		|| snapshot.change.operation !== 'replace' || !state.avatar.selection)
	{
		return;
	}

	Object.assign(state.avatar, {
		rejectedUploadId: state.avatar.selection.id,
		intent: { ...snapshot.change, uploadToken: null },
		selection: { ...state.avatar.selection, status: 'error', uploadToken: null, previewUrl: '', error: message },
	});
}

export function getMailboxAvatarUrl(state: FormState): string
{
	if (state.avatar.mailboxId !== state.mailboxId || state.avatar.intent?.operation === 'delete')
	{
		return '';
	}

	const previewUrl = state.avatar.selection?.status === 'error' ? '' : state.avatar.selection?.previewUrl;
	const url = previewUrl || state.avatar.confirmed?.url || '';

	return url === state.avatar.imageErrorUrl ? '' : url;
}

export function createGeneralSettingsSnapshot(state: FormState): GeneralSettingsSnapshot
{
	const crm = state.crmSettings;

	return {
		mailboxName: state.mailbox.name,
		link: state.mailbox.link,
		senderName: state.mailbox.senderName,
		useSenderName: state.mailbox.useSenderName,
		iCalAccess: state.calendarSettings.enabled && state.calendarSettings.autoAddEvents,
		shareAccess: [...new Set(state.access.sharedWith)].sort(),
		crmOptions: {
			enabled: crm.enabled,
			config: {
				crm_sync_days: crm.sync.enabled ? Number.parseInt(crm.sync.periodValue, 10) || 0 : null,
				crm_new_entity_in: crm.incoming.enabled ? crm.incoming.createAction : '',
				crm_new_entity_out: crm.outgoing.enabled ? crm.outgoing.createAction : '',
				crm_lead_source: crm.source,
				crm_lead_resp: crm.responsibleQueue.map((item) => Number(item.id)),
				crm_new_lead_for: crm.leadCreationAddresses.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
				crm_public: crm.assignKnownClientEmails,
				crm_vcf: crm.vcf,
			},
		},
	};
}

export function setGeneralSettingsBaseline(
	state: FormState,
	snapshot: GeneralSettingsSnapshot = createGeneralSettingsSnapshot(state),
): void
{
	const generalSettingsBaseline: GeneralSettingsSnapshot = {
		...snapshot,
		shareAccess: [...snapshot.shareAccess],
		crmOptions: {
			...snapshot.crmOptions,
			config: {
				...snapshot.crmOptions.config,
				crm_lead_resp: [...snapshot.crmOptions.config.crm_lead_resp],
				crm_new_lead_for: [...snapshot.crmOptions.config.crm_new_lead_for],
			},
		},
	};
	Object.assign(state, { generalSettingsBaseline });
}

function getChangedFields<T extends object>(current: T, baseline: T): Partial<T>
{
	const patch: Partial<T> = {};
	for (const key of Object.keys(current) as Array<keyof T>)
	{
		const value = current[key];
		const previousValue = baseline[key];
		const unchanged = Type.isArray(value) && Type.isArray(previousValue)
			? value.length === previousValue.length && value.every((item, index) => item === previousValue[index])
			: value === previousValue
		;
		if (!unchanged)
		{
			patch[key] = value;
		}
	}

	return patch;
}

export function buildGeneralSettingsPatch(
	state: FormState,
	snapshot: GeneralSettingsSnapshot = createGeneralSettingsSnapshot(state),
): GeneralSettingsPatch
{
	const baseline = state.generalSettingsBaseline;
	if (!baseline)
	{
		throw new Error('Saved mailbox settings are required to build a patch.');
	}

	const { crmOptions, ...generalSettings } = snapshot;
	const { crmOptions: savedCrmOptions, ...savedGeneralSettings } = baseline;
	const patch: GeneralSettingsPatch = getChangedFields(generalSettings, savedGeneralSettings);
	if (!state.permissions.canEditAccess)
	{
		delete patch.shareAccess;
	}

	if (!state.permissions.isCalendarAvailable)
	{
		delete patch.iCalAccess;
	}

	if (state.permissions.canEditCrm && state.permissions.isCrmAvailable)
	{
		const config = getChangedFields(crmOptions.config, savedCrmOptions.config);
		if (crmOptions.enabled !== savedCrmOptions.enabled)
		{
			patch.crmOptions = { enabled: crmOptions.enabled };
		}

		if (Object.keys(config).length > 0)
		{
			patch.crmOptions = { ...patch.crmOptions, config };
		}
	}

	return patch;
}

export function acceptGeneralSettingsPatch(state: FormState, patch: GeneralSettingsPatch): void
{
	const baseline = state.generalSettingsBaseline;
	if (!baseline)
	{
		throw new Error('Saved mailbox settings are required to accept a patch.');
	}

	setGeneralSettingsBaseline(state, {
		...baseline,
		...patch,
		crmOptions: {
			...baseline.crmOptions,
			...patch.crmOptions,
			config: { ...baseline.crmOptions.config, ...patch.crmOptions?.config },
		},
	});
}

function createConnectionState(service: ServiceState | null): FormState['connection']
{
	return {
		email: '',
		server: service?.server ?? '',
		port: service?.port !== undefined && service?.port !== null ? Number(service.port) || null : null,
		ssl: service?.encryption !== 'N',
		login: '',
		password: '',
		isOAuth: Boolean(service?.oauth),
		oauthUid: null,
		oauthUser: null,
		userPrincipalName: null,
		oauthEmailNeedsConfirmation: false,
		oauthEmailCheckStatus: 'idle',
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
		providerRestriction: null,

		settingsConfig: rawConfig,
		settingsOptions: {
			mailSync: mapped.mailSyncOptions,
			crmSync: mapped.crmSyncOptions,
			crmEntity: mapped.crmEntityOptions,
			crmSource: mapped.crmSourceOptions,
		},

		connection: createConnectionState(service),

		smtp: {
			enabled: true,
			server: service?.smtp?.server ?? '',
			port: service?.smtp?.port !== undefined && service?.smtp?.port !== null
				? Number(service.smtp.port) || null
				: null,
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

		avatar: createMailboxAvatarState(initialData.mailboxId ?? null),

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
		migrationActive: false,
		sourceGenerationId: null,
		hasSourceGenerationId: false,
		generalSettingsBaseline: null,

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
