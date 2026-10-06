import { inject, reactive, type InjectionKey } from 'ui.vue3';

import {
	type ComposeScenario,
	Phrase,
	RecipientsPerFieldUnlimited,
	RecipientsTotalLimitDefault,
	Scenario,
} from '../../const';
import { loc } from '../../lib/loc/loc';
import {
	type AnalyticsState,
	type AttachmentsState,
	type BodyState,
	type CalendarSharingDto,
	type CalendarSharingState,
	type ComposeInitialData,
	type ComposeLimitsDto,
	type ComposeLimitsState,
	type ComposeState,
	type LargeAttachmentDto,
	type LargeAttachmentState,
	type PathsState,
	type RecipientsState,
	type SenderDto,
	type SendState,
	type SignatureItem,
	type SignatureItemDto,
	type SignaturesDto,
	type SignaturesState,
} from './types';

export const composeStateKey: InjectionKey<ComposeState> = Symbol('mail-compose-form-state');

export type RecipientFieldKind = keyof RecipientsState;

/** Both fields go into the request together or not at all. */
export type ReplySendFields = {
	inReplyTo: string,
	mailboxId: number,
};

const ReplyScenarios: Set<ComposeScenario> = new Set([Scenario.Reply, Scenario.ReplyAll]);

/** Injected without a default on purpose: a missing state is a mounting error, not a case to fall back on. */
export function useComposeState(): ComposeState
{
	const state = inject(composeStateKey);
	if (!state)
	{
		throw new Error('Compose form state was not provided.');
	}

	return state;
}

/** `null` when the sender list came empty or the payload preselected nothing. */
export function getSelectedSender(state: ComposeState): SenderDto | null
{
	return state.senders.find((sender) => sender.formated === state.selectedSender) ?? null;
}

export function getSelectedSenderMailboxId(state: ComposeState): number | null
{
	const selectedMailboxId = Number(getSelectedSender(state)?.mailboxId ?? 0);
	if (selectedMailboxId > 0)
	{
		return selectedMailboxId;
	}

	return state.mailbox.id ?? state.send.mailboxId;
}

export function isSelectedSenderMigrationActive(state: ComposeState): boolean
{
	const mailboxId = getSelectedSenderMailboxId(state);

	return mailboxId !== null && state.migrationActiveByMailboxId[mailboxId] === true;
}

/** Counts are per field: the tariff limits each field rather than the message as a whole. */
export function getRecipientCounts(state: ComposeState): Record<RecipientFieldKind, number>
{
	const { to, cc, bcc } = state.recipients;

	return { to: to.length, cc: cc.length, bcc: bcc.length };
}

export function getRecipientsTotalCount(state: ComposeState): number
{
	const counts = getRecipientCounts(state);

	return counts.to + counts.cc + counts.bcc;
}

export function isRecipientsTotalLimitExceeded(state: ComposeState): boolean
{
	return getRecipientsTotalCount(state) > state.limits.recipientsTotal;
}

/**
 * The local module option switches the whole scenario, while the tariff only decides what happens once
 * the file set is over the size limit.
 */
export function isLargeAttachmentEnabled(state: ComposeState): boolean
{
	return state.largeAttachment.localFeatureAvailable;
}

/**
 * Both fields are sent under one condition, as the markup of the old form did
 * (`mail.client.message.new/templates/.default/template.php`): `data[MAILBOX_ID]` on its own switches the
 * branch the server resolves the mailbox by, and a message that answers nothing would be stored in a
 * mailbox instead of being sent.
 */
export function getReplySendFields(state: ComposeState): ReplySendFields | null
{
	const { inReplyTo, mailboxId } = state.send;
	if (!ReplyScenarios.has(state.scenario) || inReplyTo === null || mailboxId === null)
	{
		return null;
	}

	return { inReplyTo, mailboxId };
}

/** Flags arrive as booleans, so a value of any other kind counts as off. */
function isEnabled(value: boolean | undefined): boolean
{
	return value === true;
}

function normalizeAddress(value: string | undefined): string
{
	return (value ?? '').trim().toLowerCase();
}

