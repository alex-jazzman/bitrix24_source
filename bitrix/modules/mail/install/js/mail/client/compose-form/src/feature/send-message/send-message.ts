import { Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import {
	type CreateUndoSendRequest,
	type UndoSendApiError,
	type UndoSendOperationDto,
} from 'mail.client.undo-send';

import { Phrase } from '../../const';
import {
	ComposeFormEvent,
	type ComposeFormEventPayload,
	SliderMessage,
} from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { type LargeAttachmentSendGate } from '../../infrastructure/adapter/large-attachment/large-attachment';
import { Api, type SendMessageResponse } from '../../infrastructure/service/compose/compose';
import {
	type AjaxError,
	type UndoSendGateway,
} from '../../infrastructure/service/compose/types';
import { loc } from '../../lib/loc/loc';
import { notifyPortal } from '../../lib/notification/notification';
import {
	getScheduleTimezoneId,
	getSelectedSender,
	isSelectedSenderMigrationActive,
} from '../../model/compose/compose';
import {
	type ComposeError,
	type ComposeState,
	type RecipientItemDto,
	type SenderDto,
} from '../../model/compose/types';
import { type AttachmentReminder } from '../attachment-reminder/attachment-reminder';
import { buildMessageBody } from '../build-message-body/build-message-body';
import { type CloseComposeForm } from '../close-form/close-form';
import { DraftBridgeEvent, getDraftWait } from '../draft-integration/draft-compose-adapter';
import { invalidateSubjectGeneration } from '../generate-subject/generate-subject';
import { buildScheduledBody } from '../schedule-message/scheduled-body';
import { validateMessage } from '../validate-message/validate-message';

/** Any other status in the response counts as a send error. */
const SuccessStatus = 'success';
const TemplateSaveWarningPhrase = 'MAIL_COMPOSE_FORM_TEMPLATE_SAVE_WARNING';

type SendResult =
	| { status: 'success', response: SendMessageResponse }
	| { status: 'error', errors: ComposeError[] };

const CrmRecipientEntities = new Set([
	'contact',
	'company',
	'lead',
	'mail_crm_recipient',
	'mail_recipient',
]);

export type SendMessageParams = {
	/** Identifier of the server-rendered form; carried by every event the form emits. */
	formId: string,
	state: ComposeState,
	editor: ComposeEditorAdapter,
	/** Writes the hidden fields and returns the form that is serialised, `null` when it left the DOM. */
	writeFields: (body: string) => HTMLFormElement | null,
	/** The one-shot skip lives in this instance, so the repeated send must get the same one. */
	reminder: AttachmentReminder,
	/** `null` when large attachments are disabled for the form. */
	largeAttachment: LargeAttachmentSendGate | null,
	closeForm: CloseComposeForm,
	undoSend?: UndoSendDependencies,
};

type UndoSendDependencies = UndoSendGateway & {
	show(operation: UndoSendOperationDto): Promise<void> | void,
};

const DefaultUndoSend: UndoSendDependencies = {
	create: (request: CreateUndoSendRequest): ReturnType<UndoSendGateway['create']> => (
		Api.createUndoSend(request)
	),
	show: (operation: UndoSendOperationDto): Promise<void> => Api.showUndoSend(operation),
};

type UndoSendRequestPayload = Omit<CreateUndoSendRequest, 'idempotencyKey'>;

const undoSendAttempts = new WeakMap<ComposeState, { fingerprint: string, key: string }>();

/** Kept as one function: the order of the steps is the send contract, and each step can stop the send. */
export async function sendMessage(params: SendMessageParams): Promise<void>
{
	const { state, editor, largeAttachment, formId } = params;

	// A send already in flight or a form with an untrusted restored state is left alone.
	if (state.isSending || state.draft.restoreFailed)
	{
		return;
	}

	if (isSelectedSenderMigrationActive(state))
	{
		return;
	}

	if (!passesChecks(params))
	{
		return;
	}

	// Runs before the body is assembled: the large attachment core restores the links the user deleted,
	// so a body built earlier would go without them.
	if (largeAttachment && !largeAttachment.prepareSend())
	{
		return;
	}

	// A body that cannot be assembled is not sent as what is left of it: an answer whose quote was dropped
	// leaves the recipient without the message it answers, and the user without a word about it.
	const body = buildMessageBody(editor, state.body);
	if (body === null)
	{
		state.errors = [{ message: loc(Phrase.ErrorQuoteLost), code: null }];

		return;
	}

	state.isSending = true;

	// The letter is on its way out: a subject generated after this point would go either into a message
	// already sent or into a form already closed.
	invalidateSubjectGeneration(state);

	try
	{
		const draftWait = getDraftWait(DraftBridgeEvent.BeforeSubmit, formId);
		if (draftWait)
		{
			try
			{
				await draftWait;
			}
			catch
			{
				state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: null }];
				emitFormEvent(ComposeFormEvent.SendError, formId);

				return;
			}
		}

		// The draft flush can create a draft or advance its revision, so the hidden identity fields must be
		// written only after every draft listener has finished.
		const undoSend = params.undoSend ?? DefaultUndoSend;
		if (shouldUseUndoSend(state))
		{
			const request = createUndoSendRequest(state, editor, largeAttachment);
			if (request !== null)
			{
				await createUndoSend(params, undoSend, request, body);

				return;
			}
		}

		await deliverImmediately(params, body);
	}
	finally
	{
		state.isSending = false;
	}
}

