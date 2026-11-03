import { Type } from 'main.core';
import { reactive } from 'ui.vue3';

import {
	type AttachmentsHostViewModel,
	type BootstrapViewModel,
	type CurrentMessageViewModel,
	type ExistingDomContractViewModel,
	type ExternalHostsViewModel,
	type MailAddressViewModel,
	type MessageViewState,
	type RecipientListViewModel,
	type ScreenViewModel,
	type SenderAvatarData,
	type SenderAvatarSaveSnapshot,
	type SenderAvatarSelection,
	type SenderAvatarState,
	type ThreadBootstrapViewModel,
} from './types';

export function createMessageViewState(bootstrap: Readonly<BootstrapViewModel>): MessageViewState
{
	return reactive(createMessageViewStateData(bootstrap)) as MessageViewState;
}

export function createMessageViewStateData(bootstrap: Readonly<BootstrapViewModel>): MessageViewState
{
	const currentMessage = cloneCurrentMessage(bootstrap.currentMessage);

	return {
		screen: cloneScreen(bootstrap.screen),
		currentMessage,
		thread: cloneThread(bootstrap.thread),
		capabilities: { ...bootstrap.capabilities },
		hosts: cloneHosts(bootstrap.hosts),
		domContracts: cloneDomContracts(bootstrap.domContracts),
		senderAvatar: createSenderAvatarState(
			currentMessage.id,
			currentMessage.sender.avatar.management ?? null,
		),
		body: {
			status: bootstrap.hosts.messageBody.useAjax ? 'loading' : 'ready',
			error: null,
		},
		attachments: {
			status: getInitialAttachmentStatus(bootstrap.hosts.attachments),
			error: null,
		},
	};
}

function cloneScreen(screen: ScreenViewModel): MessageViewState['screen']
{
	return {
		...screen,
		paths: { ...screen.paths },
		analytics: screen.analytics ? { ...screen.analytics } : null,
	};
}

function cloneCurrentMessage(message: CurrentMessageViewModel): MessageViewState['currentMessage']
{
	return {
		...message,
		sender: cloneAddress(message.sender),
		recipients: cloneRecipients(message.recipients),
		labels: { ...message.labels },
		date: { ...message.date },
		flags: { ...message.flags },
		mailbox: message.mailbox ? { ...message.mailbox } : null,
	};
}

function cloneAddress(address: MailAddressViewModel): MessageViewState['currentMessage']['sender']
{
	return {
		...address,
		avatar: {
			...address.avatar,
			management: address.avatar.management
				? normalizeSenderAvatarData(address.avatar.management)
				: address.avatar.management,
		},
	};
}

function cloneRecipients(recipients: RecipientListViewModel): MessageViewState['currentMessage']['recipients']
{
	return {
		to: recipients.to.map((address) => cloneAddress(address)),
		cc: recipients.cc.map((address) => cloneAddress(address)),
		bcc: recipients.bcc.map((address) => cloneAddress(address)),
		replyTo: recipients.replyTo.map((address) => cloneAddress(address)),
	};
}

function cloneThread(thread: ThreadBootstrapViewModel): MessageViewState['thread']
{
	return {
		...thread,
		before: { ...thread.before },
		after: { ...thread.after },
	};
}

function cloneHosts(hosts: ExternalHostsViewModel): MessageViewState['hosts']
{
	return {
		messageBody: { ...hosts.messageBody },
		attachments: { ...hosts.attachments },
		actions: { ...hosts.actions },
		labels: { ...hosts.labels },
		compose: { ...hosts.compose },
		pageSwapper: { ...hosts.pageSwapper },
		iCal: { ...hosts.iCal },
	};
}

function cloneDomContracts(domContracts: ExistingDomContractViewModel): MessageViewState['domContracts']
{
	return {
		messageUidKey: domContracts.messageUidKey,
		ids: { ...domContracts.ids },
		testIds: { ...domContracts.testIds },
	};
}

function getInitialAttachmentStatus(host: AttachmentsHostViewModel): MessageViewState['attachments']['status']
{
	if (!host.enabled)
	{
		return 'idle';
	}

	return host.hasDeferredContent ? 'loading' : 'ready';
}