/** The contract gives such a field two states, a value or `null`, so an empty string collapses to `null`. */
function toValueOrNull(value: string | null | undefined): string | null
{
	const trimmed = (value ?? '').trim();

	return trimmed === '' ? null : trimmed;
}

function toPositiveIdOrNull(value: number | string | null | undefined): number | null
{
	const id = Number(value ?? 0);

	return id > 0 ? id : null;
}

function findSender(senders: SenderDto[], selectedSender: string, mailboxEmail: string): SenderDto
{
	if (selectedSender !== '')
	{
		const requested = senders.find((sender) => sender.formated === selectedSender);
		if (requested)
		{
			return requested;
		}
	}

	return senders.find((sender) => normalizeAddress(sender.email) === mailboxEmail) ?? senders[0];
}

/**
 * Returns a `formated` value that always points at an element of the list: the picker marks the selected
 * item by it, and a value outside the list would leave the form on a sender nobody can see.
 */
function resolveSelectedSender(
	senders: SenderDto[],
	selectedSender: string | null | undefined,
	mailboxEmail: string,
): string | null
{
	if (senders.length === 0)
	{
		return null;
	}

	const matched = findSender(senders, (selectedSender ?? '').trim(), mailboxEmail);

	return matched.formated === '' ? null : matched.formated;
}

function normalizeSignature(item: SignatureItemDto): SignatureItem
{
	const assignedAt = Number(item.assignedAt ?? 0);

	return {
		full: item.full ?? '',
		preview: item.preview ?? '',
		menuPreview: item.menuPreview,
		signatureId: toPositiveIdOrNull(item.signatureId) ?? 0,
		isShared: isEnabled(item.isShared),
		assignedAt: assignedAt > 0 ? assignedAt : null,
	};
}

/**
 * Kept in the shape the server sends; exported so that a refreshed list goes through the same
 * normalisation. The remembered choices stay as they came ("<signatureId>:<unixtime>"): the storage is
 * shared with the old form, and reshaping the value here would lose the choice made there.
 */
export function buildSignatures(signatures: SignaturesDto | undefined): SignaturesState
{
	const rawBySender = signatures?.bySender ?? {};
	const bySender: Record<string, SignatureItem[]> = {};

	Object.keys(rawBySender).forEach((senderKey) => {
		bySender[senderKey] = (rawBySender[senderKey] ?? []).map((item) => normalizeSignature(item));
	});

	return {
		bySender,
		choices: { ...signatures?.choices },
		settingsPath: signatures?.settingsPath ?? '',
	};
}

function buildRecipients(initialData: ComposeInitialData): RecipientsState
{
	return {
		to: initialData.recipients?.to ?? [],
		cc: initialData.recipients?.cc ?? [],
		bcc: initialData.recipients?.bcc ?? [],
	};
}

function buildBody(initialData: ComposeInitialData): BodyState
{
	return {
		quote: initialData.body?.quote ?? '',
		quoteFolded: isEnabled(initialData.body?.quoteFolded),
	};
}

function buildAttachments(initialData: ComposeInitialData): AttachmentsState
{
	return {
		files: initialData.attachments?.files ?? [],
		folded: isEnabled(initialData.attachments?.folded),
	};
}

/** A missing field limit keeps "no limit"; old payloads keep the historical total ceiling. */
function buildLimits(limits: ComposeLimitsDto | undefined): ComposeLimitsState
{
	return {
		recipientsPerField: limits?.recipientsPerField ?? RecipientsPerFieldUnlimited,
		recipientsTotal: limits?.recipientsTotal ?? RecipientsTotalLimitDefault,
		maxAttachmentsSize: limits?.maxAttachmentsSize ?? 0,
		maxAttachmentsSizeAfterEncoding: limits?.maxAttachmentsSizeAfterEncoding ?? 0,
	};
}

function buildCalendarSharing(calendarSharing: CalendarSharingDto | undefined): CalendarSharingState
{
	return {
		available: isEnabled(calendarSharing?.available),
		featureEnabled: isEnabled(calendarSharing?.featureEnabled),
		crmFeatureEnabled: isEnabled(calendarSharing?.crmFeatureEnabled),
		showTour: isEnabled(calendarSharing?.showTour),
		userCalendarPath: calendarSharing?.userCalendarPath ?? '',
	};
}