function shouldUseUndoSend(state: ComposeState): boolean
{
	if (
		state.scheduledMessage.id > 0
		|| state.mailbox.id === null
		|| hasCrmRecipients(state)
	)
	{
		return false;
	}

	return state.features.undoSend;
}

function hasCrmRecipients(state: ComposeState): boolean
{
	return [
		...state.recipients.to,
		...state.recipients.cc,
		...state.recipients.bcc,
	].some((recipient: RecipientItemDto): boolean => {
		const customData = recipient.customData as Record<string, unknown> | undefined;
		const entityType = String(customData?.entityType ?? '');

		return CrmRecipientEntities.has(recipient.entityId)
			|| (recipient.entityId === 'address_book' && CrmRecipientEntities.has(entityType));
	});
}

async function deliverImmediately(params: SendMessageParams, body: string): Promise<void>
{
	const { formId, state, writeFields } = params;
	const form = writeFields(body);
	if (!form)
	{
		state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: null }];

		return;
	}

	EventEmitter.emit(ComposeFormEvent.Submit, { formId, body });
	await deliver(params, form);
}

async function createUndoSend(
	params: SendMessageParams,
	undoSend: UndoSendDependencies,
	request: CreateUndoSendRequest,
	messageBody: string,
): Promise<void>
{
	const { closeForm, formId, state } = params;
	try
	{
		const operation = await undoSend.create(request);
		EventEmitter.emit(ComposeFormEvent.Submit, { formId, body: messageBody });
		EventEmitter.emit(DraftBridgeEvent.SubmitAjaxSuccess, { formId, data: {} });
		emitFormEvent(ComposeFormEvent.SendSuccess, formId);
		SidePanel.Instance.postMessage(window, SliderMessage.MessageCreated, {
			undoSendProjection: {
				operationId: operation.operationId,
				draftId: state.draft.id,
				cancelUntil: operation.cancelUntil,
				recipients: {
					to: request.recipients.to.map(({ email, name }) => ({ email, name: name ?? '' })),
					cc: (request.recipients.cc ?? []).map(({ email, name }) => ({ email, name: name ?? '' })),
					bcc: (request.recipients.bcc ?? []).map(({ email, name }) => ({ email, name: name ?? '' })),
				},
				subject: operation.subject ?? request.subject,
			},
		});
		try
		{
			await undoSend.show(operation);
		}
		catch
		{
			// The operation is already accepted; a notification failure must not send it twice.
		}
		closeForm();
	}
	catch (error)
	{
		const apiError = error as UndoSendApiError;
		if (
			apiError.code === 'feature_unavailable'
			|| apiError.code === 'preference_disabled'
		)
		{
			await deliverImmediately(params, messageBody);

			return;
		}

		state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: apiError.code ?? null }];
		emitFormEvent(ComposeFormEvent.SendError, formId);
	}
}

function createUndoSendRequest(
	state: ComposeState,
	editor: ComposeEditorAdapter,
	largeAttachment: LargeAttachmentSendGate | null,
): CreateUndoSendRequest | null
{
	const sender = getSelectedSender(state);
	const body = buildScheduledBody(editor, state);
	if (sender === null || state.mailbox.id === null || body === null)
	{
		return null;
	}

	const payload: UndoSendRequestPayload = {
		mailboxId: state.mailbox.id,
		inReplyTo: state.send.inReplyTo,
		sender: toUndoSendSender(sender),
		recipients: {
			to: state.recipients.to.map((recipient) => toUndoSendRecipient(recipient)),
			cc: state.recipients.cc.map((recipient) => toUndoSendRecipient(recipient)),
			bcc: state.recipients.bcc.map((recipient) => toUndoSendRecipient(recipient)),
		},
		subject: state.subject,
		// The scheduled-body marks make a cancelled operation restorable without duplicating form blocks.
		body,
		attachments: editor.getFiles()
			.filter((file): boolean => file.id !== null)
			.map((file) => ({
				objectId: file.id as number,
				fileName: file.name,
				isInline: false,
			})),
		largeAttachments: (largeAttachment?.getDraftState() ?? []).map((attachment) => ({
			token: attachment.token,
			publicUrl: attachment.publicUrl,
			fileIds: [...attachment.fileIds],
			sourceFileIds: [...attachment.sourceFileIds],
			tokenFileIds: [...(attachment.tokenFileIds ?? attachment.sourceFileIds)],
		})),
		timezoneId: state.authorTimezoneId || getScheduleTimezoneId(state),
		...(state.draft.id > 0 && state.draft.revision > 0
			? { draftId: state.draft.id, draftRevision: state.draft.revision }
			: {}),
		/*
		 * The held-back letter leaves later, from the background dispatcher, so the portal keeps the template
		 * at the moment the letter is accepted: the template of the author does not depend on the delivery.
		 * An untouched box changes no payload.
		 */
		...(state.features.saveTemplate && state.saveAsTemplate ? { saveAsTemplate: true } : {}),
	};

	return {
		...payload,
		idempotencyKey: getUndoSendIdempotencyKey(state, payload),
	};
}