export function createSenderAvatarState(
	messageId: number,
	confirmed: Readonly<SenderAvatarData> | null = null,
): SenderAvatarState
{
	const normalizedMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
	const normalizedConfirmed = confirmed ? normalizeSenderAvatarData(confirmed) : null;

	return {
		messageId: normalizedMessageId,
		confirmed: normalizedConfirmed?.messageId === normalizedMessageId ? normalizedConfirmed : null,
		intent: null,
		selection: null,
		status: 'idle',
		failure: null,
		error: '',
		requestId: 0,
	};
}

export function resetSenderAvatarForMessage(
	state: SenderAvatarState,
	messageId: number,
	confirmed: Readonly<SenderAvatarData> | null = null,
): void
{
	const normalizedMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
	const normalizedConfirmed = confirmed ? normalizeSenderAvatarData(confirmed) : null;
	Object.assign(state, {
		messageId: normalizedMessageId,
		confirmed: normalizedConfirmed?.messageId === normalizedMessageId ? normalizedConfirmed : null,
		intent: null,
		selection: null,
		status: 'idle',
		failure: null,
		error: '',
		requestId: state.requestId + 1,
	});
}

export function beginSenderAvatarRead(state: SenderAvatarState, refresh = false): number
{
	const requestId = state.requestId + 1;
	Object.assign(state, {
		requestId,
		status: refresh ? 'refreshing' : 'loading',
		failure: null,
		error: '',
	});

	return requestId;
}

export function acceptSenderAvatarRead(
	state: SenderAvatarState,
	requestId: number,
	data: Readonly<SenderAvatarData>,
): boolean
{
	if (state.requestId !== requestId || data.messageId !== state.messageId
		|| (state.confirmed && data.revision < state.confirmed.revision))
	{
		return false;
	}

	Object.assign(state, {
		confirmed: cloneSenderAvatarData(data),
		status: state.intent ? 'editing' : 'idle',
		failure: null,
		error: '',
	});

	return true;
}

export function rejectSenderAvatarRead(
	state: SenderAvatarState,
	requestId: number,
	message: string,
	failure: SenderAvatarState['failure'] = null,
): boolean
{
	if (state.requestId !== requestId)
	{
		return false;
	}

	Object.assign(state, { status: 'failed', failure, error: message });

	return true;
}

export function openSenderAvatarEditor(state: SenderAvatarState): boolean
{
	if (!state.confirmed?.canManage || !state.confirmed.uploader
		|| state.confirmed.messageId !== state.messageId
		|| state.status === 'loading' || state.status === 'saving' || state.status === 'refreshing')
	{
		return false;
	}

	Object.assign(state, { status: 'editing', failure: null, error: '' });

	return true;
}

export function setSenderAvatarSelection(state: SenderAvatarState, selection: SenderAvatarSelection): boolean
{
	const confirmed = state.confirmed;
	if (!confirmed?.canManage || state.status !== 'editing')
	{
		return false;
	}

	const expectedRevision = state.intent?.expectedRevision ?? confirmed.revision;
	Object.assign(state, {
		selection: { ...selection },
		intent: {
			operation: 'replace',
			expectedRevision,
			uploadToken: selection.status === 'complete' ? selection.uploadToken : null,
		},
		failure: null,
		error: '',
	});

	return true;
}

export function deleteSenderAvatar(state: SenderAvatarState): boolean
{
	const confirmed = state.confirmed;
	if (!confirmed?.canManage || !confirmed.hasAvatar || state.status !== 'editing')
	{
		return false;
	}

	Object.assign(state, {
		selection: null,
		intent: {
			operation: 'delete',
			expectedRevision: state.intent?.expectedRevision ?? confirmed.revision,
		},
		failure: null,
		error: '',
	});

	return true;
}

export function resetSenderAvatarIntent(state: SenderAvatarState): void
{
	Object.assign(state, {
		intent: null,
		selection: null,
		status: 'idle',
		failure: null,
		error: '',
	});
}