function buildLargeAttachment(largeAttachment: LargeAttachmentDto | undefined): LargeAttachmentState
{
	return {
		localFeatureAvailable: isEnabled(largeAttachment?.localFeatureAvailable),
		featureAvailable: isEnabled(largeAttachment?.featureAvailable),
		showAha: isEnabled(largeAttachment?.showAha),
		ahaOptionName: largeAttachment?.ahaOptionName ?? '',
		postSendPromptSuppressed: isEnabled(largeAttachment?.postSendPromptSuppressed),
		postSendPromptOptionName: largeAttachment?.postSendPromptOptionName ?? '',
		folderName: largeAttachment?.folderName ?? '',
	};
}

function buildSend(initialData: ComposeInitialData): SendState
{
	return {
		actionUrl: initialData.send?.actionUrl ?? '',
		inReplyTo: toValueOrNull(initialData.send?.inReplyTo),
		mailboxId: toPositiveIdOrNull(initialData.send?.mailboxId),
	};
}

function buildAnalytics(initialData: ComposeInitialData): AnalyticsState
{
	return {
		section: initialData.analytics?.section ?? '',
		element: initialData.analytics?.element ?? '',
	};
}

function buildPaths(initialData: ComposeInitialData): PathsState
{
	return {
		messageList: toValueOrNull(initialData.paths?.messageList),
		home: initialData.paths?.home ?? '',
		templatesManage: initialData.paths?.templatesManage ?? '',
	};
}

/**
 * A single reactive object rather than a store: the state is not shared with another Vue tree and does not
 * outlive unmounting. The payload is normalised here and nowhere else, so components read a state that
 * needs no further checks.
 */
export function createComposeState(initialData: ComposeInitialData = {}): ComposeState
{
	const senders = initialData.senders ?? [];
	const mailboxEmail = normalizeAddress(initialData.mailbox?.email);
	const recipients = buildRecipients(initialData);

	return reactive<ComposeState>({
		scenario: initialData.scenario ?? Scenario.New,
		title: initialData.title ?? loc(Phrase.TitleNew),
		messageId: initialData.messageId ?? 0,
		parentMessageId: toPositiveIdOrNull(initialData.parentMessageId),

		mailbox: {
			id: toPositiveIdOrNull(initialData.mailbox?.id),
			email: mailboxEmail,
		},
		senders,
		selectedSender: resolveSelectedSender(senders, initialData.selectedSender, mailboxEmail),

		recipients,
		// A row that already carries an address starts expanded.
		bccExpanded: recipients.bcc.length > 0,

		subject: initialData.subject ?? '',

		signatures: buildSignatures(initialData.signatures),
		// The default signature is resolved against the sender the user ends up on, not here.
		selectedSignatureId: null,

		body: buildBody(initialData),
		attachments: buildAttachments(initialData),

		limits: buildLimits(initialData.limits),
		calendarSharing: buildCalendarSharing(initialData.calendarSharing),
		copilot: initialData.copilot ?? { isCopilotEnabled: false },
		largeAttachment: buildLargeAttachment(initialData.largeAttachment),
		attachmentReminder: {
			enabled: isEnabled(initialData.attachmentReminder?.enabled),
		},

		send: buildSend(initialData),
		analytics: buildAnalytics(initialData),
		features: {
			unfinishedElements: isEnabled(initialData.features?.unfinishedElements),
			templates: isEnabled(initialData.features?.templates),
		},
		draft: {
			id: Math.max(0, Number(initialData.draft?.id ?? 0)),
			revision: Math.max(0, Number(initialData.draft?.revision ?? 0)),
			clientId: initialData.draft?.clientId ?? '',
			isLoading: false,
			restoreFailed: false,
		},
		templates: {
			recent: [],
			isLoaded: false,
			isLoading: false,
			error: null,
			selected: null,
			prepared: null,
			rememberLast: false,
			autoApply: {
				candidate: null,
				status: 'idle',
			},
		},
		paths: buildPaths(initialData),

		migrationActiveByMailboxId: {},
		isSending: false,
		errors: [],
	});
}