function getUndoSendIdempotencyKey(state: ComposeState, payload: UndoSendRequestPayload): string
{
	const { draftRevision: _draftRevision, ...stablePayload } = payload;
	const fingerprint = JSON.stringify(stablePayload);
	const previousAttempt = undoSendAttempts.get(state);
	if (previousAttempt?.fingerprint === fingerprint)
	{
		return previousAttempt.key;
	}

	const attempt = { fingerprint, key: Text.getRandom(32) };
	undoSendAttempts.set(state, attempt);

	return attempt.key;
}

function toUndoSendSender(sender: SenderDto): CreateUndoSendRequest['sender']
{
	return {
		email: sender.email,
		name: sender.name,
		...(Type.isStringFilled(sender.avatar) ? { avatar: sender.avatar } : {}),
	};
}

function toUndoSendRecipient(item: RecipientItemDto): CreateUndoSendRequest['recipients']['to'][number]
{
	const customData = item.customData as Record<string, unknown> | undefined;

	return {
		email: String(customData?.email ?? item.id),
		name: String(customData?.name ?? ''),
		...(Type.isStringFilled(item.avatar) ? { avatar: item.avatar } : {}),
	};
}

/**
 * Validation runs before the reminder: an empty recipient field must not raise the reminder dialog and the
 * validation error at once.
 */
function passesChecks(params: SendMessageParams): boolean
{
	const { state, editor, reminder } = params;

	state.errors = validateMessage({ state, files: editor.getFiles() });
	if (state.errors.length > 0)
	{
		return false;
	}

	// The dialog repeats the send it held back, and that second pass spends the one-shot skip.
	return !reminder.check();
}

async function deliver(params: SendMessageParams, form: HTMLFormElement): Promise<void>
{
	const { state, formId } = params;

	const result = await send(form);

	if (result.status === SuccessStatus)
	{
		const templateSaveWarning = result.response.data?.templateSaveWarning === true;
		if (templateSaveWarning)
		{
			notifyPortal(loc(TemplateSaveWarningPhrase), { role: 'alert', closeButton: false });
		}

		EventEmitter.emit(DraftBridgeEvent.SubmitAjaxSuccess, {
			formId,
			data: result.response,
		});
		emitFormEvent(ComposeFormEvent.SendSuccess, formId);
		finishSuccessfulSend(params, !templateSaveWarning);

		return;
	}

	state.errors = result.errors;
	emitFormEvent(ComposeFormEvent.SendError, formId);
}

/**
 * The slider message is posted before the panel closes: closing takes the frame of the form down, and a
 * message posted from a dying frame reaches nobody.
 */
function finishSuccessfulSend(params: SendMessageParams, showNotification: boolean = true): void
{
	SidePanel.Instance.postMessage(window, SliderMessage.MessageCreated, {});
	if (showNotification)
	{
		notifyPortal(loc(Phrase.SendSuccess));
	}
	params.closeForm();
}

/** A non-success status and a failed request are both errors. */
async function send(form: HTMLFormElement): Promise<SendResult>
{
	try
	{
		const response: SendMessageResponse = await Api.sendMessage(form);

		if (response.status === SuccessStatus)
		{
			return { status: SuccessStatus, response };
		}

		return { status: 'error', errors: toComposeErrors(response.errors) };
	}
	catch
	{
		return { status: 'error', errors: toComposeErrors() };
	}
}

/**
 * The code of a refusal is the one the server named — the send service and the large attachment gate both
 * name theirs — and a refusal named without a code keeps `code: null` instead of an invented one. An empty
 * list falls back to the own phrase: a send that fails silently leaves the user without a reason.
 */
function toComposeErrors(errors?: AjaxError[]): ComposeError[]
{
	const known = (errors ?? []).map((error: AjaxError): ComposeError => {
		const code = String(error.code ?? '');

		return {
			message: error.message,
			code: code === '' ? null : code,
		};
	});

	return known.length > 0 ? known : [{ message: loc(Phrase.ErrorSendFailed), code: null }];
}

function emitFormEvent(eventName: string, formId: string): void
{
	const payload: ComposeFormEventPayload = { formId };
	EventEmitter.emit(eventName, payload);
}