export function beginSenderAvatarSave(state: SenderAvatarState): SenderAvatarSaveSnapshot | null
{
	const intent = state.intent;
	if (!intent || !state.confirmed?.canManage || state.status !== 'editing'
		|| (intent.operation === 'replace' && !intent.uploadToken))
	{
		return null;
	}

	const requestId = state.requestId + 1;
	const change = intent.operation === 'delete'
		? { operation: 'delete' as const, expectedRevision: intent.expectedRevision }
		: {
			operation: 'replace' as const,
			expectedRevision: intent.expectedRevision,
			uploadToken: intent.uploadToken,
		}
	;
	Object.assign(state, { requestId, status: 'saving', failure: null, error: '' });

	return {
		messageId: state.messageId,
		requestId,
		selectionId: state.selection?.id ?? null,
		change,
	};
}

export function acceptSenderAvatarSave(
	state: SenderAvatarState,
	snapshot: SenderAvatarSaveSnapshot,
	data: Readonly<SenderAvatarData>,
): boolean
{
	if (!isSenderAvatarSaveCurrent(state, snapshot) || data.messageId !== snapshot.messageId
		|| !Number.isInteger(data.revision) || data.revision <= snapshot.change.expectedRevision
		|| (state.confirmed && data.revision <= state.confirmed.revision))
	{
		return false;
	}

	const intentIsCurrent = matchesSenderAvatarIntent(state, snapshot);
	Object.assign(state, {
		confirmed: cloneSenderAvatarData(data),
		intent: intentIsCurrent ? null : state.intent,
		selection: intentIsCurrent ? null : state.selection,
		status: intentIsCurrent ? 'idle' : 'editing',
		failure: null,
		error: '',
	});

	return true;
}

export function rejectSenderAvatarSave(
	state: SenderAvatarState,
	snapshot: SenderAvatarSaveSnapshot,
	message: string,
): boolean
{
	if (!isSenderAvatarSaveCurrent(state, snapshot) || !matchesSenderAvatarIntent(state, snapshot))
	{
		return false;
	}

	Object.assign(state, { status: 'failed', failure: 'save', error: message });

	return true;
}

export function requireSenderAvatarRefresh(
	state: SenderAvatarState,
	snapshot: SenderAvatarSaveSnapshot,
): boolean
{
	if (!isSenderAvatarSaveCurrent(state, snapshot))
	{
		return false;
	}

	// The prepared upload outlives the conflict on the server, so the selection stays: the intent is
	// dropped and has to be confirmed again against the revision that the refresh reads.
	Object.assign(state, {
		intent: null,
		status: 'refreshing',
		failure: null,
		error: '',
		requestId: state.requestId + 1,
	});

	return true;
}

function isSenderAvatarSaveCurrent(state: SenderAvatarState, snapshot: SenderAvatarSaveSnapshot): boolean
{
	return state.messageId === snapshot.messageId && state.requestId === snapshot.requestId;
}

function matchesSenderAvatarIntent(state: SenderAvatarState, snapshot: SenderAvatarSaveSnapshot): boolean
{
	const intent = state.intent;
	const change = snapshot.change;

	return (state.selection?.id ?? null) === snapshot.selectionId
		&& intent?.operation === change.operation
		&& intent.expectedRevision === change.expectedRevision
		&& (change.operation === 'delete'
			|| (intent.operation === 'replace' && intent.uploadToken === change.uploadToken))
	;
}

function cloneSenderAvatarData(data: Readonly<SenderAvatarData>): SenderAvatarData
{
	return {
		...data,
		errorMessages: data.errorMessages ? { ...data.errorMessages } : data.errorMessages,
		uploader: data.uploader
			? {
				...data.uploader,
				controllerOptions: { ...data.uploader.controllerOptions },
			}
			: null,
	};
}

function normalizeSenderAvatarData(data: Readonly<SenderAvatarData>): SenderAvatarData | null
{
	const messageId = normalizeSenderAvatarInteger(data.messageId);
	const revision = normalizeSenderAvatarInteger(data.revision);
	if (messageId === null || messageId === 0 || revision === null)
	{
		return null;
	}

	return cloneSenderAvatarData({ ...data, messageId, revision });
}

export function normalizeSenderAvatarInteger(value: unknown): number | null
{
	if (Type.isNumber(value))
	{
		return Number.isSafeInteger(value) && value >= 0 ? value : null;
	}

	if (!Type.isString(value) || !/^(?:0|[1-9]\d*)$/.test(value))
	{
		return null;
	}

	const normalized = Number(value);

	return Number.isSafeInteger(normalized) ? normalized : null;
}
